import React from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function Hero() {
  const { setActiveCategoryFilter } = useShop();

  const scrollToCollection = () => {
    setActiveCategoryFilter('all');
    const el = document.getElementById('collection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToStory = () => {
    const el = document.getElementById('story');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full min-h-[85vh] sm:min-h-[88vh] lg:min-h-[92vh] max-h-[960px] flex items-center overflow-hidden bg-[#241A14]">
      {/* Background Campaign Photography — Pinned to TOP so the model's head is NEVER cut off */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero/12.png"
          alt="Aarkis Collection Festive Campaign"
          className="w-full h-full object-cover object-[68%_0%] sm:object-[66%_0%] md:object-[center_top] lg:object-[center_top] filter brightness-[0.95] contrast-[1.03]"
        />

        {/* Cinematic Atmospheric Gradient Overlays for High-Contrast Luxury Typography */}
        {/* Soft shadow wash on left side to guarantee sharp text legibility without dimming the model */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A120D]/95 via-[#221811]/70 sm:via-[#221811]/50 to-transparent pointer-events-none"></div>
        
        {/* Soft bottom vignette to ground the section */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#1A120D]/90 via-[#1A120D]/30 to-transparent pointer-events-none"></div>
        
        {/* Subtle top shade */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#1A120D]/50 to-transparent pointer-events-none"></div>
      </div>

      {/* Top Editorial Corner Identifiers */}
      {/* <div className="absolute top-6 sm:top-8 inset-x-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between pointer-events-none text-[10px] sm:text-[11px] uppercase tracking-[0.28em] font-medium text-[#E8DCCB]/80">
        <span className="font-mono sm:font-sans">AARKIS // MAISON DE COUTURE</span>
        <span>A/W 2026 FESTIVE EDIT</span>
      </div> */}

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 sm:py-24 lg:py-28">
        <div className="max-w-xl lg:max-w-2xl text-left">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xs bg-[#2E2018]/80 border border-[#D8C2A0]/30 backdrop-blur-xs mb-6 sm:mb-8 animate-fade-in shadow-lg">
            <Sparkles size={12} className="text-[#D8C2A0]" />
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-[#F3ECE1] font-medium">
              SIGNATURE FESTIVE CAPSULE
            </span>
          </div>

          {/* Primary Editorial Heading & Tagline in High-Fashion Haute Couture Typography */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[72px] text-[#FAF4EB] leading-[1.08] font-normal tracking-[-0.01em] mb-5">
            <span
              className="block font-brand text-3xl sm:text-4xl md:text-5xl lg:text-[58px] text-[#FAF4EB] tracking-[0.14em] uppercase font-light mb-1.5"
              style={{ fontFamily: "'Cinzel', 'Bodoni Moda', serif" }}
            >
              Aarkis Collection
            </span>
            <span className="block font-serif italic text-[#D8C2A0] font-light text-3xl sm:text-4xl md:text-5xl lg:text-[54px]">
              Style your own way.
            </span>
          </h1>

          {/* Context / Narrative Text (Option 5) */}
          <p className="text-sm sm:text-base md:text-lg text-[#E3D6C5] font-light leading-relaxed mb-10 max-w-lg tracking-[0.01em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            Impeccably tailored co-ords and luminous jacquard brocades. Designed for women who carry individuality, confidence, and quiet sophistication into every room.
          </p>

          {/* Call to Actions (matching luxury velvet burgundy and story link) */}
          <div className="flex flex-wrap items-center gap-5 sm:gap-7 pt-1">
            {/* Primary Burgundy Button */}
            <button
              type="button"
              onClick={scrollToCollection}
              className="px-7 sm:px-9 py-4 bg-[#682334] hover:bg-[#521927] text-white text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] transition-all duration-300 shadow-xl hover:shadow-[0_10px_25px_rgba(104,35,52,0.4)] hover:-translate-y-0.5 active:translate-y-0 rounded-xs border border-white/10"
            >
              Explore the Collection
            </button>

            {/* Secondary Link with Line Accent */}
            <button
              type="button"
              onClick={scrollToStory}
              className="group inline-flex items-center text-[#F5EDE2] hover:text-white text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] transition-colors py-2 drop-shadow-sm"
            >
              <span>Explore Our Story</span>
              <span className="ml-3 w-8 sm:w-12 h-[1px] bg-[#D8C2A0]/60 group-hover:bg-white group-hover:w-14 sm:group-hover:w-16 transition-all duration-300"></span>
            </button>
          </div>

        </div>
      </div>

      {/* Bottom Right: Scroll to Discover */}
      <div className="absolute bottom-8 right-6 sm:right-10 z-20 hidden sm:flex flex-col items-center">
        <button
          type="button"
          onClick={scrollToCollection}
          className="group flex flex-col items-center text-[#E5D7C5]/75 hover:text-white transition-colors focus:outline-none"
          aria-label="Scroll to discover"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] font-medium mb-3 text-[#E5D7C5]/70 group-hover:text-white transition-colors">
            Scroll to discover
          </span>
          <div className="w-9 h-9 rounded-full border border-[#D8C2A0]/40 flex items-center justify-center group-hover:border-white transition-all duration-300 group-hover:translate-y-1 bg-[#241A14]/60 backdrop-blur-xs">
            <ArrowDown size={14} className="text-[#E5D7C5] group-hover:text-white" />
          </div>
        </button>
      </div>
    </section>
  );
}
