import React from 'react';
import { X, Heart, ShoppingBag, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function WishlistDrawer() {
  const {
    wishlist,
    toggleWishlist,
    isWishlistOpen,
    setIsWishlistOpen,
    products,
    addToCart,
    openProductModal,
    showToast
  } = useShop();

  if (!isWishlistOpen) return null;

  // Filter products currently in wishlist
  const wishlistProducts = (products || []).filter((p) => wishlist.includes(p.id));

  const handleMoveToBag = (product) => {
    if (product.isComingSoon) {
      showToast('This creation is currently coming soon.');
      return;
    }
    const defaultVariant = product.variants?.[0];
    const defaultSize = product.sizes?.[0] || 'M';

    const sizeKey = Object.keys(defaultVariant?.inventory || {}).find(
      k => k.trim().toUpperCase() === defaultSize.toUpperCase()
    ) || defaultSize;
    const stock = Number(defaultVariant?.inventory?.[sizeKey] ?? 10);

    if (stock <= 0) {
      // If default size is out of stock, open modal so patron can choose available size
      openProductModal(product, defaultVariant);
      setIsWishlistOpen(false);
      return;
    }

    addToCart(product, defaultVariant, defaultSize);
    toggleWishlist(product.id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#221612]/70 backdrop-blur-xs transition-opacity"
        onClick={() => setIsWishlistOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF7F2] border-l border-[#D8C2A0] shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-[#E8E0D2] bg-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#D8C2A0] flex items-center justify-center text-[#34251F]">
                <Heart size={15} fill="#34251F" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#B49A62] font-semibold block">
                  Private Wardrobe
                </span>
                <h2 className="font-serif text-xl text-[#281D18] font-normal leading-tight">
                  Atelier Wishlist ({wishlistProducts.length})
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsWishlistOpen(false)}
              className="p-1.5 text-[#6F5847] hover:text-[#281D18] focus:outline-none"
              aria-label="Close Wishlist"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {wishlistProducts.length === 0 ? (
              <div className="text-center py-20 px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-white border border-[#E8E0D2] flex items-center justify-center mx-auto text-[#D8C2A0] shadow-xs">
                  <Heart size={26} strokeWidth={1.2} />
                </div>
                <h3 className="font-serif text-xl text-[#34251F]">
                  Your wishlist is empty
                </h3>
                <p className="text-xs text-[#8E7766] font-light max-w-xs mx-auto leading-relaxed">
                  Save pieces you admire while exploring the atelier edit. Tap the heart on any silhouette to curate your private selection.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsWishlistOpen(false);
                    const el = document.getElementById('collection');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#34251F] text-[#FAF7F2] text-xs uppercase tracking-widest font-semibold rounded-xs hover:bg-[#201511] transition-colors"
                >
                  <span>Explore Collection</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#EAE2D5]">
                {wishlistProducts.map((product) => {
                  const coverVariant = product.variants?.[0];
                  const coverImage = coverVariant?.image || product.image;

                  return (
                    <div key={product.id} className="py-4 flex space-x-4">
                      {/* Thumbnail */}
                      <div
                        onClick={() => {
                          openProductModal(product, coverVariant);
                          setIsWishlistOpen(false);
                        }}
                        className="w-20 h-26 bg-[#EFE9DE] border border-[#E8E0D2] rounded-xs overflow-hidden flex-shrink-0 cursor-pointer group"
                      >
                        <img
                          src={coverImage}
                          alt={product.name}
                          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>

                      {/* Details & Actions */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-[#8E7766] font-medium block">
                                {product.category}
                              </span>
                              <h4
                                onClick={() => {
                                  openProductModal(product, coverVariant);
                                  setIsWishlistOpen(false);
                                }}
                                className="font-serif text-sm text-[#281D18] font-medium leading-tight cursor-pointer hover:text-[#B49A62] transition-colors"
                              >
                                {product.shortName || product.name}
                              </h4>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleWishlist(product.id)}
                              className="text-[#A69483] hover:text-rose-600 p-1 transition-colors"
                              title="Remove from wishlist"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <p className="text-xs font-semibold text-[#34251F] mt-1.5">
                            {product.priceDisplay}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 flex items-center space-x-2">
                          {product.isComingSoon ? (
                            <span className="text-[10px] uppercase font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-xs">
                              Coming Soon
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMoveToBag(product)}
                              className="flex-1 py-1.5 px-3 bg-[#34251F] hover:bg-[#201511] text-[#FAF7F2] text-[11px] font-semibold uppercase tracking-wider rounded-xs flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                            >
                              <ShoppingBag size={12} />
                              <span>Move to Bag</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              openProductModal(product, coverVariant);
                              setIsWishlistOpen(false);
                            }}
                            className="px-2.5 py-1.5 bg-white border border-[#D8C2A0] text-[#34251F] text-[11px] font-medium rounded-xs hover:border-[#34251F] transition-colors"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer note */}
          {wishlistProducts.length > 0 && (
            <div className="p-4 border-t border-[#E8E0D2] bg-white text-center">
              <p className="text-[11px] text-[#7F6B5C] font-light flex items-center justify-center space-x-1">
                <Sparkles size={12} className="text-[#B49A62]" />
                <span>Atelier pieces are tailored in limited bespoke batches</span>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
