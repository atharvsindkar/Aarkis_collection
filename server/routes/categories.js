import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { categoriesDB, productsDB, auditLogsDB } from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categories = (await categoriesDB.find({ status: { $ne: 'hidden' } }))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/admin/all', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const categories = (await categoriesDB.find({}))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const { name, slug, subline, description, heroImage, status, statusLabel, subcategories, displayOrder } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const generatedSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await categoriesDB.findOne({ $or: [{ name }, { slug: generatedSlug }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category name or slug already exists' });
    }

    if (subcategories && subcategories.some((s) => s.level > 4)) {
      return res.status(400).json({ success: false, message: 'Subcategory hierarchy cannot exceed 4 levels' });
    }

    const category = await categoriesDB.insert({
      name,
      slug: generatedSlug,
      subline: subline || '',
      description: description || '',
      heroImage: heroImage || '',
      status: status || 'active',
      statusLabel: statusLabel || (status === 'coming_soon' ? 'Coming Soon' : 'Available Now'),
      displayOrder: displayOrder || 0,
      subcategories: subcategories || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await auditLogsDB.insert({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'CREATE_CATEGORY',
      targetType: 'category',
      targetId: category._id,
      details: { name, slug: generatedSlug },
      ip: req.ip,
      createdAt: new Date(),
    });

    res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const { name, slug, subline, description, heroImage, status, statusLabel, subcategories, displayOrder } = req.body;

    const category = await categoriesDB.findOne({ _id: req.params.id });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const update = { updatedAt: new Date() };
    if (name) update.name = name;
    if (slug) update.slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (subline !== undefined) update.subline = subline;
    if (description !== undefined) update.description = description;
    if (heroImage !== undefined) update.heroImage = heroImage;
    if (status !== undefined) update.status = status;
    if (statusLabel !== undefined) update.statusLabel = statusLabel;
    if (displayOrder !== undefined) update.displayOrder = displayOrder;
    if (subcategories !== undefined) {
      if (subcategories.some((s) => s.level > 4)) {
        return res.status(400).json({ success: false, message: 'Subcategory hierarchy cannot exceed 4 levels' });
      }
      update.subcategories = subcategories;
    }

    await categoriesDB.update({ _id: req.params.id }, { $set: update });

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const category = await categoriesDB.findOne({ _id: req.params.id });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const products = await productsDB.find({
      $or: [{ categoryId: category.slug }, { category: category.name }],
    });

    if (products.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category because it contains ${products.length} active product(s). Please reassign or archive them first.`,
      });
    }

    await categoriesDB.remove({ _id: req.params.id });

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
