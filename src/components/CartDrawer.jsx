import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Check } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartCount,
  } = useShop();

  const [checkoutStep, setCheckoutStep] = useState('cart'); // cart | success

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setCheckoutStep('success');
  };

  const resetAndClose = () => {
    if (checkoutStep === 'success') {
      clearCart();
      setCheckoutStep('cart');
    }
    setIsCartOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#221612]/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={resetAndClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF7F2] shadow-2xl flex flex-col border-l border-[#D8C2A0] animate-fade-in">
          
          {/* Header */}
          <div className="p-6 bg-[#FAF7F2] border-b border-[#E8E0D2] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag size={18} className="text-[#34251F]" />
              <h2 className="font-serif text-xl sm:text-2xl text-[#281D18] font-normal">
                Shopping Bag
              </h2>
              <span className="text-xs uppercase tracking-wider text-[#8E7766] ml-2">
                ({cartCount} {cartCount === 1 ? 'item' : 'items'})
              </span>
            </div>

            <button
              type="button"
              onClick={resetAndClose}
              className="p-1.5 text-[#6F5847] hover:text-[#34251F] focus:outline-none"
              aria-label="Close bag"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {checkoutStep === 'success' ? (
              <div className="text-center py-12 px-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-[#EFE8DD] text-[#34251F] mx-auto flex items-center justify-center mb-5">
                  <Check size={32} />
                </div>
                <h3 className="font-serif text-2xl text-[#281D18] mb-2 font-medium">
                  Atelier Order Requested
                </h3>
                <p className="text-xs text-[#6F5847] leading-relaxed max-w-xs mx-auto mb-6">
                  Thank you for curating your look with Aarkis Collection. In this preview edition, our styling concierge is notified.
                </p>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-6 py-3 bg-[#34251F] text-[#FAF7F2] text-xs uppercase tracking-widest font-semibold rounded-xs"
                >
                  Continue Exploring
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center py-16 px-4">
                <ShoppingBag size={40} strokeWidth={1.2} className="mx-auto text-[#D8C2A0] mb-4" />
                <h3 className="font-serif text-xl text-[#34251F] mb-2">
                  Your bag is empty
                </h3>
                <p className="text-xs text-[#8E7766] font-light max-w-xs mx-auto mb-6">
                  Explore our tailored silhouettes and discover pieces to style your own way.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-[#34251F] text-[#FAF7F2] text-xs uppercase tracking-wider font-semibold rounded-xs"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#EAE2D5]">
                {cart.map((item) => (
                  <div key={item.cartItemId} className="py-4 flex space-x-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-24 bg-[#EFE9DE] border border-[#E8E0D2] rounded-xs overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-serif text-base text-[#281D18] font-medium leading-tight">
                            {item.shortName || item.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.cartItemId)}
                            className="text-[#A69483] hover:text-[#B9382B] p-1 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="mt-1 flex items-center space-x-3 text-xs text-[#7F6B5C]">
                          <span className="flex items-center space-x-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/10"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            <span>{item.colorName}</span>
                          </span>
                          <span>•</span>
                          <span>Size: {item.size}</span>
                        </div>

                        <p className="text-xs font-semibold text-[#34251F] mt-1.5">
                          {item.priceDisplay}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center border border-[#D8C2A0] rounded-xs bg-white">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartItemId, -1)}
                            className="p-1 px-2 text-[#6F5847] hover:bg-[#FAF7F2]"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-2 text-xs font-medium text-[#34251F]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartItemId, 1)}
                            className="p-1 px-2 text-[#6F5847] hover:bg-[#FAF7F2]"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <span className="text-xs font-medium text-[#34251F]">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Subtotal & Checkout */}
          {cart.length > 0 && checkoutStep === 'cart' && (
            <div className="p-6 bg-white border-t border-[#E8E0D2] shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest text-[#8E7766]">
                  Bag Total
                </span>
                <span className="font-serif text-2xl font-semibold text-[#281D18]">
                  ₹{cartSubtotal.toLocaleString()}
                </span>
              </div>

              <p className="text-[11px] text-[#A69483] mb-4 text-center">
                Taxes & personalized fittings confirmed during atelier concierge checkout.
              </p>

              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-3.5 bg-[#34251F] hover:bg-[#201511] text-[#FAF7F2] text-xs font-semibold uppercase tracking-[0.2em] rounded-xs flex items-center justify-center space-x-2 transition-colors shadow"
              >
                <span>Proceed with Curation</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
