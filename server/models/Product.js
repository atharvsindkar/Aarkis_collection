import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    colorName: { type: String, required: true },
    colorHex: { type: String, default: '#000000' },
    image: { type: String, required: true },
    caption: { type: String, default: '' },
    // Variant specific inventory mapping per size: { 'S': 5, 'M': 8, 'L': 6, 'XL': 3 }
    inventory: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    shortName: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
    },
    categoryId: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Price must be positive'],
    },
    mrp: {
      type: Number,
      default: null,
    },
    priceDisplay: {
      type: String,
      default: '',
    },
    priceNote: {
      type: String,
      default: 'Configurable catalog pricing',
    },
    badge: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    highlights: [String],
    details: [String],
    fabric: {
      type: String,
      default: '',
    },
    care: {
      type: String,
      default: '',
    },
    sizes: {
      type: [String],
      default: ['S', 'M', 'L', 'XL'],
    },
    variants: [variantSchema],
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isComingSoon: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived', 'out_of_stock'],
      default: 'active',
    },
    seoTitle: String,
    seoDescription: String,
  },
  {
    timestamps: true,
  }
);

export const Product = mongoose.model('Product', productSchema);
