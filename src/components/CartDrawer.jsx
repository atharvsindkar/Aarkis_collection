import React, { useState } from 'react';
import { 
  X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Check, Tag, ShieldCheck, 
  MapPin, User, CreditCard, ChevronLeft, AlertCircle, Loader2
} from 'lucide-react';
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
    showToast
  } = useShop();

  // steps: 'cart' | 'checkout' | 'success'
  const [step, setStep] = useState('cart');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Checkout form
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    paymentMethod: 'cod' // 'cod' or 'razorpay'
  });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  if (!isCartOpen) return null;

  // Coupon application via API
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          cartTotal: cartSubtotal,
          customerEmail: formData.email || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedCoupon(data.coupon);
        showToast(`Coupon ${data.coupon.code} applied! Saved ₹${data.coupon.discountAmount}`);
      } else {
        setCouponError(data.message || 'Invalid or expired coupon');
      }
    } catch (err) {
      setCouponError('Network error validating coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const shippingCharge = cartSubtotal >= 5000 || cartSubtotal === 0 ? 0 : 250;
  const finalTotal = Math.max(0, cartSubtotal - discountAmount + shippingCharge);

  // Submit order to API
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone || !formData.addressLine1 || !formData.city || !formData.postalCode) {
      setCheckoutError('Please complete all required shipping fields.');
      return;
    }

    setIsSubmittingOrder(true);
    setCheckoutError('');

    try {
      const payload = {
        customer: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone
        },
        shippingAddress: {
          addressLine1: formData.addressLine1,
          city: formData.city,
          state: formData.state || 'State',
          postalCode: formData.postalCode,
          country: 'India'
        },
        items: cart.map(item => ({
          productId: item.productId,
          variantId: item.colorId,
          size: item.size,
          quantity: item.quantity
        })),
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        paymentMethod: formData.paymentMethod
      };

      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPlacedOrder(data.order);
        setStep('success');
        clearCart();
        showToast(`Order #${data.order.orderNumber} confirmed!`);
      } else {
        setCheckoutError(data.message || 'Unable to place order. Please review stock or details.');
      }
    } catch (err) {
      setCheckoutError('Order placement failed. Please verify your connection.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const resetAndClose = () => {
    if (step === 'success') {
      setStep('cart');
      setPlacedOrder(null);
      setAppliedCoupon(null);
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

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FAF7F2] shadow-2xl flex flex-col border-l border-[#D8C2A0] animate-fade-in">
          
          {/* Header */}
          <div className="p-5 sm:p-6 bg-[#FAF7F2] border-b border-[#E8E0D2] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {step === 'checkout' && (
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="p-1 -ml-2 mr-1 text-[#6F5847] hover:text-[#34251F]"
                  title="Back to Bag"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <ShoppingBag size={18} className="text-[#34251F]" />
              <h2 className="font-serif text-xl sm:text-2xl text-[#281D18] font-normal">
                {step === 'cart' && 'Shopping Bag'}
                {step === 'checkout' && 'Concierge Checkout'}
                {step === 'success' && 'Order Confirmed'}
              </h2>
              {step === 'cart' && (
                <span className="text-xs uppercase tracking-wider text-[#8E7766] ml-2">
                  ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={resetAndClose}
              className="p-1.5 text-[#6F5847] hover:text-[#34251F] focus:outline-none"
              aria-label="Close"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            
            {/* STEP 1: CART VIEW */}
            {step === 'cart' && (
              <>
                {cart.length === 0 ? (
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
              </>
            )}

            {/* STEP 2: CONCIERGE CHECKOUT FORM */}
            {step === 'checkout' && (
              <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
                {checkoutError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center space-x-2">
                    <AlertCircle size={15} />
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* Customer Details */}
                <div className="bg-white p-4 border border-[#E8E0D2] rounded-xs space-y-3">
                  <h3 className="text-xs uppercase tracking-widest font-semibold text-[#34251F] flex items-center space-x-2">
                    <User size={14} className="text-[#B49A62]" />
                    <span>Contact Details</span>
                  </h3>
                  <div>
                    <label className="block text-[11px] text-[#6F5847] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-[#6F5847] mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ananya@example.com"
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6F5847] mb-1">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F]"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white p-4 border border-[#E8E0D2] rounded-xs space-y-3">
                  <h3 className="text-xs uppercase tracking-widest font-semibold text-[#34251F] flex items-center space-x-2">
                    <MapPin size={14} className="text-[#B49A62]" />
                    <span>Delivery Address</span>
                  </h3>
                  <div>
                    <label className="block text-[11px] text-[#6F5847] mb-1">Address *</label>
                    <input
                      type="text"
                      required
                      value={formData.addressLine1}
                      onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                      placeholder="Flat, building, street, landmark"
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F]"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-[#6F5847] mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Mumbai"
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6F5847] mb-1">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="Maharashtra"
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6F5847] mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="400001"
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F]"
                      />
                    </div>
                  </div>
                </div>

                {/* Coupon Code Section */}
                <div className="bg-white p-4 border border-[#E8E0D2] rounded-xs">
                  <div className="flex items-center space-x-2 mb-2">
                    <Tag size={13} className="text-[#B49A62]" />
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#34251F]">
                      Have an Atelier Voucher?
                    </span>
                  </div>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 bg-[#FAF7F2] border border-[#D8C2A0] rounded-xs">
                      <div>
                        <span className="font-mono text-xs font-semibold text-[#34251F]">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-xs text-emerald-700 ml-2">
                          (-₹{appliedCoupon.discountAmount})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-xs text-[#A69483] hover:text-[#B9382B] uppercase tracking-wider font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Try AARKIS10 or ATELIER500"
                        className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#D8C2A0] text-xs uppercase tracking-wider text-[#281D18] rounded-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                        className="px-4 py-2 bg-[#34251F] text-[#FAF7F2] text-xs uppercase tracking-wider font-semibold rounded-xs"
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="mt-1.5 text-[11px] text-red-600">{couponError}</p>
                  )}
                </div>

                {/* Payment Selection */}
                <div className="bg-white p-4 border border-[#E8E0D2] rounded-xs space-y-2">
                  <h3 className="text-xs uppercase tracking-widest font-semibold text-[#34251F] flex items-center space-x-2">
                    <CreditCard size={14} className="text-[#B49A62]" />
                    <span>Payment Method</span>
                  </h3>
                  <label className="flex items-center space-x-3 p-2.5 border border-[#E8E0D2] rounded-xs cursor-pointer hover:bg-[#FAF7F2]">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                      className="accent-[#34251F]"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[#281D18]">Cash on Delivery / Concierge Pay</p>
                      <p className="text-[10px] text-[#8E7766]">Inspect at delivery & pay via cash or UPI.</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-2.5 border border-[#E8E0D2] rounded-xs cursor-pointer hover:bg-[#FAF7F2]">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="razorpay"
                      checked={formData.paymentMethod === 'razorpay'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'razorpay' })}
                      className="accent-[#34251F]"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[#281D18]">Razorpay / Online UPI & Cards</p>
                      <p className="text-[10px] text-[#8E7766]">Fast and encrypted checkout via Razorpay Gateway.</p>
                    </div>
                  </label>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS STATE */}
            {step === 'success' && placedOrder && (
              <div className="text-center py-10 px-2 animate-fade-in space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mx-auto flex items-center justify-center">
                  <Check size={32} />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#B49A62] font-semibold">
                    Order Registered
                  </span>
                  <h3 className="font-serif text-2xl text-[#281D18] font-medium mt-1">
                    Thank You, {placedOrder.customer?.fullName?.split(' ')[0]}
                  </h3>
                  <p className="font-mono text-xs font-semibold text-[#34251F] mt-1">
                    #{placedOrder.orderNumber}
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#E8E0D2] rounded-xs text-left text-xs space-y-2">
                  <div className="flex justify-between text-[#6F5847]">
                    <span>Payment Method:</span>
                    <strong className="uppercase text-[#281D18]">{placedOrder.paymentMethod}</strong>
                  </div>
                  <div className="flex justify-between text-[#6F5847]">
                    <span>Total Amount:</span>
                    <strong className="text-[#281D18]">₹{placedOrder.finalAmount?.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-[#6F5847]">
                    <span>Status:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-semibold uppercase">
                      {placedOrder.orderStatus}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#E8E0D2] text-[11px] text-[#7F6B5C]">
                    <span>Shipping to: </span>
                    <span className="text-[#34251F]">
                      {placedOrder.shippingAddress?.addressLine1}, {placedOrder.shippingAddress?.city} - {placedOrder.shippingAddress?.postalCode}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#6F5847] leading-relaxed max-w-xs mx-auto">
                  A confirmation dispatch and digital invoice has been sent to <strong>{placedOrder.customer?.email}</strong>.
                </p>

                <button
                  type="button"
                  onClick={resetAndClose}
                  className="w-full py-3 bg-[#34251F] text-[#FAF7F2] text-xs uppercase tracking-widest font-semibold rounded-xs"
                >
                  Return to Atelier
                </button>
              </div>
            )}

          </div>

          {/* Footer Subtotal & Actions */}
          {cart.length > 0 && step !== 'success' && (
            <div className="p-5 sm:p-6 bg-white border-t border-[#E8E0D2] shadow-lg">
              
              {/* Cost breakdown */}
              <div className="space-y-1.5 text-xs text-[#6F5847] mb-3">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span>₹{cartSubtotal.toLocaleString()}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Voucher ({appliedCoupon.code})</span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Concierge Shipping</span>
                  <span>{shippingCharge === 0 ? 'Complimentary' : `₹${shippingCharge}`}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#E8E0D2]">
                  <span className="text-xs uppercase tracking-widest font-semibold text-[#281D18]">
                    Estimated Total
                  </span>
                  <span className="font-serif text-2xl font-semibold text-[#281D18]">
                    ₹{finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {step === 'cart' ? (
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full py-3.5 bg-[#34251F] hover:bg-[#201511] text-[#FAF7F2] text-xs font-semibold uppercase tracking-[0.2em] rounded-xs flex items-center justify-center space-x-2 transition-colors shadow"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmittingOrder}
                  className="w-full py-3.5 bg-[#34251F] hover:bg-[#201511] text-[#FAF7F2] text-xs font-semibold uppercase tracking-[0.2em] rounded-xs flex items-center justify-center space-x-2 transition-colors shadow disabled:opacity-75"
                >
                  {isSubmittingOrder ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Securing Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Atelier Order</span>
                      <ShieldCheck size={15} />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
