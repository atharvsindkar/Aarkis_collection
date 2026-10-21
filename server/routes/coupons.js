import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { couponsDB, auditLogsDB } from '../config/db.js';
import { couponLimiter } from '../middleware/rateLimiters.js';
import { sendInternalError } from '../middleware/errorHandler.js';

const router = express.Router();

// Public endpoint for announcement bar & customer vouchers
router.get('/public', async (req, res) => {
  try {
    const allCoupons = await couponsDB.find({ isActive: true });
    const now = new Date();
    const active = allCoupons.filter(c => {
      if (c.startDate && new Date(c.startDate) > now) return false;
      if (c.expiryDate && new Date(c.expiryDate) < now) return false;
      return true;
    });

    res.json({
      success: true,
      coupons: active.map(c => ({
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderAmount: c.minOrderAmount,
        maxDiscountAmount: c.maxDiscountAmount,
        description: c.description
      }))
    });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to retrieve public promotions.');
  }
});

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

    const limitTotal = coupon.usageLimitTotal !== undefined && coupon.usageLimitTotal !== null 
      ? coupon.usageLimitTotal 
      : coupon.usageLimit;
    const currentCount = coupon.usedCount !== undefined ? coupon.usedCount : (coupon.usageCount || 0);

    if (limitTotal && currentCount >= limitTotal) {
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
    return sendInternalError(res, error, 'Coupon validation encountered an error.');
  }
});

router.get('/', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const coupons = (await couponsDB.find({})).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, coupons });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to fetch coupons.');
  }
});

router.get('/admin/all', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const coupons = (await couponsDB.find({})).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, coupons });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to fetch administrative coupons.');
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
      usageLimit,
      usageLimitTotal,
      perCustomerLimit,
      description,
    } = req.body;

    if (!code || discountValue === undefined || discountValue === null || discountValue === '') {
      return res.status(400).json({ success: false, message: 'Coupon code and discount value are required' });
    }

    const normalizedCode = code.toUpperCase().trim();
    const existing = await couponsDB.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    // Default expiry to 1 year from now if not supplied
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const resolvedExpiry = expiryDate ? new Date(expiryDate) : oneYearLater;
    const resolvedUsageLimit = usageLimitTotal !== undefined && usageLimitTotal !== null
      ? Number(usageLimitTotal)
      : (usageLimit !== undefined && usageLimit !== null && usageLimit !== '' ? Number(usageLimit) : null);

    const coupon = await couponsDB.insert({
      code: normalizedCode,
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      startDate: startDate ? new Date(startDate) : new Date(),
      expiryDate: resolvedExpiry,
      usageLimitTotal: resolvedUsageLimit,
      usageLimit: resolvedUsageLimit,
      usedCount: 0,
      usageCount: 0,
      perCustomerLimit: Number(perCustomerLimit) || 1,
      usedByCustomers: [],
      description: description || '',
      isActive: true,
      createdAt: new Date(),
    });

    res.status(201).json({ success: true, message: 'Coupon created successfully', coupon });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to create coupon.');
  }
});

router.delete('/:id', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const coupon = await couponsDB.findOne({ _id: req.params.id });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    await couponsDB.remove({ _id: req.params.id });
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to delete coupon.');
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
    return sendInternalError(res, error, 'Failed to toggle coupon status.');
  }
});

export default router;
