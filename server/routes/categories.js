import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { categoriesDB, productsDB, auditLogsDB } from '../config/db.js';
import { sendInternalError } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categories = (await categoriesDB.find({ status: { $ne: 'hidden' } }))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    res.json({ success: true, categories });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to retrieve categories.');
  }
});

router.get('/admin/all', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const categories = (await categoriesDB.find({}))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    res.json({ success: true, categories });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to retrieve administrative categories.');
  }
});

router.post('/', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const { name, slug, subline, description, heroImage, status, statusLabel, subcategories, subCategories, displayOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const generatedSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await categoriesDB.findOne({ $or: [{ name: name.trim() }, { slug: generatedSlug }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category name or slug already exists' });
    }

    // Support both `subcategories` array of objects and `subCategories` array of strings
    let formattedSubcategories = [];
    const rawSubs = subcategories || subCategories;
    if (Array.isArray(rawSubs)) {
      formattedSubcategories = rawSubs.map((s, idx) => {
        if (typeof s === 'string') {
          return {
            name: s.trim(),
            slug: s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            level: 1
          };
        }
        return s;
      });
    }

    if (formattedSubcategories.some((s) => s.level > 4)) {
      return res.status(400).json({ success: false, message: 'Subcategory hierarchy cannot exceed 4 levels' });
    }

    const category = await categoriesDB.insert({
      name: name.trim(),
      slug: generatedSlug,
      subline: subline || '',
      description: description || '',
      heroImage: heroImage || '',
      status: status || 'active',
      statusLabel: statusLabel || (status === 'coming_soon' ? 'Coming Soon' : 'Available Now'),
      displayOrder: displayOrder || 0,
      subcategories: formattedSubcategories,
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
    return sendInternalError(res, error, 'Failed to create category.');
  }
});

router.put('/:id', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const { name, slug, subline, description, heroImage, status, statusLabel, subcategories, subCategories, displayOrder } = req.body;

    const category = await categoriesDB.findOne({ _id: req.params.id });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const update = { updatedAt: new Date() };
    if (name) update.name = name.trim();
    if (slug) update.slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (subline !== undefined) update.subline = subline;
    if (description !== undefined) update.description = description;
    if (heroImage !== undefined) update.heroImage = heroImage;
    if (status !== undefined) update.status = status;
    if (statusLabel !== undefined) update.statusLabel = statusLabel;
    if (displayOrder !== undefined) update.displayOrder = displayOrder;

    const rawSubs = subcategories !== undefined ? subcategories : subCategories;
    if (rawSubs !== undefined) {
      let formatted = [];
      if (Array.isArray(rawSubs)) {
        formatted = rawSubs.map(s => {
          if (typeof s === 'string') {
            return {
              name: s.trim(),
              slug: s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              level: 1
            };
          }
          return s;
        });
      }
      if (formatted.some((s) => s.level > 4)) {
        return res.status(400).json({ success: false, message: 'Subcategory hierarchy cannot exceed 4 levels' });
      }
      update.subcategories = formatted;
    }

    await categoriesDB.update({ _id: req.params.id }, { $set: update });
    const updatedCategory = await categoriesDB.findOne({ _id: req.params.id });

    res.json({ success: true, message: 'Category updated successfully', category: updatedCategory });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to update category.');
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
    return sendInternalError(res, error, 'Failed to delete category.');
  }
});

export default router;
