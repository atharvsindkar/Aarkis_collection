import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { productsDB, subscribersDB, auditLogsDB } from '../config/db.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, search, newArrival, comingSoon } = req.query;

    let products = await productsDB.find({ status: 'active' });

    if (category && category !== 'all') {
      products = products.filter(p => p.categoryId === category || p.category === category);
    }

    if (newArrival === 'true') {
      products = products.filter(p => p.isNewArrival);
    }

    if (comingSoon === 'true') {
      products = products.filter(p => p.isComingSoon);
    }

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.variants && p.variants.some(v => v.colorName && v.colorName.toLowerCase().includes(q)))
      );
    }

    products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/admin/all', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const products = (await productsDB.find({})).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const product = await productsDB.findOne({
      $or: [{ slug: req.params.slug }, { _id: req.params.slug }],
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const {
      name,
      category,
      categoryId,
      subCategory,
      description,
      highlights,
      details,
      fabric,
      care,
      sellingPrice,
      mrp,
      badge,
      sizes,
      variants,
      isComingSoon,
      isNewArrival,
      sendAnnouncement,
      status,
      seoTitle,
      seoDescription,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    if (!category) {
      return res.status(400).json({ success: false, message: 'Main category is required' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Product description is required' });
    }

    const price = Number(sellingPrice);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ success: false, message: 'Selling price must be a positive number' });
    }

    if (mrp && Number(mrp) < price) {
      return res.status(400).json({ success: false, message: 'MRP/Comparison price cannot be lower than the selling price' });
    }

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one color variant with an image is required' });
    }

    const comingSoonFlag = Boolean(isComingSoon);
    const newArrivalFlag = Boolean(isNewArrival);

    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-4)}`;

    const product = await productsDB.insert({
      name: name.trim(),
      slug: generatedSlug,
      shortName: name.length > 35 ? name.slice(0, 32) + '...' : name,
      category,
      categoryId: categoryId || category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      subCategory: subCategory || '',
      price,
      mrp: mrp ? Number(mrp) : null,
      priceDisplay: `₹${price.toLocaleString()}`,
      badge: badge || (newArrivalFlag ? 'New Arrival' : comingSoonFlag ? 'Coming Soon' : ''),
      description: description.trim(),
      highlights: highlights || details || [],
      details: details || highlights || [],
      fabric: fabric || '',
      care: care || '',
      sizes: sizes || ['S', 'M', 'L', 'XL'],
      variants,
      isComingSoon: comingSoonFlag,
      isNewArrival: newArrivalFlag,
      isFeatured: true,
      status: status || 'active',
      seoTitle: seoTitle || name,
      seoDescription: seoDescription || description.slice(0, 160),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await auditLogsDB.insert({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'CREATE_PRODUCT',
      targetType: 'product',
      targetId: product._id,
      details: { name: product.name, price: product.price },
      ip: req.ip,
      createdAt: new Date(),
    });

    if (sendAnnouncement && product.status === 'active' && !product.isComingSoon) {
      const activeSubscribers = await subscribersDB.find({ isActive: true });
      for (const sub of activeSubscribers) {
        sendEmail({
          to: sub.email,
          subject: `New Arrival: ${product.name} | Aarkis Collection`,
          text: `Discover the newly released silhouette: ${product.name}. Priced at ${product.priceDisplay}. Available now in our curated edit.`,
        });
      }
    }

    res.status(201).json({ success: true, message: 'Product created and published successfully', product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const product = await productsDB.findOne({ _id: req.params.id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const {
      name,
      category,
      categoryId,
      subCategory,
      description,
      highlights,
      details,
      fabric,
      care,
      sellingPrice,
      mrp,
      badge,
      sizes,
      variants,
      isComingSoon,
      isNewArrival,
      status,
    } = req.body;

    const update = { updatedAt: new Date() };
    if (name) update.name = name;
    if (category) update.category = category;
    if (categoryId) update.categoryId = categoryId;
    if (subCategory !== undefined) update.subCategory = subCategory;
    if (description) update.description = description;
    if (highlights) update.highlights = highlights;
    if (details) update.details = details;
    if (fabric !== undefined) update.fabric = fabric;
    if (care !== undefined) update.care = care;
    if (sellingPrice) {
      update.price = Number(sellingPrice);
      update.priceDisplay = `₹${update.price.toLocaleString()}`;
    }
    if (mrp !== undefined) update.mrp = mrp ? Number(mrp) : null;
    if (badge !== undefined) update.badge = badge;
    if (sizes) update.sizes = sizes;
    if (variants) update.variants = variants;
    if (isComingSoon !== undefined) update.isComingSoon = Boolean(isComingSoon);
    if (isNewArrival !== undefined) update.isNewArrival = Boolean(isNewArrival);
    if (status) update.status = status;

    await productsDB.update({ _id: req.params.id }, { $set: update });

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const product = await productsDB.findOne({ _id: req.params.id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await productsDB.update({ _id: req.params.id }, { $set: { status: 'archived', updatedAt: new Date() } });

    res.json({ success: true, message: 'Product archived successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
