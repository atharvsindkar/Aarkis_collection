import React, { useState } from 'react';
import { X, Sparkles, Bell, Check } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { CATEGORIES } from '../data/products';

export default function ComingSoonModal() {
  const { comingSoonCategory, closeComingSoon, setActiveCategoryFilter } = useShop();
  const [email, setEmail] = useState('');
  const [registered, setRegistered] = useState(false);

  if (!comingSoonCategory) return null;

  const categoryObj = CATEGORIES.find(
    (c) => c.name.toLowerCase() === comingSoonCategory.toLowerCase()
  ) || CATEGORIES[1];

  const handleRegister = (e) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setRegistered(true);
      setEmail('');
    }
  };

  const handlePreviewCollection = () => {
    closeComingSoon();
    setActiveCategoryFilter(categoryObj.id);
    const el = document.getElementById('collection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#221612]/75 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={closeComingSoon}
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <div
          className="relative bg-[#FAF7F2] w-full max-w-lg shadow-2xl border border-[#D8C2A0] rounded-xs overflow-hidden z-10 animate-fade-in my-8 p-6 sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            type="button"
            onClick={closeComingSoon}
            className="absolute top-4 right-4 p-1.5 text-[#6F5847] hover:text-[#34251F]"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[#EFE8DD] text-[#34251F] mx-auto flex items-center justify-center mb-4">
              <Sparkles size={20} className="text-[#B49A62]" />
            </div>

            <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#8E7766] block mb-1">
              Capsule Edition
            </span>

            <h3 className="font-serif text-3xl text-[#281D18] mb-3 font-normal">
              {comingSoonCategory} — Coming Soon
            </h3>

            <p className="text-xs sm:text-sm text-[#6F5847] font-light leading-relaxed max-w-sm mx-auto mb-6">
              Our atelier is putting the finishing touches on this chapter. A limited preview piece is already featured in our catalog.
            </p>

            {/* Preview image */}
            <div className="relative aspect-[16/9] rounded-xs overflow-hidden border border-[#E8E0D2] mb-6 shadow-sm">
              <img
                src={categoryObj.heroImage}
                alt={categoryObj.name}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handlePreviewCollection}
                  className="px-4 py-2 bg-white/95 hover:bg-white text-[#281D18] text-xs uppercase tracking-wider font-semibold rounded-xs shadow transition-transform hover:scale-105"
                >
                  View Preview Silhouette
                </button>
              </div>
            </div>

            {/* Notification signup */}
            {registered ? (
              <div className="p-3 bg-white border border-[#D8C2A0] rounded-xs text-xs text-[#2E6B4E] flex items-center justify-center space-x-2">
                <Check size={16} />
                <span>You're registered for the {comingSoonCategory} drop!</span>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <p className="text-xs text-[#7F6B5C]">
                  Receive an invitation before the full edition releases:
                </p>
                <div className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email for private release"
                    className="flex-1 px-3 py-2 bg-white border border-[#D8C2A0] text-xs placeholder-[#A69483] focus:outline-none focus:border-[#34251F]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#34251F] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider hover:bg-[#201511]"
                  >
                    Notify Me
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
