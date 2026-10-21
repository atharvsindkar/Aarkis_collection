import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Heart, User, ChevronDown, Menu, X } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { BRAND_DATA, CATEGORIES } from '../data/products';

export default function Navbar() {
  const {
    cartCount,
    wishlist,
    setIsCartOpen,
    setIsWishlistOpen,
    setIsSearchOpen,
    setIsAccountOpen,
    customer,
    setActiveCategoryFilter,
    openComingSoon,
    categories,
    products,
  } = useShop();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clothingDropdownOpen, setClothingDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const effectiveCategories = (categories && categories.length > 0) ? categories : CATEGORIES;
  const primaryCategories = effectiveCategories.slice(0, 3);
  const extraCategories = effectiveCategories.slice(3);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isCategoryActive = (catId) => {
    if (catId === 'all') return true;
    const norm = (catId || '').toLowerCase().replace(/[\s_]+/g, '-');
    const dbCat = (categories || []).find(c => (c.slug || c.id || '').toLowerCase() === norm);
    if (dbCat && dbCat.status === 'active') return true;

    const hasActiveProduct = (products || []).some(p => {
      const pCatSlug = (p.categoryId || p.category || '').toLowerCase().replace(/[\s_]+/g, '-');
      return (pCatSlug === norm || (p.category && p.category.toLowerCase().includes(catId.replace('-', ' ')))) &&
             p.status === 'active' &&
             !p.isComingSoon;
    });
    if (hasActiveProduct) return true;

    return false;
  };

  const handleNavClick = (catId) => {
    setMobileMenuOpen(false);
    setClothingDropdownOpen(false);
    if (catId === 'new-arrivals') {
      const element = document.getElementById('new-arrivals');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    if (catId === 'all' || isCategoryActive(catId)) {
      setActiveCategoryFilter(catId);
      const element = document.getElementById('collection');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      const dbCat = (categories || []).find(c => (c.slug || c.id || '').toLowerCase() === catId.toLowerCase());
      const cat = dbCat || CATEGORIES.find((c) => c.id === catId);
      openComingSoon(cat ? cat.name : 'Category');
    }
  };

  return (
    <>
      <header
        className={`w-full z-40 transition-all duration-300 ${
          isScrolled
            ? 'sticky top-0 bg-[#FFFFFF]/95 backdrop-blur-md shadow-[0_4px_25px_rgba(44,33,27,0.06)] border-b border-[#E8E0D2] py-3'
            : 'bg-[#FAF7F2] border-b border-[#EFE8DD] py-3.5 sm:py-4 md:py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Left: Desktop Brand Logo & Navigation Menu */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              {/* Mobile Hamburger Trigger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-1.5 -ml-1 text-[#221612] hover:text-[#682334] transition-colors focus:outline-none"
                aria-label="Open menu"
              >
                <Menu size={22} strokeWidth={1.5} />
              </button>

              {/* Desktop Logo in the left corner */}
              <a
                href="#"
                className="hidden lg:flex items-center space-x-2.5 flex-shrink-0 group"
                aria-label="Aarkis Home"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border border-[#D8C2A0]/80 shadow-xs flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                  <img
                    src={BRAND_DATA.logo}
                    alt="Aarkis Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </a>

              {/* Desktop Navigation Links */}
              <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 text-[12px] tracking-[0.18em] uppercase font-medium text-[#221612]">
                <button
                  type="button"
                  onClick={() => handleNavClick('new-arrivals')}
                  className="hover:text-[#682334] transition-colors py-1 relative group whitespace-nowrap"
                >
                  <span>New Arrivals</span>
                  <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#682334] transition-all duration-300 group-hover:w-full"></span>
                </button>

                {/* Primary Categories */}
                {primaryCategories.map((cat) => {
                  const catSlug = cat.slug || cat.id;
                  return (
                    <button
                      key={cat._id || catSlug}
                      type="button"
                      onClick={() => handleNavClick(catSlug)}
                      className="hover:text-[#682334] transition-colors py-1 relative group whitespace-nowrap"
                    >
                      <span>{cat.name}</span>
                      <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#682334] transition-all duration-300 group-hover:w-full"></span>
                    </button>
                  );
                })}

                {/* More Categories Dropdown if new categories are added beyond primary */}
                {extraCategories.length > 0 && (
                  <div
                    className="relative"
                    onMouseEnter={() => setMoreDropdownOpen(true)}
                    onMouseLeave={() => setMoreDropdownOpen(false)}
                  >
                    <button
                      type="button"
                      className="flex items-center space-x-1 hover:text-[#682334] transition-colors py-1 group whitespace-nowrap"
                    >
                      <span>More</span>
                      <ChevronDown size={13} className={`text-[#8E7766] group-hover:text-[#682334] transition-transform ${moreDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {moreDropdownOpen && (
                      <div className="absolute top-full left-0 w-56 bg-white border border-[#E8E0D2] shadow-xl py-2 px-1 z-50 animate-fade-in text-left rounded-xs">
                        {extraCategories.map((cat) => {
                          const catSlug = cat.slug || cat.id;
                          const isActive = isCategoryActive(catSlug);
                          return (
                            <button
                              key={cat._id || catSlug}
                              type="button"
                              onClick={() => {
                                setMoreDropdownOpen(false);
                                handleNavClick(catSlug);
                              }}
                              className="w-full text-left px-3 py-2 text-[11px] uppercase tracking-wider text-[#34251F] hover:bg-[#FAF7F2] hover:text-[#682334] rounded-xs flex items-center justify-between transition-colors"
                            >
                              <span>{cat.name}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${isActive ? 'bg-[#EFE9DE] text-[#6F5847]' : 'bg-[#FAF2E8] text-[#8E7766]'}`}>
                                {isActive ? 'Available' : 'Preview'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </nav>
            </div>

            {/* Center: Brand Name strictly in single line with user's given tagline */}
            <div className="flex items-center justify-center px-1">
              <a
                href="#"
                className="group flex flex-col items-center justify-center text-center focus:outline-none"
                aria-label="Aarkis Collection"
              >
                <span
                  className="font-brand text-lg sm:text-2xl md:text-[28px] font-normal tracking-[0.16em] sm:tracking-[0.24em] text-[#1D1410] uppercase whitespace-nowrap transition-colors group-hover:text-[#682334]"
                  style={{ fontFamily: "'Cinzel', 'Bodoni Moda', serif" }}
                >
                  AARKIS
                </span>
                <span className="text-[7.5px] sm:text-[9px] tracking-[0.24em] uppercase text-[#887160] font-medium -mt-0.5 whitespace-nowrap transition-colors group-hover:text-[#1D1410]">
                  Style your own way
                </span>
              </a>
            </div>

            {/* Right: Utility Icons (Search, Account, Wishlist, Bag) */}
            <div className="flex items-center space-x-3 sm:space-x-5 md:space-x-6">
              {/* Search */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-1 text-[#221612] hover:text-[#682334] transition-colors focus:outline-none"
                aria-label="Search"
              >
                <Search size={18} sm:size={19} strokeWidth={1.5} />
              </button>

              {/* Customer Account Profile Modal Trigger */}
              <button
                type="button"
                onClick={() => setIsAccountOpen(true)}
                className="p-1 text-[#221612] hover:text-[#682334] transition-colors focus:outline-none hidden sm:block relative"
                title={customer ? `Patron: ${customer.name || customer.phone}` : "Patron Sign In (Phone & OTP)"}
                aria-label="Customer Account"
              >
                <User size={19} strokeWidth={1.5} />
                {customer && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
                )}
              </button>

              {/* Wishlist */}
              <button
                type="button"
                onClick={() => setIsWishlistOpen(true)}
                className="p-1 text-[#221612] hover:text-[#682334] transition-colors relative focus:outline-none"
                aria-label="Wishlist"
                title="View Saved Wishlist"
              >
                <Heart size={18} sm:size={19} strokeWidth={1.5} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#682334] text-white text-[8px] sm:text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Bag */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="flex items-center space-x-1 sm:space-x-2 p-1 text-[#221612] hover:text-[#682334] transition-colors focus:outline-none"
                aria-label="Bag"
              >
                <ShoppingBag size={18} sm:size={19} strokeWidth={1.5} />
                <span className="text-[10px] sm:text-[11px] font-medium tracking-[0.14em] uppercase text-[#221612] whitespace-nowrap">
                  BAG {cartCount > 0 && `(${cartCount})`}
                </span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer (Visible when hamburger 3-line clicked on mobile) */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="fixed inset-0 bg-[#221612]/60 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />

        <div
          className={`fixed inset-y-0 left-0 max-w-xs w-full bg-[#FAF7F2] shadow-2xl p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div>
            {/* Header of mobile drawer with brand logo in the left corner */}
            <div className="flex items-center justify-between pb-5 border-b border-[#E8E0D2]">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-full overflow-hidden border border-[#D8C2A0] shadow-sm flex-shrink-0">
                  <img
                    src={BRAND_DATA.logo}
                    alt="Aarkis Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span
                    className="font-brand text-xl font-normal tracking-[0.18em] text-[#1D1410] uppercase whitespace-nowrap block"
                    style={{ fontFamily: "'Cinzel', 'Bodoni Moda', serif" }}
                  >
                    AARKIS
                  </span>
                  <p className="text-[9px] uppercase tracking-[0.24em] text-[#8E7766]">
                    Style your own way
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-[#6F5847] hover:text-[#34251F] focus:outline-none"
                aria-label="Close menu"
              >
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>

            {/* Navigation links inside drawer */}
            <div className="mt-8 space-y-4 text-sm uppercase tracking-widest text-[#221612]">
              <button
                onClick={() => handleNavClick('new-arrivals')}
                className="block w-full text-left py-2.5 border-b border-[#EFE9DE] hover:text-[#682334] flex items-center justify-between"
              >
                <span>New Arrivals</span>
                <span className="text-[9px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">New Capsule</span>
              </button>

              {effectiveCategories.map((cat) => {
                const catSlug = cat.slug || cat.id;
                const isActive = isCategoryActive(catSlug);
                return (
                  <button
                    key={cat._id || catSlug}
                    onClick={() => handleNavClick(catSlug)}
                    className="block w-full text-left py-2.5 border-b border-[#EFE9DE] hover:text-[#682334] flex items-center justify-between"
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded ${isActive ? 'bg-[#EFE9DE] text-[#6F5847]' : 'bg-[#FAF2E8] text-[#8E7766]'}`}>
                      {isActive ? 'Available Now' : 'Coming Soon'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-[#E8E0D2] text-center space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setIsAccountOpen(true);
              }}
              className="w-full py-2 bg-[#34251F] text-[#FAF7F2] text-xs uppercase tracking-widest font-semibold rounded-xs"
            >
              {customer ? 'View Patron Account' : 'Sign In with Phone'}
            </button>
            <p className="font-serif italic text-sm text-[#8E7766]">
              Style your own way
            </p>
            <p className="text-[9px] text-[#A69483] tracking-widest uppercase">
              Maison Aarkis • Est. 2026
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
