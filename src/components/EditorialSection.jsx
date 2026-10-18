import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { BRAND_DATA } from '../data/products';
import { useShop } from '../context/ShopContext';

export default function EditorialSection() {
  const { setActiveCategoryFilter } = useShop();

  const handleExplore = () => {
    setActiveCategoryFilter('all');
    const el = document.getElementById('collection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="editorial" className="py-24 md:py-32 bg-[#F5EFE6] border-b border-[#E5DDD0] relative overflow-hidden">
      {/* Subtle background styling elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FAF7F2]/60 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Asymmetrical Editorial Composition (5 cols on lg) */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative">
              {/* Main Card */}
              <div className="relative z-10 bg-[#FFFFFF] p-4 shadow-[0_25px_60px_rgba(52,37,31,0.12)] border border-[#E0D7C9]">
                <div className="aspect-[3/4] overflow-hidden bg-[#EAE2D5]">
                  <img
                    src="/images/products/festive-brocade-coord.jpg"
                    alt="Festive Angrakha Wrap Silhouette"
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="pt-3 flex items-center justify-between text-xs text-[#7F6B5C]">
                  <span className="font-serif italic text-[#34251F]">
                    Occasionwear Exploration
                  </span>
                  <span className="text-[10px] tracking-widest uppercase text-[#B49A62] font-semibold">
                    Festive Edition
                  </span>
                </div>
              </div>

              {/* Offset Decorative Background Box */}
              <div className="absolute -bottom-6 -left-6 w-full h-full bg-[#E8DEC8] border border-[#D8C2A0] -z-0 hidden sm:block"></div>
            </div>
          </div>

          {/* Right Column: Narrative & Philosophy (7 cols on lg) */}
          <div className="lg:col-span-7 order-1 lg:order-2 text-left">
            
            <div className="inline-flex items-center space-x-3 mb-6">
              <span className="w-8 h-[1px] bg-[#B49A62]"></span>
              <span className="text-[11px] uppercase tracking-[0.3em] font-semibold text-[#8E7766]">
                {BRAND_DATA.editorialCampaign.tag}
              </span>
            </div>

            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#281D18] leading-[1.08] font-normal tracking-[-0.01em] mb-6">
              {BRAND_DATA.editorialCampaign.title}
            </h2>

            <p className="text-base sm:text-lg text-[#5F4E42] font-light leading-relaxed mb-8 max-w-xl">
              {BRAND_DATA.editorialCampaign.body}
            </p>

            {/* Editorial Blockquote */}
            <div className="border-l-2 border-[#B49A62] pl-6 py-2 my-8 bg-[#FAF7F2]/60">
              <blockquote className="font-serif italic text-xl sm:text-2xl text-[#34251F] font-normal leading-snug">
                "{BRAND_DATA.editorialCampaign.quote}"
              </blockquote>
              <cite className="block text-xs uppercase tracking-[0.2em] text-[#8E7766] mt-3 not-italic font-medium">
                — Aarkis Creative Studio
              </cite>
            </div>

            {/* Action */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleExplore}
                className="group inline-flex items-center space-x-3 px-8 py-4 bg-[#34251F] text-[#FAF7F2] text-xs font-semibold uppercase tracking-[0.22em] transition-all hover:bg-[#201511] hover:shadow-lg"
              >
                <span>View Full Showcase</span>
                <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
