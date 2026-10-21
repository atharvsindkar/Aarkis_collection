import React, { useState, useEffect } from 'react';
import { Search, X, ArrowUpRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS } from '../data/products';

export default function SearchModal() {
  const { isSearchOpen, setIsSearchOpen, openProductModal } = useShop();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isSearchOpen) {
      setQuery('');
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const results = query.trim()
    ? PRODUCTS.filter((p) => {
        const q = query.toLowerCase();
        return (
          (p.name || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.subCategory || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.variants || []).some((v) => (v.name || v.colorName || '').toLowerCase().includes(q))
        );
      })
    : PRODUCTS;

  const handleSelect = (product) => {
    setIsSearchOpen(false);
    openProductModal(product);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#221612]/75 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setIsSearchOpen(false)}
      />

      <div className="min-h-full flex items-start justify-center p-4 sm:p-6 lg:p-12">
        <div
          className="relative bg-[#FAF7F2] w-full max-w-2xl shadow-2xl border border-[#D8C2A0] rounded-xs overflow-hidden z-10 animate-fade-in my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Bar */}
          <div className="p-4 sm:p-6 bg-white border-b border-[#E8E0D2] flex items-center space-x-3">
            <Search size={20} className="text-[#8E7766]" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search waistcoats, festive co-ords, shades..."
              className="flex-1 bg-transparent text-sm sm:text-base text-[#281D18] placeholder-[#A69483] focus:outline-none font-light"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs text-[#8E7766] uppercase hover:text-[#34251F]"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="p-1 text-[#6F5847] hover:text-[#34251F] focus:outline-none"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Keywords */}
          <div className="px-6 py-3 bg-[#F4EFE6] border-b border-[#E8E0D2] flex items-center space-x-2 text-[11px] text-[#7F6B5C]">
            <span className="uppercase tracking-wider font-medium text-[#A69483]">
              Popular:
            </span>
            <button
              onClick={() => setQuery('waistcoat')}
              className="underline hover:text-[#34251F]"
            >
              Waistcoat
            </button>
            <span>•</span>
            <button
              onClick={() => setQuery('festive')}
              className="underline hover:text-[#34251F]"
            >
              Festive Jacquard
            </button>
            <span>•</span>
            <button
              onClick={() => setQuery('casual')}
              className="underline hover:text-[#34251F]"
            >
              Casual Co-ord
            </button>
            <span>•</span>
            <button
              onClick={() => setQuery('blue')}
              className="underline hover:text-[#34251F]"
            >
              Dusty Blue
            </button>
          </div>

          {/* Results List */}
          <div className="p-6 max-h-96 overflow-y-auto divide-y divide-[#EAE2D5]">
            {results.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#8E7766]">
                No matching creations found. Try searching for "waistcoat", "blue", or "festive".
              </div>
            ) : (
              results.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="py-3 flex items-center justify-between cursor-pointer group hover:bg-[#F2ECE1]/50 px-2 rounded-xs transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={product.variants?.[0]?.image || product.image || '/images/products/waistcoat-charcoal-grey.jpg'}
                      alt={product.name}
                      className="w-12 h-16 object-cover object-top rounded-xs border border-[#E8E0D2]"
                    />
                    <div className="text-left">
                      <span className="text-[10px] uppercase tracking-wider text-[#A69483] block">
                        {product.category}
                      </span>
                      <h4 className="font-serif text-base text-[#281D18] group-hover:text-[#B49A62] transition-colors">
                        {product.name}
                      </h4>
                      <span className="text-xs text-[#6F5847] font-semibold">
                        {product.priceDisplay || `₹${(product.price || product.sellingPrice || 0).toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  </div>

                  <ArrowUpRight
                    size={16}
                    className="text-[#8E7766] group-hover:text-[#34251F] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
