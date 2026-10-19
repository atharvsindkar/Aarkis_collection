import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['fixed', 'percentage'],
      default: 'fixed',
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value must be positive'],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    usageLimitTotal: {
      type: Number,
      default: null, // null = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    perCustomerLimit: {
      type: Number,
      default: 1,
    },
    usedByCustomers: [
      {
        email: String,
        usedAt: Date,
        orderNumber: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    description: String,
  },
  {
    timestamps: true,
  }
);

// Method to validate eligibility on server
couponSchema.methods.isValidForOrder = function (orderSubtotal, customerEmail) {
  const now = new Date();
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (now < this.startDate) return { valid: false, message: 'Coupon is not yet active' };
  if (now > this.expiryDate) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimitTotal && this.usedCount >= this.usageLimitTotal) {
    return { valid: false, message: 'Coupon usage limit has been reached' };
  }
  if (orderSubtotal < this.minOrderAmount) {
    return { valid: false, message: `Minimum order amount of ₹${this.minOrderAmount} required` };
  }
  if (customerEmail && this.perCustomerLimit) {
    const timesUsed = this.usedByCustomers.filter((c) => c.email.toLowerCase() === customerEmail.toLowerCase()).length;
    if (timesUsed >= this.perCustomerLimit) {
      return { valid: false, message: 'You have already used this coupon' };
    }
  }

  // Calculate discount
  let discount = 0;
  if (this.discountType === 'fixed') {
    discount = Math.min(this.discountValue, orderSubtotal);
  } else if (this.discountType === 'percentage') {
    discount = (orderSubtotal * this.discountValue) / 100;
    if (this.maxDiscountAmount) {
      discount = Math.min(discount, this.maxDiscountAmount);
    }
  }

  return { valid: true, discountAmount: Math.round(discount), message: 'Coupon applied successfully' };
};

export const Coupon = mongoose.model('Coupon', couponSchema);
