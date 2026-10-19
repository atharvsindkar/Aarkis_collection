import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    source: {
      type: String,
      default: 'website_newsletter',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    unsubscribedAt: Date,
  },
  {
    timestamps: true,
  }
);

export const Subscriber = mongoose.model('Subscriber', subscriberSchema);

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userEmail: String,
    userRole: String,
    action: { type: String, required: true },
    targetType: String, // 'product' | 'order' | 'category' | 'coupon' | 'admin_user'
    targetId: String,
    details: mongoose.Schema.Types.Mixed,
    ip: String,
  },
  {
    timestamps: true,
  }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
