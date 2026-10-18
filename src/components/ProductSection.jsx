import React from 'react';
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import ProductCard from './ProductCard';
import { PRODUCTS, CATEGORIES } from '../data/products';
import { useShop } from '../context/ShopContext';

export default function ProductSection() {
  const { activeCategoryFilter, setActiveCategoryFilter } = useShop();

  // Filter products according to category
  const filteredProducts = PRODUCTS.filter((product) => {
    if (activeCategoryFilter === 'all') return true;
    return product.categoryId === activeCategoryFilter;
  });

  const filterTabs = [
    { id: 'all', label: 'All Creations', badge: '3 Designs' },
    { id: 'western-wear', label: 'Western Wear', badge: 'Available Now' },
    { id: 'festive-wear', label: 'Festive Wear', badge: 'Preview' },
    { id: 'casual-wear', label: 'Casual Wear', badge: 'Preview' },
  ];

  return (
    <section id="collection" className="py-20 md:py-28 bg-[#FBF9F5] border-b border-[#E8E0D2] scroll-mt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 text-[11px] uppercase tracking-[0.28em] text-[#8E7766] mb-3 font-semibold">
            <span className="w-6 h-[1px] bg-[#B49A62]"></span>
            <span>Signature Catalog</span>
            <span className="w-6 h-[1px] bg-[#B49A62]"></span>
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#281D18] tracking-[-0.01em] mb-4">
            The Curated Edit
          </h2>

          <p className="font-serif italic text-xl sm:text-2xl text-[#B49A62] font-normal mb-3">
            Pieces to make your own.
          </p>

          <p className="text-sm sm:text-base text-[#6F5847] font-light leading-relaxed">
            Three foundational silhouettes designed with balanced geometry, rich textures, 
            and distinct colorways for versatile self-expression.
          </p>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
          {filterTabs.map((tab) => {
            const isSelected = activeCategoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategoryFilter(tab.id)}
                className={`px-5 py-2.5 rounded-xs text-xs uppercase tracking-[0.16em] transition-all duration-200 flex items-center space-x-2 border ${
                  isSelected
                    ? 'bg-[#34251F] text-[#FAF7F2] border-[#34251F] shadow-sm font-semibold'
                    : 'bg-[#FAF7F2] text-[#6F5847] border-[#E8E0D2] hover:border-[#B49A62] hover:text-[#34251F]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-xs uppercase tracking-wider ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-[#EAE2D5] text-[#6F5847]'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Product Grid: Exactly 3 unique products */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Editorial Subnote */}
        <div className="mt-14 pt-8 border-t border-[#E8E0D2] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8E7766]">
          <div className="flex items-center space-x-2 mb-2 sm:mb-0">
            <span className="w-2 h-2 rounded-full bg-[#B49A62]"></span>
            <span>Western Wear is ready for immediate atelier dispatch.</span>
          </div>
          <p className="italic font-serif text-sm text-[#6F5847]">
            Festive and Casual silhouettes are showcased in limited preview editions.
          </p>
        </div>

      </div>
    </section>
  );
}
