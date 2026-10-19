import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    shortName: String,
    category: String,
    price: { type: Number, required: true },
    colorId: String,
    colorName: String,
    colorHex: String,
    image: String,
    size: String,
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const timelineEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    actor: { type: String, default: 'system' }, // 'customer' | 'admin' | 'system'
    note: { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    guestInfo: {
      name: String,
      email: String,
      phone: String,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },
    shippingCharge: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      apartment: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    orderStatus: {
      type: String,
      enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'placed',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refund_pending', 'refunded', 'partially_refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'mock_card', 'mock_upi', 'cod'],
      default: 'razorpay',
    },
    paymentDetails: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      paidAt: Date,
    },
    shipmentDetails: {
      courier: String,
      trackingId: String,
      trackingUrl: String,
      dispatchDate: Date,
      estimatedDeliveryDate: Date,
      shipmentStatus: {
        type: String,
        enum: ['not_shipped', 'ready_for_dispatch', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'delivery_exception', 'returned'],
        default: 'not_shipped',
      },
      notes: String,
    },
    cancellation: {
      isCancelled: { type: Boolean, default: false },
      cancelledAt: Date,
      cancelledBy: String,
      reason: String,
      notes: String,
    },
    refundDetails: {
      refundId: String,
      amount: Number,
      reason: String,
      status: {
        type: String,
        enum: ['none', 'pending', 'processed', 'failed'],
        default: 'none',
      },
      initiatedAt: Date,
      completedAt: Date,
      initiatedBy: String,
      isManual: { type: Boolean, default: false },
      referenceNote: String,
    },
    timeline: [timelineEventSchema],
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model('Order', orderSchema);
