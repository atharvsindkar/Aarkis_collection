import { categoriesDB, productsDB, couponsDB } from '../config/db.js';
import { CATEGORIES as INITIAL_CATEGORIES, PRODUCTS as INITIAL_PRODUCTS } from '../../src/data/products.js';

export const seedInitialData = async () => {
  try {
    // 1. Categories
    const categoryCount = await categoriesDB.count({});
    if (categoryCount === 0) {
      console.log('🌱 Seeding initial categories...');
      for (let i = 0; i < INITIAL_CATEGORIES.length; i++) {
        const cat = INITIAL_CATEGORIES[i];
        await categoriesDB.insert({
          name: cat.name,
          slug: cat.id,
          subline: cat.subline || '',
          description: cat.description || '',
          heroImage: cat.heroImage || '',
          status: cat.status || 'active',
          statusLabel: cat.statusLabel || 'Available Now',
          displayOrder: i,
          subcategories: cat.id === 'western-wear' ? [
            { name: 'Suits & Blazers', slug: 'suits-and-blazers', level: 1 },
            { name: 'Waistcoats & Suit Vests', slug: 'waistcoats-and-suit-vests', level: 2 }
          ] : [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      console.log('✅ Categories seeded');
    }

    // 2. Products
    const productCount = await productsDB.count({});
    if (productCount === 0) {
      console.log('🌱 Seeding initial products with variant inventory...');
      for (const p of INITIAL_PRODUCTS) {
        const variants = p.variants.map(v => ({
          id: v.id,
          colorName: v.name,
          colorHex: v.colorHex,
          image: v.image,
          caption: v.caption || '',
          inventory: {
            'S': 5,
            'M': 8,
            'L': 6,
            'XL': 3
          }
        }));

        await productsDB.insert({
          name: p.name,
          slug: p.id,
          shortName: p.shortName || p.name,
          category: p.category,
          categoryId: p.categoryId,
          subCategory: p.subCategory || '',
          price: p.price,
          mrp: p.price + 1000,
          priceDisplay: p.priceDisplay,
          priceNote: p.priceNote,
          badge: p.badge || '',
          description: p.description,
          highlights: p.details || [],
          details: p.details || [],
          fabric: p.fabric || '',
          care: p.care || '',
          sizes: p.sizes || ['S', 'M', 'L', 'XL'],
          variants,
          isNewArrival: true,
          isComingSoon: p.categoryId !== 'western-wear',
          isFeatured: true,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      console.log('✅ Products seeded with variant stock');
    }

    // 3. Coupons
    const couponCount = await couponsDB.count({});
    if (couponCount === 0) {
      console.log('🌱 Seeding introductory coupons...');
      await couponsDB.insert({
        code: 'AARKIS10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 2000,
        maxDiscountAmount: 1000,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimitTotal: 500,
        usedCount: 0,
        perCustomerLimit: 1,
        usedByCustomers: [],
        isActive: true,
        description: 'Welcome 10% discount on initial orders above ₹2,000',
        createdAt: new Date()
      });
      await couponsDB.insert({
        code: 'ATELIER500',
        discountType: 'fixed',
        discountValue: 500,
        minOrderAmount: 3000,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimitTotal: 200,
        usedCount: 0,
        perCustomerLimit: 1,
        usedByCustomers: [],
        isActive: true,
        description: 'Flat ₹500 off on signature waistcoat coordinates',
        createdAt: new Date()
      });
      console.log('✅ Coupons seeded (AARKIS10, ATELIER500)');
    }
  } catch (err) {
    console.error('⚠️ Seeding error:', err.message);
  }
};
