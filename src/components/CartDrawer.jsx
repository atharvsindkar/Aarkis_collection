import React, { useState } from 'react';
import { 
  X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Check, Tag, ShieldCheck, 
  MapPin, User, CreditCard, ChevronLeft, AlertCircle, Loader2, Lock 
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
    showToast,
    customer,
    setIsAccountOpen,
    refreshCatalog,
    updateCartItemVariant,
    products,
  } = useShop();

  // steps: 'cart' | 'checkout' | 'success'
  const [step, setStep] = useState('cart');
  const [editingCartItemId, setEditingCartItemId] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Checkout form
  const [formData, setFormData] = useState({
    fullName: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    paymentMethod: 'cod' // 'cod' or 'razorpay'
  });
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  const applyAddress = (addr) => {
    const addrId = addr._id || addr.id;
    setSelectedAddressId(addrId);
    setFormData(prev => ({
      ...prev,
      fullName: addr.fullName || prev.fullName,
      phone: addr.phone || prev.phone,
      addressLine1: addr.addressLine1 + (addr.addressLine2 ? ', ' + addr.addressLine2 : ''),
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postalCode || ''
    }));
  };

  // Update form fields when customer signs in
  React.useEffect(() => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || customer.name || '',
        email: prev.email || customer.email || '',
        phone: prev.phone || customer.phone || ''
      }));

      if (customer.addresses && customer.addresses.length > 0 && !selectedAddressId) {
        const defaultAddr = customer.addresses.find(a => a.isDefault) || customer.addresses[0];
        if (defaultAddr) {
          applyAddress(defaultAddr);
        }
      }
    }
  }, [customer?.phone, customer?.email, customer?.addresses?.length]);

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
    if (!customer) {
      setCheckoutError('Please sign in with your mobile phone number before completing your order.');
      setIsAccountOpen(true);
      return;
    }

    if (!formData.fullName || !formData.email || !formData.phone || !formData.addressLine1 || !formData.city || !formData.postalCode) {
      setCheckoutError('Please complete all required shipping fields.');
      return;
    }

    const cleanPhone = formData.phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleanPhone.length < 10) {
      setCheckoutError('Please enter a valid phone number with at least 10 digits.');
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
        refreshCatalog(true);
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

                            {/* Shade & Size Specification with Inline Editor */}
                            {(() => {
                              const product = (products || []).find(
                                (p) => p.id === item.productId || p._id === item.productId || p.slug === item.productId
                              );
                              const isEditing = editingCartItemId === item.cartItemId;

                              return (
                                <div>
                                  <div className="mt-1 flex items-center justify-between text-xs text-[#7F6B5C]">
                                    <div className="flex items-center space-x-2">
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

                                    {product && (
                                      <button
                                        type="button"
                                        onClick={() => setEditingCartItemId(isEditing ? null : item.cartItemId)}
                                        className="text-[11px] text-[#B49A62] hover:text-[#34251F] underline font-medium"
                                      >
                                        {isEditing ? 'Done' : 'Edit'}
                                      </button>
                                    )}
                                  </div>

                                  {/* Interactive Inline Editor */}
                                  {isEditing && product && (
                                    <div className="my-2.5 p-2.5 bg-[#FAF7F2] border border-[#D8C2A0] rounded-xs space-y-2 text-xs animate-fade-in">
                                      {/* Color Variant Options */}
                                      {product.variants?.length > 1 && (
                                        <div>
                                          <span className="text-[10px] uppercase tracking-wider text-[#8E7766] font-medium block mb-1">
                                            Select Shade:
                                          </span>
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            {product.variants.map((v) => (
                                              <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => updateCartItemVariant(item.cartItemId, v, item.size)}
                                                className={`flex items-center space-x-1.5 px-2 py-1 rounded-xs border text-[11px] transition-all ${
                                                  item.colorId === v.id
                                                    ? 'bg-white border-[#34251F] font-semibold text-[#34251F] shadow-xs ring-1 ring-[#34251F]'
                                                    : 'bg-white/70 border-[#E8E0D2] text-[#6F5847] hover:border-[#B49A62]'
                                                }`}
                                              >
                                                <span
                                                  className="w-2 h-2 rounded-full border border-black/10"
                                                  style={{ backgroundColor: v.colorHex }}
                                                />
                                                <span>{v.name || v.colorName}</span>
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Size Options */}
                                      <div>
                                        <span className="text-[10px] uppercase tracking-wider text-[#8E7766] font-medium block mb-1">
                                          Select Size:
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          {(product.sizes || ['S', 'M', 'L', 'XL']).map((s) => {
                                            const activeV =
                                              product.variants?.find((v) => v.id === item.colorId) ||
                                              product.variants?.[0];
                                            const sKey =
                                              Object.keys(activeV?.inventory || {}).find(
                                                (k) => k.trim().toUpperCase() === s.trim().toUpperCase()
                                              ) || s;
                                            const stock =
                                              activeV?.inventory?.[sKey] !== undefined
                                                ? Number(activeV.inventory[sKey])
                                                : 10;
                                            const isSoldOut = stock <= 0;

                                            return (
                                              <button
                                                key={s}
                                                type="button"
                                                disabled={isSoldOut}
                                                onClick={() => updateCartItemVariant(item.cartItemId, activeV, s)}
                                                className={`px-2.5 py-1 text-xs uppercase font-medium rounded-xs border transition-colors ${
                                                  isSoldOut
                                                    ? 'bg-neutral-100 text-neutral-300 border-neutral-200 line-through cursor-not-allowed'
                                                    : item.size === s
                                                    ? 'bg-[#34251F] text-white border-[#34251F]'
                                                    : 'bg-white text-[#6F5847] border-[#E8E0D2] hover:border-[#B49A62]'
                                                }`}
                                              >
                                                {s}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            <p className="text-xs font-semibold text-[#34251F] mt-1.5">
                              {item.priceDisplay}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="pt-2">
                            <div className="flex items-center justify-between">
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
                                  disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                                  onClick={() => updateQuantity(item.cartItemId, 1)}
                                  className="p-1 px-2 text-[#6F5847] hover:bg-[#FAF7F2] disabled:opacity-30 disabled:cursor-not-allowed"
                                  aria-label="Increase quantity"
                                  title={item.maxStock !== undefined && item.quantity >= item.maxStock ? `Max available stock reached (${item.maxStock})` : 'Increase quantity'}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>

                              <span className="text-xs font-medium text-[#34251F]">
                                ₹{(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>

                            {item.maxStock !== undefined && item.quantity >= item.maxStock && (
                              <p className="text-[10px] text-amber-700 mt-1 font-medium">
                                Only {item.maxStock} available in atelier stock for size {item.size}
                              </p>
                            )}
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
                {!customer && (
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xs text-xs text-amber-900 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Lock size={14} className="text-[#B49A62] shrink-0" />
                      <span>Phone verification is mandatory to complete order.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAccountOpen(true)}
                      className="px-2.5 py-1 bg-[#34251F] text-white text-[10px] uppercase tracking-wider font-semibold rounded-xs ml-2"
                    >
                      Sign In Now
                    </button>
                  </div>
                )}

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
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-widest font-semibold text-[#34251F] flex items-center space-x-2">
                      <MapPin size={14} className="text-[#B49A62]" />
                      <span>Delivery Address</span>
                    </h3>
                    {customer?.addresses && customer.addresses.length > 0 && (
                      <span className="text-[10px] text-[#8E7766] uppercase tracking-wider font-medium">
                        {customer.addresses.length} saved
                      </span>
                    )}
                  </div>

                  {/* 1-Click Saved Addresses Picker */}
                  {customer?.addresses && customer.addresses.length > 0 && (
                    <div className="space-y-1.5 pb-2 border-b border-[#F0EAE1]">
                      <span className="text-[11px] text-[#6F5847] font-medium block">
                        Select from your saved addresses:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {customer.addresses.map((addr) => {
                          const addrId = addr._id || addr.id;
                          const isSelected = selectedAddressId === addrId;
                          return (
                            <button
                              key={addrId}
                              type="button"
                              onClick={() => applyAddress(addr)}
                              className={`text-left p-2.5 rounded-xs border text-xs transition-all ${
                                isSelected
                                  ? 'border-[#34251F] bg-[#FAF7F2] ring-1 ring-[#34251F]'
                                  : 'border-[#E8E0D2] bg-white hover:border-[#D8C2A0]'
                              }`}
                            >
                              <div className="flex items-center justify-between font-semibold text-[#281D18] mb-0.5">
                                <span className="flex items-center space-x-1">
                                  <span>{addr.label || 'Home'}</span>
                                  {addr.isDefault && (
                                    <span className="text-[9px] bg-stone-100 text-stone-600 px-1 py-0.2 rounded-xs font-normal">
                                      Default
                                    </span>
                                  )}
                                </span>
                                {isSelected && <Check size={12} className="text-[#34251F]" />}
                              </div>
                              <p className="text-[11px] text-[#6F5847] truncate">
                                {addr.addressLine1}
                              </p>
                              <p className="text-[10px] text-[#8E7766]">
                                {addr.city}, {addr.postalCode}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] text-[#6F5847] mb-1">Address *</label>
                    <input
                      type="text"
                      required
                      value={formData.addressLine1}
                      onChange={(e) => {
                        setSelectedAddressId(null);
                        setFormData({ ...formData, addressLine1: e.target.value });
                      }}
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
                !customer ? (
                  <div className="space-y-2">
                    <div className="p-2.5 bg-[#FAF7F2] border border-[#D8C2A0] rounded-xs flex items-center space-x-2 text-[11px] text-[#6F5847]">
                      <Lock size={13} className="text-[#B49A62] shrink-0" />
                      <span>Phone authentication is required to complete your order.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAccountOpen(true)}
                      className="w-full py-3.5 bg-[#34251F] hover:bg-[#201511] text-[#FAF7F2] text-xs font-semibold uppercase tracking-[0.2em] rounded-xs flex items-center justify-center space-x-2 transition-colors shadow"
                    >
                      <User size={15} />
                      <span>Sign In with Phone to Order</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep('checkout')}
                    className="w-full py-3.5 bg-[#34251F] hover:bg-[#201511] text-[#FAF7F2] text-xs font-semibold uppercase tracking-[0.2em] rounded-xs flex items-center justify-center space-x-2 transition-colors shadow"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={15} />
                  </button>
                )
              ) : !customer ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsAccountOpen(true)}
                    className="w-full py-3.5 bg-[#34251F] hover:bg-[#201511] text-[#FAF7F2] text-xs font-semibold uppercase tracking-[0.2em] rounded-xs flex items-center justify-center space-x-2 transition-colors shadow"
                  >
                    <Lock size={15} />
                    <span>Sign In with Phone to Complete Order</span>
                  </button>
                </div>
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
