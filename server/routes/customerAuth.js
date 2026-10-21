import express from 'express';
import jwt from 'jsonwebtoken';
import { usersDB, ordersDB, subscribersDB } from '../config/db.js';
import { otpLimiter } from '../middleware/rateLimiters.js';
import { sendInternalError } from '../middleware/errorHandler.js';
import { sendEmail, generateOtpEmailHtml } from '../services/emailService.js';

const router = express.Router();

const generateCustomerToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Server configuration error: JWT_SECRET environment variable is missing');
  }
  return jwt.sign({ id, role: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// In-memory OTP storage for phone & email verification (10m TTL)
const otpStore = new Map();
const emailOtpStore = new Map();

// Helper to clean phone numbers
const sanitizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)]/g, '');
};

// ==========================================
// EMAIL OTP AUTHENTICATION (Resend Engine)
// ==========================================

// 1. POST /api/customer/auth/send-email-otp
router.post('/send-email-otp', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@') || email.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required to receive your verification code.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const otp = process.env.NODE_ENV === 'test' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes TTL

    emailOtpStore.set(cleanEmail, { otp, expiresAt, email: cleanEmail });

    // Look up existing patron name if available
    const existing = await usersDB.findOne({ email: cleanEmail });
    const patronName = existing?.name || 'Patron';

    // Dispatch via Resend / Email Service
    const dispatchResult = await sendEmail({
      to: cleanEmail,
      subject: `Your Aarkis Passcode: ${otp}`,
      html: generateOtpEmailHtml(otp, patronName),
      text: `Your Aarkis Collection authentication code is: ${otp}. It will expire in 10 minutes.`
    });

    if (!dispatchResult.success && process.env.NODE_ENV === 'production') {
      return res.status(502).json({
        success: false,
        message: 'Unable to deliver verification email at this moment. Please try again or verify your address.'
      });
    }

    res.json({
      success: true,
      message: `A single-use verification code has been dispatched to ${cleanEmail}.`
    });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to send email verification code.');
  }
});

// 2. POST /api/customer/auth/verify-email-otp
router.post('/verify-email-otp', otpLimiter, async (req, res) => {
  try {
    const { email, otp, fullName } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!cleanEmail || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email address and 6-digit passcode are required.'
      });
    }

    const record = emailOtpStore.get(cleanEmail);
    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No verification request found for this email, or code has expired. Please request a new code.'
      });
    }

    if (new Date() > record.expiresAt) {
      emailOtpStore.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect verification code. Please check your email and try again.'
      });
    }

    // Purge OTP immediately after successful use
    emailOtpStore.delete(cleanEmail);

    // Find or create customer account
    let customer = await usersDB.findOne({ email: cleanEmail });
    if (!customer) {
      customer = await usersDB.insert({
        name: fullName?.trim() || 'Aarkis Patron',
        email: cleanEmail,
        role: 'customer',
        isActive: true,
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else if (fullName?.trim() && (!customer.name || customer.name === 'Aarkis Patron')) {
      await usersDB.update({ _id: customer._id }, { $set: { name: fullName.trim(), updatedAt: new Date() } });
      customer = await usersDB.findOne({ _id: customer._id });
    }

    const token = generateCustomerToken(customer._id);

    res.json({
      success: true,
      message: 'Email successfully verified. Welcome to your Aarkis wardrobe.',
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        addresses: customer.addresses || []
      }
    });
  } catch (error) {
    return sendInternalError(res, error, 'Email verification failed.');
  }
});

// 1. POST /api/customer/auth/send-otp
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { phone, email } = req.body;
    const cleanPhone = sanitizePhone(phone);

    if (!cleanPhone || cleanPhone.replace(/\+/g, '').length < 10) {
      return res.status(400).json({
        success: false,
        message: 'A valid phone number with at least 10 digits is strictly required to receive OTP.'
      });
    }

    const otp = process.env.NODE_ENV === 'test' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    otpStore.set(cleanPhone, {
      otp,
      expiresAt,
      phone: cleanPhone,
      email: email ? email.toLowerCase().trim() : ''
    });

    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG === 'true') {
      const maskedPhone = cleanPhone.length > 4 ? `${cleanPhone.slice(0, 3)}****${cleanPhone.slice(-2)}` : '[REDACTED]';
      console.log(`\n🔑 [CUSTOMER OTP DISPATCH] Phone: ${maskedPhone} | OTP: [REDACTED IN LOGS] (Valid 10 mins)\n`);
    }

    res.json({
      success: true,
      message: process.env.NODE_ENV === 'production'
        ? `OTP sent successfully to ${cleanPhone}.`
        : `OTP sent successfully to ${cleanPhone}. (For dev testing, check console or use ${otp})`,
      devOtp: (process.env.NODE_ENV !== 'production' && process.env.DEBUG === 'true') ? otp : undefined
    });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to generate authentication code. Please try again.');
  }
});

