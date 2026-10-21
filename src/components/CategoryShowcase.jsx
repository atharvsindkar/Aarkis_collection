import React from 'react';
import { ArrowUpRight, Lock, Sparkles } from 'lucide-react';
import { CATEGORIES as FALLBACK_CATEGORIES } from '../data/products';
import { useShop } from '../context/ShopContext';

export default function CategoryShowcase() {
  const { setActiveCategoryFilter, openComingSoon, categories, products } = useShop();

  // Combine dynamic categories with fallback photography
  const displayedCategories = (categories && categories.length > 0)
    ? categories.map(cat => {
        const fallback = FALLBACK_CATEGORIES.find(fc => fc.id === cat.slug || fc.name.toLowerCase() === cat.name.toLowerCase());
        const hasActiveProducts = (products || []).some(
          p => (p.category === cat.name || p.categoryId === cat.slug || p.categoryId === cat.id) &&
               p.status === 'active' && !p.isComingSoon
        );
        const isActive = cat.status === 'active' || hasActiveProducts;
        return {
          id: cat.slug || cat._id,
          name: cat.name,
          subline: cat.subline || fallback?.subline || 'Atelier Collection',
          description: cat.description || fallback?.description || '',
          heroImage: cat.heroImage || fallback?.heroImage || '/images/hero/12.png',
          status: isActive ? 'active' : (cat.status || 'preview'),
          statusLabel: isActive ? 'Available Now' : (cat.statusLabel || 'Coming Soon'),
        };
      })
    : FALLBACK_CATEGORIES;

  const handleCategorySelect = (category) => {
    if (category.status === 'active') {
      setActiveCategoryFilter(category.id);
      const el = document.getElementById('collection');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      openComingSoon(category.name);
    }
  };

  return (
    <section className="py-20 md:py-28 bg-[#F7F2EA] border-b border-[#E8E0D2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16">
          <div>
            <div className="flex items-center space-x-2 text-[11px] uppercase tracking-[0.25em] text-[#8E7766] mb-2 font-medium">
              <span className="w-6 h-[1px] bg-[#B49A62]"></span>
              <span>Editions & Pillars</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#281D18] tracking-[-0.01em]">
              The Three Disciplines
            </h2>
          </div>
          <p className="mt-3 md:mt-0 text-sm text-[#735F50] max-w-md font-light leading-relaxed">
            Curated wardrobe chapters crafted for distinct facets of your lifestyle, from precision daywear to celebratory occasions.
          </p>
        </div>

        {/* Categories Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayedCategories.map((cat, index) => {
            const isActive = cat.status === 'active';

            return (
              <div
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className="group relative cursor-pointer flex flex-col bg-[#FFFFFF] border border-[#E5DDD0] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_45px_rgba(52,37,31,0.1)] hover:-translate-y-1"
              >
                {/* Image Container with editorial aspect ratio */}
                <div className="relative aspect-[3/4] overflow-hidden bg-[#EFE9DE]">
                  <img
                    src={cat.heroImage}
                    alt={cat.name}
                    className="w-full h-full object-cover object-top transition-transform duration-800 ease-out group-hover:scale-105"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity group-hover:opacity-80"></div>

                  {/* Top Status Badge */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span
                      className={`text-[10px] uppercase font-semibold tracking-[0.2em] px-2.5 py-1 rounded-xs backdrop-blur-xs shadow-xs ${
                        isActive
                          ? 'bg-[#34251F] text-[#FAF7F2]'
                          : 'bg-white/90 text-[#6F5847]'
                      }`}
                    >
                      {cat.statusLabel}
                    </span>

                    <span className="text-[10px] tracking-wider uppercase text-white/90 bg-black/40 px-2 py-0.5 rounded-xs backdrop-blur-xs font-light">
                      0{index + 1}
                    </span>
                  </div>

                  {/* Bottom Image Caption info */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-[#D8C2A0] font-light mb-1">
                      {cat.subline}
                    </p>
                    <h3 className="font-serif text-2xl sm:text-3xl text-white font-normal leading-tight drop-shadow-sm">
                      {cat.name}
                    </h3>
                  </div>
                </div>

                {/* Bottom Card Bar */}
                <div className="p-5 flex flex-col justify-between flex-1 bg-white">
                  <p className="text-xs text-[#6F5847] leading-relaxed mb-4 font-light">
                    {cat.description}
                  </p>

                  <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between text-xs">
                    <span className="text-[11px] uppercase tracking-wider text-[#A69483]">
                      {cat.itemCount}
                    </span>

                    <span className="inline-flex items-center space-x-1 text-xs uppercase tracking-[0.18em] font-semibold text-[#34251F] group-hover:text-[#B49A62] transition-colors">
                      <span>{isActive ? 'Explore Category' : 'Preview Edition'}</span>
                      <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
