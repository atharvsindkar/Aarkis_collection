import React from 'react';
import { Compass, Sparkles, Feather } from 'lucide-react';
import { BRAND_DATA } from '../data/products';

export default function BrandValuesStrip() {
  const icons = [Compass, Feather, Sparkles];

  return (
    <section className="py-16 md:py-20 bg-[#FBF9F5] border-b border-[#E8E0D2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14">
          {BRAND_DATA.brandValues.map((val, idx) => {
            const IconComponent = icons[idx] || Sparkles;

            return (
              <div
                key={val.id}
                className="flex flex-col items-center text-center p-6 bg-[#FFFFFF] border border-[#EFE8DC] rounded-xs transition-transform duration-300 hover:-translate-y-1 hover:border-[#D8C2A0]"
              >
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#D8C2A0] text-[#B49A62] flex items-center justify-center mb-5">
                  <IconComponent size={20} strokeWidth={1.5} />
                </div>

                <h3 className="font-serif text-xl sm:text-2xl text-[#281D18] mb-3 font-medium">
                  {val.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#6F5847] font-light leading-relaxed max-w-xs">
                  {val.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
