import React, { useState, useEffect } from 'react';
import { Heart, Eye, ShoppingBag, Check, Bell, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, isInWishlist, openProductModal, setIsSizeGuideOpen, openComingSoon } = useShop();

  // Selected variant state linked directly to product prop to guarantee real-time stock sync
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.id);
  const activeVariant = product.variants?.find((v) => v.id === selectedVariantId) || product.variants?.[0] || {
    id: 'default',
    name: 'Primary Shade',
    colorName: 'Primary Shade',
    colorHex: '#34251F',
    image: product.image || '/images/products/waistcoat-charcoal-grey.jpg',
    images: [product.image || '/images/products/waistcoat-charcoal-grey.jpg']
  };
  const [selectedSize, setSelectedSize] = useState('M');
  const [isAdding, setIsAdding] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Variant images for active shade
  const variantImages = (activeVariant?.images && activeVariant.images.length > 0)
    ? activeVariant.images
    : (activeVariant?.image ? [activeVariant.image] : []);

  // When variant changes, reset image index to 0
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedVariantId]);

  // When activeVariant updates, if selectedSize is out of stock, auto-select first in-stock size if available
  useEffect(() => {
    if (activeVariant) {
      const stock = getStock(activeVariant, selectedSize);
      if (stock <= 0) {
        const sizes = product.sizes || ['S', 'M', 'L', 'XL'];
        const firstAvailable = sizes.find((s) => getStock(activeVariant, s) > 0);
        if (firstAvailable) {
          setSelectedSize(firstAvailable);
        }
      }
    }
  }, [activeVariant]);

  const isFavorited = isInWishlist(product.id);

  // Robust case-insensitive stock calculations
  const getStock = (variant, sizeName) => {
    if (!variant) return 0;
    const inv = variant.inventory || {};
    const key = Object.keys(inv).find(
      (k) => k.trim().toUpperCase() === (sizeName || '').trim().toUpperCase()
    );
    if (key !== undefined && inv[key] !== undefined && inv[key] !== null) {
      return Number(inv[key]);
    }
    return Object.keys(inv).length > 0 ? 0 : 5;
  };

  const selectedSizeStock = getStock(activeVariant, selectedSize);
  const isOutOfStock = selectedSizeStock <= 0;
  const isLowStock = selectedSizeStock > 0 && selectedSizeStock <= 3;

  const handleColorChange = (e, variant) => {
    e.stopPropagation();
    setSelectedVariantId(variant.id);
  };

  const handleSizeSelect = (e, size) => {
    e.stopPropagation();
    setSelectedSize(size);
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (product.isComingSoon) {
      openComingSoon(product.category || product.name);
      return;
    }
    if (isOutOfStock) return;

    setIsAdding(true);
    addToCart(product, activeVariant, selectedSize);
    setTimeout(() => {
      setIsAdding(false);
    }, 1200);
  };

  return (
    <div
      onClick={() => openProductModal(product, activeVariant)}
      className="group flex flex-col bg-[#FFFFFF] border border-[#E8E0D2] rounded-xs overflow-hidden cursor-pointer transition-all duration-400 hover:shadow-[0_20px_45px_rgba(52,37,31,0.08)] hover:border-[#D8C2A0]"
    >
      {/* Product Image Stage with Manual Arrow Sliding */}
      <div className="relative aspect-[3/4] bg-[#F5EFE6] overflow-hidden group/stage">
        {variantImages.map((imgUrl, idx) => {
          const isCurrent = currentImageIndex === idx;
          return (
            <img
              key={idx}
              src={imgUrl}
              alt={`${product.name} in ${activeVariant.name}`}
              className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 ease-out ${
                isCurrent
                  ? 'opacity-100 scale-100 z-0'
                  : 'opacity-0 scale-95 pointer-events-none'
              }`}
            />
          );
        })}

        {/* Manual Arrow Buttons for Image Browsing */}
        {variantImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : variantImages.length - 1));
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 hover:bg-white text-[#34251F] flex items-center justify-center shadow-md backdrop-blur-md transition-all opacity-0 group-hover/stage:opacity-100 hover:scale-105 active:scale-95"
              aria-label="Previous photograph"
            >
              <ChevronLeft size={15} strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev < variantImages.length - 1 ? prev + 1 : 0));
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 hover:bg-white text-[#34251F] flex items-center justify-center shadow-md backdrop-blur-md transition-all opacity-0 group-hover/stage:opacity-100 hover:scale-105 active:scale-95"
              aria-label="Next photograph"
            >
              <ChevronRight size={15} strokeWidth={2} />
            </button>

            {/* Pagination Dots Indicator */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center space-x-1 z-10">
              {variantImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(i);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentImageIndex === i ? 'w-4 bg-white shadow-sm' : 'w-1.5 bg-white/60 hover:bg-white'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none z-10">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="text-[10px] uppercase font-semibold tracking-[0.2em] px-2.5 py-1 bg-white/95 text-[#34251F] border border-[#E8E0D2] rounded-xs shadow-xs">
              {product.category}
            </span>
            {product.isComingSoon ? (
              <span className="text-[9px] uppercase font-semibold tracking-[0.18em] px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-xs shadow-xs">
                Coming Soon
              </span>
            ) : product.isNewArrival && (
              <span className="text-[9px] uppercase font-semibold tracking-[0.18em] px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xs shadow-xs">
                New Arrival
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
              isFavorited
                ? 'bg-[#34251F] text-[#FAF7F2]'
                : 'bg-white/90 text-[#6F5847] hover:bg-white hover:text-[#34251F]'
            }`}
            aria-label={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart
              size={15}
              strokeWidth={1.7}
              fill={isFavorited ? '#FAF7F2' : 'none'}
            />
          </button>
        </div>

        {/* Quick Atelier View Button Overlay on Hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openProductModal(product, activeVariant);
            }}
            className="w-full flex items-center justify-center py-2.5 px-3 bg-white/95 hover:bg-white text-[#34251F] text-xs font-semibold tracking-wider uppercase shadow-md rounded-xs transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <Eye size={14} className="mr-2 text-[#8E7766]" />
            <span>Quick Atelier View</span>
          </button>
        </div>
      </div>

      {/* Product Information Area */}
      <div className="p-5 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Subcategory / Badge & Low Stock notification */}
          <div className="flex items-center justify-between text-[11px] text-[#8E7766] uppercase tracking-wider mb-1.5">
            <span>{product.badge || product.subCategory}</span>
            <div className="text-right">
              <span className="text-[#B49A62] font-semibold">
                {product.priceDisplay || `₹${(product.price || product.sellingPrice || 0).toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="font-serif text-lg sm:text-xl text-[#281D18] leading-snug font-medium mb-2 group-hover:text-[#B49A62] transition-colors line-clamp-2">
            {product.name}
          </h3>

          {/* Low Stock Indicator */}
          {isLowStock && !product.isComingSoon && (
            <div className="mb-2 text-[10px] text-amber-700 font-semibold uppercase tracking-wider flex items-center space-x-1">
              <AlertCircle size={11} className="text-amber-600" />
              <span>Only {selectedSizeStock} left in size {selectedSize}!</span>
            </div>
          )}

          {/* Color Variants Switcher */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-[11px] text-[#6F5847] mb-2">
              <span className="font-light">
                Shade: <span className="font-medium text-[#34251F]">{activeVariant.colorName || activeVariant.name}</span>
              </span>
              {(product.variants || []).length > 1 && (
                <span className="text-[10px] text-[#A69483] uppercase tracking-wider">
                  {product.variants.length} Colors
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2.5">
              {(product.variants || []).map((variant, idx) => (
                <button
                  key={variant.id || idx}
                  type="button"
                  onClick={(e) => handleColorChange(e, variant)}
                  className={`relative p-0.5 rounded-full transition-all duration-200 ${
                    activeVariant.id === variant.id
                      ? 'ring-2 ring-[#34251F] ring-offset-2 scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  aria-label={`Select ${variant.name || variant.colorName}`}
                  title={variant.name || variant.colorName}
                >
                  <span
                    className="block w-4 h-4 rounded-full border border-black/15 shadow-inner"
                    style={{ backgroundColor: variant.colorHex || '#34251F' }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector with Live Stock Badges */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-[11px] text-[#6F5847] mb-1.5">
              <span className="font-light">Select Size:</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSizeGuideOpen(true);
                }}
                className="text-[10px] uppercase text-[#8E7766] underline hover:text-[#34251F]"
              >
                Size Guide
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {product.sizes.map((size) => {
                const stockForSize = getStock(activeVariant, size);
                const sizeSoldOut = stockForSize <= 0;
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={sizeSoldOut}
                    onClick={(e) => handleSizeSelect(e, size)}
                    className={`py-1 text-xs font-medium border rounded-xs transition-colors flex flex-col items-center justify-center ${
                      sizeSoldOut
                        ? 'bg-neutral-100 text-neutral-300 border-neutral-200 line-through cursor-not-allowed'
                        : selectedSize === size
                        ? 'bg-[#34251F] text-white border-[#34251F]'
                        : 'bg-white text-[#6F5847] border-[#E8E0D2] hover:border-[#B49A62]'
                    }`}
                  >
                    <span>{size}</span>
                    {stockForSize > 0 && stockForSize <= 3 && (
                      <span className="text-[8px] font-normal text-amber-600 leading-none mt-0.5">
                        {stockForSize} left
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Button: Add to Bag, Out of Stock, or Coming Soon */}
        <div className="pt-3 border-t border-[#F0EAE1]">
          {product.isComingSoon ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openComingSoon(product.category || product.name);
              }}
              className="w-full py-2.5 px-4 text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-300 rounded-xs flex items-center justify-center space-x-2 bg-[#FAF7F2] hover:bg-[#34251F] text-[#8E7766] hover:text-[#FAF7F2] border border-[#D8C2A0]"
            >
              <Bell size={13} className="text-[#B49A62]" />
              <span>Coming Soon • Notify Me</span>
            </button>
          ) : isOutOfStock ? (
            <button
              type="button"
              disabled
              onClick={(e) => e.stopPropagation()}
              className="w-full py-2.5 px-4 text-xs font-semibold uppercase tracking-[0.18em] rounded-xs flex items-center justify-center space-x-2 bg-[#EFE9DE] text-[#8E7766] border border-[#D8C2A0] cursor-not-allowed shadow-none"
            >
              <AlertCircle size={13} />
              <span>Size {selectedSize} • Out of Stock</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={isAdding}
              className={`w-full py-2.5 px-4 text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-300 rounded-xs flex items-center justify-center space-x-2 ${
                isAdding
                  ? 'bg-[#2E6B4E] text-white'
                  : 'bg-[#FAF7F2] hover:bg-[#34251F] text-[#34251F] hover:text-[#FAF7F2] border border-[#D8C2A0]'
              }`}
            >
              {isAdding ? (
                <>
                  <Check size={14} />
                  <span>Added to Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={14} strokeWidth={1.8} />
                  <span>Add to Bag</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
