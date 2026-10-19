import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { couponsDB, auditLogsDB } from '../config/db.js';
import { couponLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/validate', couponLimiter, async (req, res) => {
  try {
    const { code, subtotal, cartTotal, customerEmail } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const orderSubtotal = Number(subtotal ?? cartTotal) || 0;

    const normalizedCode = code.toUpperCase().trim();
    const coupon = await couponsDB.findOne({ code: normalizedCode });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    const now = new Date();
    if (!coupon.isActive) return res.status(400).json({ success: false, message: 'Coupon is inactive' });
    if (new Date(coupon.startDate) > now) return res.status(400).json({ success: false, message: 'Coupon is not yet active' });
    if (new Date(coupon.expiryDate) < now) return res.status(400).json({ success: false, message: 'Coupon has expired' });

    if (orderSubtotal < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum order amount of ₹${coupon.minOrderAmount} required` });
    }

    if (coupon.usageLimitTotal && coupon.usedCount >= coupon.usageLimitTotal) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit has been reached' });
    }

    if (customerEmail && coupon.perCustomerLimit) {
      const timesUsed = (coupon.usedByCustomers || []).filter(c => c.email.toLowerCase() === customerEmail.toLowerCase()).length;
      if (timesUsed >= coupon.perCustomerLimit) {
        return res.status(400).json({ success: false, message: 'You have already used this coupon' });
      }
    }

    let discountAmount = 0;
    if (coupon.discountType === 'fixed') {
      discountAmount = Math.min(coupon.discountValue, orderSubtotal);
    } else if (coupon.discountType === 'percentage') {
      discountAmount = (orderSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    }

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount),
      },
      message: 'Coupon applied successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const coupons = (await couponsDB.find({})).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      expiryDate,
      usageLimitTotal,
      perCustomerLimit,
      description,
    } = req.body;

    if (!code || !discountValue || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Code, discount value, and expiry date are required' });
    }

    const normalizedCode = code.toUpperCase().trim();
    const existing = await couponsDB.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await couponsDB.insert({
      code: normalizedCode,
      discountType: discountType || 'fixed',
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      startDate: startDate ? new Date(startDate) : new Date(),
      expiryDate: new Date(expiryDate),
      usageLimitTotal: usageLimitTotal ? Number(usageLimitTotal) : null,
      usedCount: 0,
      perCustomerLimit: Number(perCustomerLimit) || 1,
      usedByCustomers: [],
      description: description || '',
      isActive: true,
      createdAt: new Date(),
    });

    res.status(201).json({ success: true, message: 'Coupon created successfully', coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/toggle', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const coupon = await couponsDB.findOne({ _id: req.params.id });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    await couponsDB.update({ _id: req.params.id }, { $set: { isActive: !coupon.isActive } });
    res.json({ success: true, message: `Coupon is now ${!coupon.isActive ? 'active' : 'inactive'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
