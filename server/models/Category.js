import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    subline: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    heroImage: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'preview', 'hidden', 'coming_soon'],
      default: 'active',
    },
    statusLabel: {
      type: String,
      default: 'Available Now',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    // Hierarchical subcategories (up to 4 levels validated in service/controller)
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    subcategories: [
      {
        name: { type: String, required: true },
        slug: { type: String, required: true },
        level: { type: Number, default: 1 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Category = mongoose.model('Category', categorySchema);
