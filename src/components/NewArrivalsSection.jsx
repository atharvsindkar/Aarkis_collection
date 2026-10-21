import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import ProductCard from './ProductCard';

export default function NewArrivalsSection() {
  const { products, setActiveCategoryFilter } = useShop();

  // Find products tagged with isNewArrival or "New Arrival" badge
  const newArrivals = (products || []).filter(
    (p) => p.isNewArrival === true || 
           p.badge?.toLowerCase().includes('arrival') ||
           p.badge?.toLowerCase().includes('new')
  );

  // Fallback to the first 3 active products if none explicitly tagged
  const displayItems = newArrivals.length > 0
    ? newArrivals.slice(0, 3)
    : (products || []).filter(p => p.status === 'active').slice(0, 3);

  const handleExploreAll = () => {
    setActiveCategoryFilter('new-arrivals');
    const el = document.getElementById('collection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="new-arrivals" className="py-20 md:py-28 bg-[#F7F2EA] border-b border-[#E8E0D2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16">
          <div>
            <div className="flex items-center space-x-2 text-[11px] uppercase tracking-[0.25em] text-[#8E7766] mb-2 font-medium">
              <span className="w-6 h-[1px] bg-[#B49A62]"></span>
              <span className="flex items-center space-x-1.5">
                <Sparkles size={12} className="text-[#B49A62]" />
                <span>The Atelier Debut • Autumn / Winter 2026</span>
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#281D18] tracking-[-0.01em]">
              New Arrivals
            </h2>
          </div>
          <p className="mt-3 md:mt-0 text-sm text-[#735F50] max-w-md font-light leading-relaxed">
            Freshly tailored additions from our master artisans. Limited edition silhouettes, hand-finished zari brocades, and contemporary festive co-ords.
          </p>
        </div>

        {/* New Arrivals Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayItems.map((product) => (
            <ProductCard key={product.id || product._id} product={product} />
          ))}
        </div>

        {/* Bottom CTA to explore all collection */}
        <div className="mt-14 text-center">
          <button
            type="button"
            onClick={handleExploreAll}
            className="inline-flex items-center space-x-2.5 px-8 py-3.5 bg-[#34251F] hover:bg-[#201511] text-[#FAF7F2] text-xs uppercase tracking-[0.2em] font-semibold rounded-xs shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
          >
            <span>Explore All New Arrivals</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </section>
  );
}
