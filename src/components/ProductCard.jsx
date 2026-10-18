import React, { useState } from 'react';
import { Heart, Eye, ShoppingBag, Check } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, isInWishlist, openProductModal, setIsSizeGuideOpen } = useShop();

  const [activeVariant, setActiveVariant] = useState(product.variants[0]);
  const [selectedSize, setSelectedSize] = useState('M');
  const [isAdding, setIsAdding] = useState(false);

  const isFavorited = isInWishlist(product.id);

  const handleColorChange = (e, variant) => {
    e.stopPropagation();
    setActiveVariant(variant);
  };

  const handleSizeSelect = (e, size) => {
    e.stopPropagation();
    setSelectedSize(size);
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
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
      {/* Product Image Stage */}
      <div className="relative aspect-[3/4] bg-[#F5EFE6] overflow-hidden">
        <img
          src={activeVariant.image}
          alt={`${product.name} in ${activeVariant.name}`}
          className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none">
          <span className="text-[10px] uppercase font-semibold tracking-[0.2em] px-2.5 py-1 bg-white/95 text-[#34251F] border border-[#E8E0D2] rounded-xs shadow-xs">
            {product.category}
          </span>

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

        {/* Quick View Button overlay on hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden sm:block">
          <div className="flex items-center justify-center py-2 px-3 bg-white/95 backdrop-blur-xs text-[#34251F] text-xs font-medium tracking-wider uppercase shadow-md rounded-xs">
            <Eye size={14} className="mr-2 text-[#8E7766]" />
            <span>Quick Atelier View</span>
          </div>
        </div>
      </div>

      {/* Product Information Area */}
      <div className="p-5 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Subcategory / Badge */}
          <div className="flex items-center justify-between text-[11px] text-[#8E7766] uppercase tracking-wider mb-1.5">
            <span>{product.badge}</span>
            <span className="text-[#B49A62] font-semibold">{product.priceDisplay}</span>
          </div>

          {/* Product Title */}
          <h3 className="font-serif text-lg sm:text-xl text-[#281D18] leading-snug font-medium mb-3 group-hover:text-[#B49A62] transition-colors line-clamp-2">
            {product.name}
          </h3>

          {/* Color Variants Switcher */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-[11px] text-[#6F5847] mb-2">
              <span className="font-light">
                Shade: <span className="font-medium text-[#34251F]">{activeVariant.name}</span>
              </span>
              {product.variants.length > 1 && (
                <span className="text-[10px] text-[#A69483] uppercase tracking-wider">
                  {product.variants.length} Colors
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2.5">
              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={(e) => handleColorChange(e, variant)}
                  className={`relative p-0.5 rounded-full transition-all duration-200 ${
                    activeVariant.id === variant.id
                      ? 'ring-2 ring-[#34251F] ring-offset-2 scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  aria-label={`Select ${variant.name}`}
                  title={variant.name}
                >
                  <span
                    className="block w-4 h-4 rounded-full border border-black/15 shadow-inner"
                    style={{ backgroundColor: variant.colorHex }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector */}
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
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={(e) => handleSizeSelect(e, size)}
                  className={`py-1 text-xs font-medium border rounded-xs transition-colors ${
                    selectedSize === size
                      ? 'bg-[#34251F] text-white border-[#34251F]'
                      : 'bg-white text-[#6F5847] border-[#E8E0D2] hover:border-[#B49A62]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button: Add to Bag */}
        <div className="pt-3 border-t border-[#F0EAE1]">
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
        </div>
      </div>
    </div>
  );
}
