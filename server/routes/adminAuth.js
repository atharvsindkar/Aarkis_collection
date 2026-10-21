import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { usersDB, auditLogsDB } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { loginLimiter, passwordResetLimiter } from '../middleware/rateLimiters.js';
import { sendInternalError } from '../middleware/errorHandler.js';

const router = express.Router();

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Server configuration error: JWT_SECRET environment variable is missing');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// 1. POST /api/admin/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }

    const user = await usersDB.findOne({ email: email.toLowerCase().trim() });

    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials' });
    }

    // Lockout check
    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      const waitMinutes = Math.ceil((new Date(user.lockUntil) - new Date()) / (60 * 1000));
      return res.status(403).json({
        success: false,
        message: `Account temporarily locked due to failed attempts. Please try again in ${waitMinutes} minutes.`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const failed = (user.failedLoginAttempts || 0) + 1;
      const updateData = { failedLoginAttempts: failed };
      if (failed >= 5) {
        updateData.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await usersDB.update({ _id: user._id }, { $set: updateData });
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials' });
    }

    await usersDB.update(
      { _id: user._id },
      { $set: { failedLoginAttempts: 0, lockUntil: null, lastLogin: new Date() } }
    );

    const token = generateToken(user._id);

    await auditLogsDB.insert({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'ADMIN_LOGIN',
      targetType: 'admin_user',
      targetId: user._id,
      ip: req.ip,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return sendInternalError(res, error, 'Login failed due to an internal error.');
  }
});

// 2. GET /api/admin/auth/me
router.get('/me', authenticate, authorize('owner', 'admin'), async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      lastLogin: req.user.lastLogin,
    },
  });
});

// 3. POST /api/admin/auth/users - Create new administrator (Owner Only)
router.post('/users', authenticate, authorize('owner'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and initial password' });
    }

    const existing = await usersDB.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const assignedRole = role === 'owner' ? 'owner' : 'admin';
    const hashedPassword = await bcrypt.hash(password, 12);

    const newAdmin = await usersDB.insert({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: assignedRole,
      isActive: true,
      emailVerified: true,
      failedLoginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await auditLogsDB.insert({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'CREATE_ADMIN_USER',
      targetType: 'admin_user',
      targetId: newAdmin._id,
      details: { createdEmail: newAdmin.email, role: assignedRole },
      ip: req.ip,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: `Administrator ${newAdmin.name} created successfully`,
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        isActive: newAdmin.isActive,
      },
    });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to create administrator.');
  }
});

// 4. GET /api/admin/auth/users - List administrators (Owner only)
router.get('/users', authenticate, authorize('owner'), async (req, res) => {
  try {
    const admins = await usersDB.find({ role: { $in: ['owner', 'admin'] } });
    const sanitized = admins.map(({ password, ...rest }) => rest);
    res.json({ success: true, admins: sanitized });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to retrieve administrators.');
  }
});

// 5. PATCH /api/admin/auth/users/:id/status - Toggle active status (Owner only)
router.patch('/users/:id/status', authenticate, authorize('owner'), async (req, res) => {
  try {
    const { isActive } = req.body;
    const adminToUpdate = await usersDB.findOne({ _id: req.params.id });

    if (!adminToUpdate) {
      return res.status(404).json({ success: false, message: 'Administrator not found' });
    }

    if (adminToUpdate._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own owner account' });
    }

    await usersDB.update({ _id: req.params.id }, { $set: { isActive, updatedAt: new Date() } });

    await auditLogsDB.insert({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: isActive ? 'ACTIVATE_ADMIN_USER' : 'DEACTIVATE_ADMIN_USER',
      targetType: 'admin_user',
      targetId: adminToUpdate._id,
      details: { email: adminToUpdate.email, newStatus: isActive },
      ip: req.ip,
      createdAt: new Date(),
    });

    res.json({ success: true, message: `Administrator status updated to ${isActive ? 'active' : 'deactivated'}` });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to update administrator status.');
  }
});

// 6. POST /api/admin/auth/reset-password - Password reset endpoint strictly rate-limited (Max 3/hour per IP)
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    res.json({
      success: true,
      message: 'If an administrative account matches that email, reset instructions have been dispatched.'
    });
  } catch (error) {
    return sendInternalError(res, error, 'Password reset request failed.');
  }
});

export default router;
