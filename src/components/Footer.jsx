import React, { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { BRAND_DATA, CATEGORIES } from '../data/products';
import { useShop } from '../context/ShopContext';

export default function Footer() {
  const { setActiveCategoryFilter, openComingSoon } = useShop();
  const [activeLegalModal, setActiveLegalModal] = useState(null); // 'terms' | 'privacy' | 'contact' | null

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = (cat) => {
    if (cat.status === 'active') {
      setActiveCategoryFilter(cat.id);
      const el = document.getElementById('collection');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      openComingSoon(cat.name);
    }
  };

  return (
    <footer className="bg-[#241A15] text-[#D8CFC4] pt-16 pb-12 border-t border-[#3A2C24]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 border-b border-[#382B24]">
          
          {/* Brand Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <div className="flex items-center space-x-3.5 mb-5">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-[#D8C2A0]/40 shadow-sm flex-shrink-0">
                <img
                  src={BRAND_DATA.logo}
                  alt={BRAND_DATA.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span
                  className="font-brand text-xl sm:text-2xl font-light tracking-[0.24em] text-[#FAF7F2] uppercase block"
                  style={{ fontFamily: "'Cinzel', 'Bodoni Moda', serif" }}
                >
                  A A R K I S
                </span>
                <p className="font-serif italic text-xs text-[#D8C2A0] tracking-wide mt-0.5">
                  Style your own way • Haute Couture
                </p>
              </div>
            </div>

            <p className="text-xs text-[#A69483] font-light leading-relaxed max-w-sm mb-6">
              Modern women's tailored silhouettes, celebratory coordinates, and everyday luxury designed around individuality, ease, and timeless poise.
            </p>

            <div className="flex items-center space-x-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-[#4A3B32] flex items-center justify-center text-[#C2B2A2] hover:text-[#FAF7F2] hover:border-[#D8C2A0] transition-colors"
                aria-label="Instagram (Configurable)"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-[#4A3B32] flex items-center justify-center text-[#C2B2A2] hover:text-[#FAF7F2] hover:border-[#D8C2A0] transition-colors"
                aria-label="Facebook (Configurable)"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z"/>
                </svg>
              </a>
              <span className="text-[10px] uppercase tracking-wider text-[#735F50]">
                • Connect with our Atelier
              </span>
            </div>
          </div>

          {/* Shop Column (3 cols) */}
          <div className="lg:col-span-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#FAF7F2] font-semibold mb-4">
              Collections
            </p>
            <ul className="space-y-3 text-xs text-[#B2A091]">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className="hover:text-[#FAF7F2] transition-colors flex items-center space-x-2"
                  >
                    <span>{cat.name}</span>
                    {cat.status === 'preview' && (
                      <span className="text-[9px] uppercase px-1.5 py-0.2 bg-[#3A2B23] text-[#D8C2A0] rounded-xs">
                        Soon
                      </span>
                    )}
                  </button>
                </li>
              ))}
              <li>
                <a
                  href="#collection"
                  onClick={() => setActiveCategoryFilter('all')}
                  className="hover:text-[#FAF7F2] transition-colors"
                >
                  The Full Curated Edit
                </a>
              </li>
            </ul>
          </div>

          {/* Maison & Atelier (2 cols) */}
          <div className="lg:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#FAF7F2] font-semibold mb-4">
              Maison
            </p>
            <ul className="space-y-3 text-xs text-[#B2A091]">
              <li>
                <a href="#story" className="hover:text-[#FAF7F2] transition-colors">
                  Our Philosophy
                </a>
              </li>
              <li>
                <a href="#editorial" className="hover:text-[#FAF7F2] transition-colors">
                  Editorial Campaign
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveLegalModal('contact')}
                  className="hover:text-[#FAF7F2] transition-colors"
                >
                  Contact Atelier
                </button>
              </li>
            </ul>
          </div>

          {/* Legal / Policies (2 cols) */}
          <div className="lg:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#FAF7F2] font-semibold mb-4">
              Information
            </p>
            <ul className="space-y-3 text-xs text-[#B2A091]">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveLegalModal('terms')}
                  className="hover:text-[#FAF7F2] transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveLegalModal('privacy')}
                  className="hover:text-[#FAF7F2] transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <span className="text-[10px] text-[#735F50] uppercase tracking-wider block mt-2">
                  Est. {BRAND_DATA.established}
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7F6B5C]">
          <p className="font-light">
            © {new Date().getFullYear()} {BRAND_DATA.name}. All rights reserved. Style your own way.
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="mt-4 sm:mt-0 flex items-center space-x-2 text-[10px] uppercase tracking-widest text-[#B2A091] hover:text-[#FAF7F2] transition-colors"
          >
            <span>Back To Top</span>
            <ArrowUp size={14} />
          </button>
        </div>

      </div>

      {/* Simple Legal / Contact Dialogs */}
      {activeLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] text-[#2C211B] max-w-lg w-full p-6 sm:p-8 rounded-xs border border-[#D8C2A0] shadow-2xl relative">
            <h3 className="font-serif text-2xl font-medium mb-3 capitalize">
              {activeLegalModal === 'terms'
                ? 'Terms of Service'
                : activeLegalModal === 'privacy'
                ? 'Privacy Policy'
                : 'Contact Aarkis Atelier'}
            </h3>

            {activeLegalModal === 'contact' ? (
              <div className="text-xs text-[#6F5847] space-y-3 leading-relaxed">
                <p>For custom fittings, bespoke styling queries, or press relations:</p>
                <div className="p-3 bg-white border border-[#E8E0D2] rounded-xs space-y-1">
                  <p><strong>Email:</strong> atelier@aarkiscollection.com</p>
                  <p><strong>Brand Studio:</strong> Aarkis Collection — Est. 2026</p>
                  <p><strong>Hours:</strong> Monday – Saturday, 10:00 AM – 6:00 PM</p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#6F5847] space-y-3 leading-relaxed max-h-60 overflow-y-auto pr-2">
                <p>
                  Welcome to Aarkis Collection. All visual assets, product silhouettes, brand insignias, and editorial expressions are proprietary to Aarkis Collection.
                </p>
                <p>
                  We are committed to transparent communication, honoring customer privacy, and curating an elevated shopping journey.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveLegalModal(null)}
              className="mt-6 w-full py-2.5 bg-[#34251F] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider rounded-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
