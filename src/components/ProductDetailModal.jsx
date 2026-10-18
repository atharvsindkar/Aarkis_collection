import React, { useState, useEffect } from 'react';
import { X, Heart, ShoppingBag, Check, ShieldCheck, Ruler, Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function ProductDetailModal() {
  const {
    selectedProductForModal,
    closeProductModal,
    selectedVariantColor,
    setSelectedVariantColor,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setIsSizeGuideOpen,
  } = useShop();

  const [activeVariant, setActiveVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (selectedProductForModal) {
      setActiveVariant(selectedVariantColor || selectedProductForModal.variants[0]);
      setSelectedSize('M');
    }
  }, [selectedProductForModal, selectedVariantColor]);

  if (!selectedProductForModal || !activeVariant) return null;

  const product = selectedProductForModal;
  const isFavorited = isInWishlist(product.id);

  const handleAdd = () => {
    setIsAdding(true);
    addToCart(product, activeVariant, selectedSize);
    setTimeout(() => {
      setIsAdding(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#221612]/70 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={closeProductModal}
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div
          className="relative bg-[#FAF7F2] w-full max-w-4xl shadow-2xl border border-[#D8C2A0] rounded-xs overflow-hidden z-10 my-8 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeProductModal}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#34251F] flex items-center justify-center shadow-md transition-transform hover:scale-110 focus:outline-none"
            aria-label="Close modal"
          >
            <X size={18} strokeWidth={1.8} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Product Image & View Notes */}
            <div className="bg-[#F0EAE1] p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E8E0D2]">
              <div className="relative aspect-[3/4] bg-white overflow-hidden rounded-xs border border-[#E8E0D2] shadow-sm">
                <img
                  src={activeVariant.image}
                  alt={`${product.name} in ${activeVariant.name}`}
                  className="w-full h-full object-cover object-top"
                />

                {/* Badge */}
                <div className="absolute top-3 left-3 bg-[#34251F] text-[#FAF7F2] text-[10px] uppercase font-semibold tracking-widest px-2.5 py-1 rounded-xs">
                  {product.category}
                </div>
              </div>

              {/* View Note */}
              <div className="mt-4 pt-3 border-t border-[#E0D7C9] text-center">
                <p className="text-xs text-[#7F6B5C] font-light italic">
                  {activeVariant.caption || 'Authentic photography from the Aarkis Atelier'}
                </p>
              </div>
            </div>

            {/* Right: Garment Specifications & Actions */}
            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {/* Category & Collection */}
                <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[#8E7766] mb-2 font-medium">
                  <span>{product.subCategory}</span>
                  <span className="text-[#B49A62]">{product.badge}</span>
                </div>

                {/* Name */}
                <h3 className="font-serif text-2xl sm:text-3xl text-[#281D18] leading-tight font-medium mb-3">
                  {product.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline space-x-3 mb-5">
                  <span className="font-serif text-2xl text-[#34251F] font-semibold">
                    {product.priceDisplay}
                  </span>
                  <span className="text-xs text-[#A69483] font-light">
                    ({product.priceNote})
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#6F5847] font-light leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* Color Variants */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs text-[#6F5847] mb-2 font-medium">
                    <span>
                      Selected Shade: <strong className="text-[#34251F]">{activeVariant.name}</strong>
                    </span>
                    {product.variants.length > 1 && (
                      <span className="text-[11px] text-[#8E7766]">
                        {product.variants.length} Available Colors
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => {
                          setActiveVariant(variant);
                          setSelectedVariantColor(variant);
                        }}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-xs border text-xs transition-all ${
                          activeVariant.id === variant.id
                            ? 'border-[#34251F] bg-white font-semibold ring-1 ring-[#34251F]'
                            : 'border-[#E8E0D2] bg-[#FAF7F2] text-[#6F5847] hover:border-[#B49A62]'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: variant.colorHex }}
                        />
                        <span>{variant.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs text-[#6F5847] mb-2 font-medium">
                    <span>Size: <strong className="text-[#34251F]">{selectedSize}</strong></span>
                    <button
                      type="button"
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="inline-flex items-center space-x-1 text-xs text-[#8E7766] underline hover:text-[#34251F]"
                    >
                      <Ruler size={13} />
                      <span>Size Guide</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`py-2 text-xs font-semibold uppercase tracking-wider rounded-xs border transition-colors ${
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

                {/* Details Accordion / Key Highlights */}
                <div className="border-t border-[#E8E0D2] pt-4 mb-6">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[#34251F] mb-2">
                    Garment Highlights
                  </p>
                  <ul className="space-y-1.5 text-xs text-[#6F5847] font-light">
                    {product.details.map((detail, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-[#B49A62] mt-0.5">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-[#E8E0D2] flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={isAdding}
                  className={`flex-1 py-3.5 px-6 rounded-xs text-xs font-semibold uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-2 shadow-sm ${
                    isAdding
                      ? 'bg-[#2E6B4E] text-white'
                      : 'bg-[#34251F] hover:bg-[#201511] text-[#FAF7F2]'
                  }`}
                >
                  {isAdding ? (
                    <>
                      <Check size={16} />
                      <span>Added to Bag</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} />
                      <span>Add to Shopping Bag</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className={`w-12 h-12 rounded-xs border flex items-center justify-center transition-colors ${
                    isFavorited
                      ? 'bg-[#34251F] text-white border-[#34251F]'
                      : 'border-[#D8C2A0] text-[#6F5847] hover:border-[#34251F] bg-white'
                  }`}
                  aria-label="Toggle Wishlist"
                >
                  <Heart size={18} fill={isFavorited ? 'white' : 'none'} />
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
