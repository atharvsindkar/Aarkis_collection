import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Heart, ShoppingBag, Check, ShieldCheck, Ruler, Sparkles, Bell, 
  ChevronLeft, ChevronRight, Maximize2, Minimize2 
} from 'lucide-react';
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
    openComingSoon,
    products,
  } = useShop();

  const [activeVariant, setActiveVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  // Cinematic Slider Drag & Transition State
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const startXRef = useRef(0);
  const currentDeltaRef = useRef(0);
  const isPointerDownRef = useRef(false);
  const hasMovedRef = useRef(false);

  const liveProduct = (products || []).find(
    p => p.id === selectedProductForModal?.id || p._id === selectedProductForModal?._id || p.slug === selectedProductForModal?.slug
  ) || selectedProductForModal;

  const product = liveProduct;

  const fallbackVariant = {
    id: 'default_v',
    name: 'Signature Shade',
    colorName: 'Signature Shade',
    colorHex: '#34251F',
    image: product?.image || '/images/products/waistcoat-charcoal-grey.jpg',
    images: Array.isArray(product?.images) && product.images.length > 0 
      ? product.images 
      : [product?.image || '/images/products/waistcoat-charcoal-grey.jpg'],
    inventory: { S: 5, M: 5, L: 5, XL: 5 }
  };

  const initialVariant = selectedVariantColor || product?.variants?.[0] || fallbackVariant;
  const currentVariant = (activeVariant && product?.variants?.some(v => v.id === activeVariant.id))
    ? activeVariant
    : initialVariant;

  const variantImages = Array.isArray(currentVariant?.images) && currentVariant.images.length > 0
    ? currentVariant.images
    : [currentVariant?.image].filter(Boolean);

  useEffect(() => {
    if (selectedProductForModal) {
      const targetVariant = selectedVariantColor || selectedProductForModal.variants?.[0] || fallbackVariant;
      setActiveVariant(targetVariant);
      setActiveImageIndex(0);
      
      // Auto-select first in-stock size if M is out of stock
      const sizes = selectedProductForModal.sizes || ['S', 'M', 'L', 'XL'];
      const mStock = targetVariant?.inventory?.['M'] !== undefined ? targetVariant.inventory['M'] : 10;
      if (mStock <= 0) {
        const firstAvailable = sizes.find(s => {
          const st = targetVariant?.inventory?.[s] !== undefined ? targetVariant.inventory[s] : 10;
          return st > 0;
        });
        setSelectedSize(firstAvailable || sizes[0] || 'M');
      } else {
        setSelectedSize('M');
      }
    }
  }, [selectedProductForModal, selectedVariantColor]);

  useEffect(() => {
    if (liveProduct && activeVariant) {
      const updatedVariant = liveProduct.variants?.find(v => v.id === activeVariant.id);
      if (updatedVariant && JSON.stringify(updatedVariant.inventory) !== JSON.stringify(activeVariant.inventory)) {
        setActiveVariant(updatedVariant);
      }
    }
  }, [liveProduct]);

  // Keyboard navigation & escape listener (declared at top level before any return)
  useEffect(() => {
    if (!selectedProductForModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => Math.min(variantImages.length - 1, prev + 1));
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          closeProductModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProductForModal, variantImages.length, isFullscreen]);

  const getStock = (variant, sizeName) => {
    if (!variant) return 0;
    const inv = variant.inventory || {};
    const key = Object.keys(inv).find(
      k => k.trim().toUpperCase() === (sizeName || '').trim().toUpperCase()
    );
    if (key !== undefined && inv[key] !== undefined && inv[key] !== null) {
      return Number(inv[key]);
    }
    return Object.keys(inv).length > 0 ? 0 : 5;
  };

  const isFavorited = isInWishlist(product?.id || product?._id);

  const displayImage = variantImages[activeImageIndex] || currentVariant?.image;
  const currentSizeStock = getStock(currentVariant, selectedSize);
  const isCurrentSizeOutOfStock = currentSizeStock <= 0;

  // Manual Touch & Mouse Pointer Drag Gestures
  const handlePointerDown = (e) => {
    if (variantImages.length <= 1) return;
    isPointerDownRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.clientX;
    currentDeltaRef.current = 0;
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    if (Math.abs(deltaX) > 4) {
      hasMovedRef.current = true;
      setIsDragging(true);

      let dampened = deltaX;
      if (
        (activeImageIndex === 0 && deltaX > 0) ||
        (activeImageIndex === variantImages.length - 1 && deltaX < 0)
      ) {
        dampened = deltaX * 0.32; // Elastic resistance at bounds
      }
      currentDeltaRef.current = dampened;
      setDragOffset(dampened);
    }
  };

  const handlePointerUp = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);

    const delta = currentDeltaRef.current;
    if (Math.abs(delta) > 45) {
      if (delta < 0 && activeImageIndex < variantImages.length - 1) {
        setActiveImageIndex((prev) => prev + 1);
      } else if (delta > 0 && activeImageIndex > 0) {
        setActiveImageIndex((prev) => prev - 1);
      }
    }

    setDragOffset(0);
    currentDeltaRef.current = 0;
  };

  const handleAdd = () => {
    if (product.isComingSoon) {
      closeProductModal();
      openComingSoon(product.category || product.name);
      return;
    }
    if (isCurrentSizeOutOfStock) return;
    setIsAdding(true);
    addToCart(product, currentVariant, selectedSize);
    setTimeout(() => {
      setIsAdding(false);
    }, 1200);
  };

  if (!selectedProductForModal || !product) return null;

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
            {/* Left: Product Image Stage & View Notes */}
            <div className="bg-[#F0EAE1] p-5 sm:p-7 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E8E0D2]">
              <div>
                {/* Cinematic Slider Viewport */}
                <div
                  className="relative aspect-[3/4] bg-[#EFE9DE] overflow-hidden rounded-xs border border-[#E8E0D2] shadow-sm select-none cursor-grab active:cursor-grabbing group"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={{ touchAction: 'pan-y' }}
                >
                  {/* Sliding Image Track */}
                  <div
                    className="flex h-full w-full will-change-transform"
                    style={{
                      transform: `translateX(calc(-${activeImageIndex * 100}% + ${dragOffset}px))`,
                      transition: isDragging ? 'none' : 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {variantImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="w-full h-full flex-shrink-0 relative overflow-hidden bg-[#EFE9DE]"
                        onClick={() => {
                          if (!hasMovedRef.current) {
                            setIsFullscreen(true);
                          }
                        }}
                      >
                        <img
                          src={img}
                          alt={`${product.name} - View ${idx + 1}`}
                          draggable={false}
                          className={`w-full h-full object-cover object-top select-none pointer-events-none transition-all duration-700 ease-out ${
                            activeImageIndex === idx
                              ? 'scale-100 opacity-100'
                              : 'scale-[0.96] opacity-60'
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Top Category Badge */}
                  <div className="absolute top-3.5 left-3.5 z-10 bg-[#34251F]/90 backdrop-blur-md text-[#FAF7F2] text-[10px] uppercase font-semibold tracking-widest px-2.5 py-1 rounded-xs pointer-events-none shadow-xs">
                    {product.category}
                  </div>

                  {/* Image Counter (e.g. 01 / 03) */}
                  {variantImages.length > 1 && (
                    <div className="absolute top-3.5 right-3.5 z-10 bg-black/40 backdrop-blur-md text-white text-[10px] font-mono tracking-[0.2em] px-2.5 py-1 rounded-xs uppercase pointer-events-none shadow-xs">
                      {String(activeImageIndex + 1).padStart(2, '0')} / {String(variantImages.length).padStart(2, '0')}
                    </div>
                  )}

                  {/* Previous Control Button */}
                  {variantImages.length > 1 && (
                    <button
                      type="button"
                      disabled={activeImageIndex === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => Math.max(0, prev - 1));
                      }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#34251F] flex items-center justify-center shadow-md backdrop-blur-md transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none hover:scale-105 active:scale-95 opacity-80 group-hover:opacity-100"
                      aria-label="Previous photograph"
                    >
                      <ChevronLeft size={16} strokeWidth={2} />
                    </button>
                  )}

                  {/* Next Control Button */}
                  {variantImages.length > 1 && (
                    <button
                      type="button"
                      disabled={activeImageIndex === variantImages.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => Math.min(variantImages.length - 1, prev + 1));
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#34251F] flex items-center justify-center shadow-md backdrop-blur-md transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none hover:scale-105 active:scale-95 opacity-80 group-hover:opacity-100"
                      aria-label="Next photograph"
                    >
                      <ChevronRight size={16} strokeWidth={2} />
                    </button>
                  )}

                  {/* Fullscreen Inspect Trigger */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFullscreen(true);
                    }}
                    className="absolute bottom-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all duration-300 opacity-70 group-hover:opacity-100 hover:scale-105"
                    aria-label="View Fullscreen"
                    title="Inspect tailoring in high-resolution"
                  >
                    <Maximize2 size={13} strokeWidth={2} />
                  </button>
                </div>

                {/* Multiple Images Thumbnail Gallery */}
                {variantImages.length > 1 && (
                  <div className="flex items-center gap-2 mt-3.5 overflow-x-auto pb-1 scrollbar-none">
                    {variantImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-14 h-18 rounded-xs overflow-hidden border-2 transition-all duration-300 shrink-0 ${
                          activeImageIndex === idx
                            ? 'border-[#34251F] ring-1 ring-[#34251F] shadow-sm opacity-100 scale-[1.02]'
                            : 'border-transparent opacity-60 hover:opacity-90 hover:border-[#D8C2A0]'
                        }`}
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover object-top"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Note */}
              <div className="mt-4 pt-3 border-t border-[#E0D7C9] text-center">
                <p className="text-xs text-[#7F6B5C] font-light italic">
                  {currentVariant.caption || 'Authentic photography from the Aarkis Atelier • Drag or swipe to explore'}
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
                    {product.priceDisplay || `₹${(product.price || product.sellingPrice || 0).toLocaleString('en-IN')}`}
                  </span>
                  {product.priceNote && (
                    <span className="text-xs text-[#A69483] font-light">
                      ({product.priceNote})
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#6F5847] font-light leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* Color Variants */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs text-[#6F5847] mb-2 font-medium">
                    <span>
                      Selected Shade: <strong className="text-[#34251F]">{currentVariant.colorName || currentVariant.name}</strong>
                    </span>
                    {(product.variants || []).length > 1 && (
                      <span className="text-[11px] text-[#8E7766]">
                        {product.variants.length} Available Colors
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {(product.variants || []).map((variant, idx) => (
                      <button
                        key={variant.id || idx}
                        type="button"
                        onClick={() => {
                          setActiveVariant(variant);
                          setSelectedVariantColor(variant);
                        }}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-xs border text-xs transition-all ${
                          currentVariant.id === variant.id
                            ? 'border-[#34251F] bg-white font-semibold ring-1 ring-[#34251F]'
                            : 'border-[#E8E0D2] bg-[#FAF7F2] text-[#6F5847] hover:border-[#B49A62]'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: variant.colorHex || '#34251F' }}
                        />
                        <span>{variant.name || variant.colorName || 'Shade'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {product.isComingSoon && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xs text-xs text-amber-900 mb-5 flex items-start space-x-2">
                    <Sparkles size={14} className="text-[#B49A62] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-medium">Atelier Capsule Preview</strong>
                      <span className="text-[11px] text-amber-800">
                        This creation is currently in master tailoring and not yet available for direct ordering. Tap "Notify Me" to register for private drop access.
                      </span>
                    </div>
                  </div>
                )}

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
                    {(product.sizes || ['S', 'M', 'L', 'XL']).map((size) => {
                      const stockCount = getStock(currentVariant, size);
                      const isOutOfStock = stockCount <= 0;
                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => setSelectedSize(size)}
                          className={`py-2 text-xs font-semibold uppercase tracking-wider rounded-xs border transition-colors relative ${
                            isOutOfStock
                              ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed line-through'
                              : selectedSize === size
                              ? 'bg-[#34251F] text-white border-[#34251F]'
                              : 'bg-white text-[#6F5847] border-[#E8E0D2] hover:border-[#B49A62]'
                          }`}
                        >
                          {size}
                          {stockCount > 0 && stockCount <= 3 && (
                            <span className="block text-[8px] font-normal text-amber-600 lowercase tracking-normal">
                              {stockCount} left
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Details Accordion / Key Highlights */}
                <div className="border-t border-[#E8E0D2] pt-4 mb-6">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[#34251F] mb-2">
                    Garment Highlights
                  </p>
                  <ul className="space-y-1.5 text-xs text-[#6F5847] font-light">
                    {(Array.isArray(product.details) ? product.details : (Array.isArray(product.highlights) ? product.highlights : [])).map((detail, i) => (
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
                {product.isComingSoon ? (
                  <button
                    type="button"
                    onClick={() => {
                      closeProductModal();
                      openComingSoon(product.category || product.name);
                    }}
                    className="flex-1 py-3.5 px-6 rounded-xs text-xs font-semibold uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-2 shadow-sm bg-[#B49A62] hover:bg-[#9E824A] text-white"
                  >
                    <Bell size={16} />
                    <span>Coming Soon • Notify Me</span>
                  </button>
                ) : isCurrentSizeOutOfStock ? (
                  <button
                    type="button"
                    disabled
                    className="flex-1 py-3.5 px-6 rounded-xs text-xs font-semibold uppercase tracking-[0.2em] bg-[#E8E0D2] text-[#8E7766] cursor-not-allowed border border-[#D8C2A0] flex items-center justify-center space-x-2 shadow-none"
                  >
                    <ShoppingBag size={16} />
                    <span>Size {selectedSize} • Out of Stock</span>
                  </button>
                ) : (
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
                )}

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

      {/* Fullscreen High-Resolution Lightbox */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-[#140D0A]/95 backdrop-blur-lg flex flex-col justify-between p-4 sm:p-8 animate-fade-in"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Header */}
          <div className="flex items-center justify-between text-white/90 z-10" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs tracking-[0.2em] uppercase font-light">
              <span className="font-serif text-base font-normal block text-[#FAF7F2]">{product.name}</span>
              <span className="text-[#B49A62] text-[11px]">{currentVariant.name || currentVariant.colorName}</span>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono tracking-widest text-[#D8C2A0]">
                {String(activeImageIndex + 1).padStart(2, '0')} / {String(variantImages.length).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-105"
                aria-label="Exit fullscreen"
              >
                <Minimize2 size={18} />
              </button>
            </div>
          </div>

          {/* Center Stage */}
          <div
            className="relative flex-1 flex items-center justify-center my-4 overflow-hidden select-none"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div
              className="flex h-full w-full items-center justify-center will-change-transform"
              style={{
                transform: `translateX(calc(-${activeImageIndex * 100}% + ${dragOffset}px))`,
                transition: isDragging ? 'none' : 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {variantImages.map((img, idx) => (
                <div key={idx} className="w-full h-full flex-shrink-0 flex items-center justify-center p-2">
                  <img
                    src={img}
                    alt=""
                    draggable={false}
                    className="max-h-[82vh] max-w-[85vw] object-contain rounded-xs shadow-2xl transition-transform duration-700 select-none pointer-events-none"
                  />
                </div>
              ))}
            </div>

            {/* Lightbox Prev / Next */}
            {variantImages.length > 1 && (
              <>
                <button
                  type="button"
                  disabled={activeImageIndex === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => Math.max(0, prev - 1));
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 disabled:opacity-0"
                  aria-label="Previous"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  disabled={activeImageIndex === variantImages.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => Math.min(variantImages.length - 1, prev + 1));
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 disabled:opacity-0"
                  aria-label="Next"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>

          {/* Footer Thumbnails in Lightbox */}
          {variantImages.length > 1 && (
            <div className="flex items-center justify-center gap-3 z-10" onClick={(e) => e.stopPropagation()}>
              {variantImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-12 h-15 rounded-xs overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? 'border-[#B49A62] scale-110 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