// 2. POST /api/customer/auth/verify-otp
router.post('/verify-otp', otpLimiter, async (req, res) => {
  try {
    const { phone, otp, fullName } = req.body;
    const cleanPhone = sanitizePhone(phone);

    if (!cleanPhone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and 6-digit OTP are required.'
      });
    }

    const record = otpStore.get(cleanPhone);
    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP request found for this phone number. Please request a new OTP.'
      });
    }

    if (new Date() > record.expiresAt) {
      otpStore.delete(cleanPhone);
      return res.status(400).json({
        success: false,
        message: 'This OTP has expired. Please request a new one.'
      });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please enter the correct 6-digit verification code.'
      });
    }

    let customer = await usersDB.findOne({ phone: cleanPhone });
    if (!customer) {
      customer = await usersDB.insert({
        phone: cleanPhone,
        email: record.email || '',
        name: (fullName && fullName.trim()) || 'Aarkis Patron',
        role: 'customer',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      const updates = {};
      if (record.email && !customer.email) updates.email = record.email;
      if (fullName && fullName.trim() && customer.name === 'Aarkis Patron') updates.name = fullName.trim();
      if (!customer.addresses) updates.addresses = [];
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date();
        await usersDB.update({ _id: customer._id }, { $set: updates });
        customer = await usersDB.findOne({ _id: customer._id });
      }
    }

    otpStore.delete(cleanPhone);
    const token = generateCustomerToken(customer._id);

    res.json({
      success: true,
      message: 'Successfully verified and signed in',
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        addresses: customer.addresses || []
      }
    });
  } catch (error) {
    return sendInternalError(res, error, 'Authentication failed. Please verify your one-time passcode.');
  }
});

// Helper middleware to get authenticated customer
const getAuthCustomer = async (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      if (!process.env.JWT_SECRET) return null;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return await usersDB.findOne({ _id: decoded.id });
    } catch {
      // Ignore token parse failure if phone query is supplied
    }
  }

  const phone = req.query.phone || req.body?.phone;
  if (phone) {
    const cleanPhone = sanitizePhone(phone);
    const last10 = cleanPhone.slice(-10);
    const users = await usersDB.find({});
    return users.find(u => (u.phone || '').replace(/[\s\-\(\)\+]/g, '').endsWith(last10));
  }
  return null;
};

