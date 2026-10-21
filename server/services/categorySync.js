import { categoriesDB, productsDB } from '../config/db.js';

/**
 * Automatically sync category status based on the products within that category.
 * If any product in the category has status: 'active' and isComingSoon: false,
 * the category status becomes 'active' and statusLabel 'Available Now'.
 * If all active products in the category have isComingSoon: true,
 * the category status becomes 'preview' and statusLabel 'Coming Soon'.
 */
export const syncCategoryStatus = async (categoryIdOrSlug) => {
  if (!categoryIdOrSlug) return;
  try {
    const products = await productsDB.find({
      $or: [
        { categoryId: categoryIdOrSlug },
        { category: categoryIdOrSlug }
      ],
      status: 'active'
    });

    const hasActiveAvailableProduct = products.some(p => !p.isComingSoon);

    if (hasActiveAvailableProduct) {
      await categoriesDB.update(
        { $or: [{ slug: categoryIdOrSlug }, { name: categoryIdOrSlug }] },
        { $set: { status: 'active', statusLabel: 'Available Now', updatedAt: new Date() } },
        { multi: true }
      );
    } else if (products.length > 0 && products.every(p => p.isComingSoon)) {
      await categoriesDB.update(
        { $or: [{ slug: categoryIdOrSlug }, { name: categoryIdOrSlug }] },
        { $set: { status: 'preview', statusLabel: 'Coming Soon', updatedAt: new Date() } },
        { multi: true }
      );
    }
  } catch (err) {
    console.error('Error syncing category status:', err);
  }
};

/**
 * Sync all categories across the entire catalog
 */
export const syncAllCategoryStatuses = async () => {
  try {
    const allCategories = await categoriesDB.find({});
    for (const cat of allCategories) {
      await syncCategoryStatus(cat.slug);
      if (cat.name !== cat.slug) {
        await syncCategoryStatus(cat.name);
      }
    }
    console.log('✅ Synchronized all category preview/active statuses with catalog products');
  } catch (err) {
    console.error('Error syncing all category statuses:', err);
  }
};
