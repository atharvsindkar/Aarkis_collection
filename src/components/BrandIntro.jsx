import React from 'react';
import { BRAND_DATA } from '../data/products';

export default function BrandIntro() {
  return (
    <section id="story" className="py-20 md:py-28 bg-[#FBF9F5] border-b border-[#EAE2D5] relative">
      <div className="max-w-4xl mx-auto px-6 text-center">
        
        {/* Subtle Brand Monogram Accent */}
        <div className="inline-flex items-center justify-center mb-6">
          <div className="w-12 h-[1px] bg-[#D8C2A0]"></div>
          <div className="mx-4 text-[#B49A62] font-serif italic text-lg select-none">
            Maison Aarkis
          </div>
          <div className="w-12 h-[1px] bg-[#D8C2A0]"></div>
        </div>

        {/* Primary Statement */}
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#281D18] leading-[1.2] font-normal tracking-[-0.01em] mb-6">
          "{BRAND_DATA.editorialIntro.title}"
        </h2>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg md:text-xl text-[#6F5847] font-light leading-relaxed max-w-2xl mx-auto mb-8 tracking-[0.01em]">
          {BRAND_DATA.editorialIntro.subtitle}
        </p>

        {/* Delicate divider badge */}
        <div className="pt-4 flex items-center justify-center space-x-3 text-xs uppercase tracking-[0.25em] text-[#A69483]">
          <span>Western Wear</span>
          <span>•</span>
          <span>Festive Wear</span>
          <span>•</span>
          <span>Casual Wear</span>
        </div>

      </div>
    </section>
  );
}