// 3. GET /api/customer/auth/me
router.get('/me', async (req, res) => {
  try {
    const customer = await getAuthCustomer(req);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    res.json({
      success: true,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        addresses: customer.addresses || []
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Session error' });
  }
});

// 4. GET /api/customer/auth/addresses
router.get('/addresses', async (req, res) => {
  try {
    const customer = await getAuthCustomer(req);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Customer authentication required' });
    }
    res.json({ success: true, addresses: customer.addresses || [] });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to retrieve addresses.');
  }
});

// 5. POST /api/customer/auth/addresses - Add New Address
router.post('/addresses', async (req, res) => {
  try {
    const customer = await getAuthCustomer(req);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Customer authentication required' });
    }

    const { fullName, addressLine1, city, state, postalCode, country = 'India', isDefault = false } = req.body;
    if (!addressLine1 || !city || !postalCode) {
      return res.status(400).json({ success: false, message: 'Street address, city, and pincode are required' });
    }

    const currentAddresses = customer.addresses || [];
    const addrId = `addr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newAddress = {
      id: addrId,
      _id: addrId,
      label: req.body.label || 'Home',
      fullName: fullName || customer.name || 'Patron',
      phone: req.body.phone || customer.phone || '',
      addressLine1: addressLine1.trim(),
      addressLine2: (req.body.addressLine2 || '').trim(),
      city: city.trim(),
      state: state ? state.trim() : 'Maharashtra',
      postalCode: postalCode.trim(),
      country: country || 'India',
      isDefault: isDefault || currentAddresses.length === 0
    };

    if (newAddress.isDefault) {
      currentAddresses.forEach(a => { a.isDefault = false; });
    }

    currentAddresses.push(newAddress);
    await usersDB.update({ _id: customer._id }, { $set: { addresses: currentAddresses, updatedAt: new Date() } });

    res.status(201).json({ success: true, message: 'Address saved successfully', addresses: currentAddresses, address: newAddress });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to save address.');
  }
});

// 6. PUT /api/customer/auth/addresses/:id - Edit Address
router.put('/addresses/:id', async (req, res) => {
  try {
    const customer = await getAuthCustomer(req);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Customer authentication required' });
    }

    const { fullName, addressLine1, city, state, postalCode, country, isDefault } = req.body;
    let currentAddresses = customer.addresses || [];
    const targetIdx = currentAddresses.findIndex(a => a.id === req.params.id || a._id === req.params.id);

    if (targetIdx === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (isDefault) {
      currentAddresses.forEach(a => { a.isDefault = false; });
    }

    currentAddresses[targetIdx] = {
      ...currentAddresses[targetIdx],
      fullName: fullName !== undefined ? fullName : currentAddresses[targetIdx].fullName,
      addressLine1: addressLine1 !== undefined ? addressLine1.trim() : currentAddresses[targetIdx].addressLine1,
      city: city !== undefined ? city.trim() : currentAddresses[targetIdx].city,
      state: state !== undefined ? state.trim() : currentAddresses[targetIdx].state,
      postalCode: postalCode !== undefined ? postalCode.trim() : currentAddresses[targetIdx].postalCode,
      country: country !== undefined ? country : currentAddresses[targetIdx].country,
      isDefault: isDefault !== undefined ? Boolean(isDefault) : currentAddresses[targetIdx].isDefault
    };

    await usersDB.update({ _id: customer._id }, { $set: { addresses: currentAddresses, updatedAt: new Date() } });

    res.json({ success: true, message: 'Address updated successfully', addresses: currentAddresses });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to update address.');
  }
});

// 7. DELETE /api/customer/auth/addresses/:id - Delete Address
router.delete('/addresses/:id', async (req, res) => {
  try {
    const customer = await getAuthCustomer(req);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Customer authentication required' });
    }

    let currentAddresses = customer.addresses || [];
    currentAddresses = currentAddresses.filter(a => a.id !== req.params.id && a._id !== req.params.id);

    if (currentAddresses.length > 0 && !currentAddresses.some(a => a.isDefault)) {
      currentAddresses[0].isDefault = true;
    }

    await usersDB.update({ _id: customer._id }, { $set: { addresses: currentAddresses, updatedAt: new Date() } });

    res.json({ success: true, message: 'Address deleted successfully', addresses: currentAddresses });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to delete address.');
  }
});

// 8. DELETE /api/customer/auth/delete-account - GDPR / DPDP Customer Right to Erasure & Account Deletion
router.delete('/delete-account', async (req, res) => {
  try {
    const customer = await getAuthCustomer(req);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Authentication required to delete account' });
    }

    const customerId = customer._id;
    const customerPhone = customer.phone;
    const customerEmail = customer.email;

    // 1. Delete patron user profile from users database
    await usersDB.remove({ _id: customerId }, {});

    // 2. Anonymize all personal data from order records (retaining financial records for legal compliance while scrubbing PII)
    const orderFilter = [];
    if (customerPhone) orderFilter.push({ 'customer.phone': customerPhone });
    if (customerEmail) orderFilter.push({ 'customer.email': customerEmail });

    if (orderFilter.length > 0) {
      const orders = await ordersDB.find({ $or: orderFilter });
      for (const ord of orders) {
        await ordersDB.update(
          { _id: ord._id },
          {
            $set: {
              'customer.fullName': '[ANONYMIZED PATRON]',
              'customer.email': 'erased@anonymized.local',
              'customer.phone': '[REDACTED]',
              'shippingAddress.fullName': '[ANONYMIZED PATRON]',
              'shippingAddress.addressLine1': '[REDACTED]',
              'shippingAddress.addressLine2': '',
              'shippingAddress.phone': '[REDACTED]',
              isAnonymized: true,
              anonymizedAt: new Date()
            }
          }
        );
      }
    }

    // 3. Remove customer from subscriber newsletter list if present
    if (customerEmail) {
      await subscribersDB.remove({ email: customerEmail.toLowerCase().trim() }, {});
    }

    res.json({
      success: true,
      message: 'Your patron account, saved addresses, and personal identifiable information have been permanently deleted and anonymized.'
    });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to complete account deletion request.');
  }
});

export default router;
