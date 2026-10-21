import React, { useState, useEffect } from 'react';
import { 
  X, Phone, Mail, ShieldCheck, ArrowRight, Loader2, Sparkles, User, 
  Lock, CheckCircle2, AlertCircle, ShoppingBag, LogOut, Package, 
  Truck, Calendar, ChevronRight, ExternalLink, RefreshCw,
  MapPin, Plus, Trash2, Edit2, Check
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function CustomerAccountModal() {
  const { isAccountOpen, setIsAccountOpen, customer, setCustomer, showToast, setActiveCategoryFilter } = useShop();

  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [authMethod, setAuthMethod] = useState('phone'); // 'phone' | 'email'
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'addresses' | 'profile'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Order History state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  // Address Management state
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false
  });

  const fetchCustomerOrders = async (phoneToQuery, emailToQuery) => {
    const qPhone = phoneToQuery || customer?.phone;
    const qEmail = emailToQuery || customer?.email;
    if (!qPhone && !qEmail) return;

    try {
      setLoadingOrders(true);
      setOrdersError('');
      const params = new URLSearchParams();
      if (qPhone) params.append('phone', qPhone);
      if (qEmail) params.append('email', qEmail);

      const res = await fetch(`/api/orders/my-orders?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        setOrdersError(data.message || 'Unable to retrieve order history');
      }
    } catch (err) {
      setOrdersError('Failed to fetch orders. Please check your internet connection.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchCustomerAddresses = async () => {
    const token = localStorage.getItem('aarkis_customer_token');
    if (!token) {
      if (customer?.addresses) setAddresses(customer.addresses);
      return;
    }
    try {
      setLoadingAddresses(true);
      const res = await fetch('/api/customer/auth/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.addresses || []);
        setCustomer(prev => {
          if (!prev) return prev;
          return { ...prev, addresses: data.addresses };
        });
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // On mount / open: if token exists, fetch current patron profile into memory (preventing PII in localStorage)
  useEffect(() => {
    const token = localStorage.getItem('aarkis_customer_token');
    if (token && (!customer || !customer.phone)) {
      fetch('/api/customer/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.customer) {
          setCustomer(d.customer);
          setAddresses(d.customer.addresses || []);
        }
      })
      .catch(() => {});
    }
  }, [isAccountOpen]);

  const customerPhone = customer?.phone;
  const customerEmail = customer?.email;

  useEffect(() => {
    if (isAccountOpen && customerPhone) {
      fetchCustomerOrders(customerPhone, customerEmail);
      fetchCustomerAddresses();
    }
  }, [isAccountOpen, customerPhone]);

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      label: 'Home',
      fullName: customer?.name || '',
      phone: customer?.phone || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: addresses.length === 0
    });
    setAddressFormOpen(true);
  };

  const handleOpenEditAddress = (addr) => {
    setEditingAddressId(addr._id || addr.id);
    setAddressForm({
      label: addr.label || 'Home',
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postalCode || '',
      country: addr.country || 'India',
      isDefault: !!addr.isDefault
    });
    setAddressFormOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('aarkis_customer_token');
    if (!token) {
      setError('Please sign in to save addresses.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const url = editingAddressId
        ? `/api/customer/auth/addresses/${editingAddressId}`
        : '/api/customer/auth/addresses';
      const method = editingAddressId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addressForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.addresses || []);
        if (customer) {
          const updated = { ...customer, addresses: data.addresses };
          setCustomer(updated);
        }
        setAddressFormOpen(false);
        setEditingAddressId(null);
        showToast(editingAddressId ? 'Address updated' : 'Address added to your account');
      } else {
        setError(data.message || 'Failed to save address');
      }
    } catch (err) {
      setError('Network error saving address');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addrId) => {
    const token = localStorage.getItem('aarkis_customer_token');
    if (!token) return;
    try {
      const res = await fetch(`/api/customer/auth/addresses/${addrId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.addresses || []);
        if (customer) {
          const updated = { ...customer, addresses: data.addresses };
          setCustomer(updated);
        }
        showToast('Address removed');
      }
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  const handleSetDefaultAddress = async (addrId) => {
    const token = localStorage.getItem('aarkis_customer_token');
    if (!token) return;
    try {
      const res = await fetch(`/api/customer/auth/addresses/${addrId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isDefault: true })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.addresses || []);
        if (customer) {
          const updated = { ...customer, addresses: data.addresses };
          setCustomer(updated);
        }
        showToast('Default delivery address updated');
      }
    } catch (err) {
      console.error('Failed to set default address:', err);
    }
  };

  if (!isAccountOpen) return null;

  const handleClose = () => {
    setIsAccountOpen(false);
    setError('');
    setDevOtpHint('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setDevOtpHint('');

    setLoading(true);
    try {
      if (authMethod === 'email') {
        const cleanedEmail = email.toLowerCase().trim();
        if (!cleanedEmail || !cleanedEmail.includes('@')) {
          setError('Please provide a valid email address.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/customer/auth/send-email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanedEmail })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setStep('otp');
          showToast(`Passcode dispatched to ${cleanedEmail}`);
        } else {
          setError(data.message || 'Failed to dispatch email verification code.');
        }
      } else {
        const cleaned = phone.replace(/[\s\-\(\)]/g, '');
        if (!cleaned || cleaned.replace(/\+/g, '').length < 10) {
          setError('A valid phone number with at least 10 digits is strictly required.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/customer/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleaned })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setStep('otp');
          if (data.devOtp) {
            setDevOtpHint(`Development OTP: ${data.devOtp}`);
          }
          showToast('OTP sent to your phone');
        } else {
          setError(data.message || 'Failed to send OTP. Please try again.');
        }
      }
    } catch (err) {
      setError('Network failure connecting to atelier authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      let res, data;
      if (authMethod === 'email') {
        const cleanedEmail = email.toLowerCase().trim();
        res = await fetch('/api/customer/auth/verify-email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanedEmail,
            otp: otp.trim(),
            fullName: fullName.trim() || undefined
          })
        });
        data = await res.json();

        if (res.ok && data.success) {
          localStorage.setItem('aarkis_customer_token', data.token);
          localStorage.setItem('aarkis_customer_user', JSON.stringify({ name: data.customer.name }));
          setCustomer(data.customer);
          showToast(`Welcome, ${data.customer.name || 'Patron'}!`);
          fetchCustomerOrders(undefined, cleanedEmail);
          setStep('phone');
        } else {
          setError(data.message || 'Invalid or expired verification code.');
        }
      } else {
        const cleaned = phone.replace(/[\s\-\(\)]/g, '');
        res = await fetch('/api/customer/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleaned,
            otp: otp.trim(),
            fullName: fullName.trim() || undefined
          })
        });
        data = await res.json();

        if (res.ok && data.success) {
          localStorage.setItem('aarkis_customer_token', data.token);
          localStorage.setItem('aarkis_customer_user', JSON.stringify({ name: data.customer.name }));
          setCustomer(data.customer);
          showToast(`Welcome, ${data.customer.name || 'Patron'}!`);
          fetchCustomerOrders(cleaned, data.customer.email);
          setStep('phone');
        } else {
          setError(data.message || 'Invalid or expired OTP code.');
        }
      }
    } catch (err) {
      setError('Verification failed due to network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('aarkis_customer_token');
    if (!token) return;
    setDeletingAccount(true);
    try {
      const res = await fetch('/api/customer/auth/delete-account', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.removeItem('aarkis_customer_token');
        localStorage.removeItem('aarkis_customer_user');
        setCustomer(null);
        setOrders([]);
        setAddresses([]);
        setShowDeleteConfirm(false);
        showToast('Your personal account and data have been permanently erased.');
        setIsAccountOpen(false);
      } else {
        showToast(data.message || 'Failed to delete account');
      }
    } catch (err) {
      showToast('Network error during account erasure request');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aarkis_customer_token');
    localStorage.removeItem('aarkis_customer_user');
    setCustomer(null);
    setOrders([]);
    setStep('phone');
    setPhone('');
    setOtp('');
    showToast('Signed out of your customer account');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'shipped':
        return 'bg-sky-50 text-sky-700 border-sky-300';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      case 'confirmed':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#221612]/70 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      <div className={`relative w-full ${customer ? 'max-w-2xl' : 'max-w-md'} bg-[#FAF7F2] border border-[#D8C2A0] rounded-xs shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] animate-fade-in`}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-[#6F5847] hover:text-[#281D18] focus:outline-none z-20"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-[#E8E0D2] bg-white text-center">
          <div className="w-11 h-11 rounded-full bg-[#FAF7F2] border border-[#D8C2A0] flex items-center justify-center mx-auto mb-2.5 shadow-xs">
            <Sparkles size={18} className="text-[#34251F]" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#B49A62] font-semibold">
            Aarkis Atelier
          </span>
          <h2 className="font-serif text-2xl text-[#281D18] font-normal mt-0.5">
            {customer ? 'Patron Wardrobe & Orders' : 'Sign In with Phone'}
          </h2>
          <p className="text-xs text-[#7F6B5C] font-light mt-1">
            {customer 
              ? `Logged in as ${customer.name || 'Verified Patron'} (${customer.phone})`
              : 'Passwordless login with verified phone number & SMS OTP'
            }
          </p>

          {/* Patron Nav Tabs when signed in */}
          {customer && (
            <div className="flex border-b border-[#E8E0D2] mt-6 -mb-6 -mx-6 sm:-mx-7 bg-[#FAF7F2]">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-2 border-b-2 transition-colors ${
                  activeTab === 'orders'
                    ? 'border-[#34251F] text-[#34251F] bg-white'
                    : 'border-transparent text-[#7F6B5C] hover:text-[#34251F]'
                }`}
              >
                <Package size={14} />
                <span>My Orders ({orders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('addresses');
                  setAddressFormOpen(false);
                }}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-2 border-b-2 transition-colors ${
                  activeTab === 'addresses'
                    ? 'border-[#34251F] text-[#34251F] bg-white'
                    : 'border-transparent text-[#7F6B5C] hover:text-[#34251F]'
                }`}
              >
                <MapPin size={14} />
                <span>Addresses ({addresses.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-2 border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-[#34251F] text-[#34251F] bg-white'
                    : 'border-transparent text-[#7F6B5C] hover:text-[#34251F]'
                }`}
              >
                <User size={14} />
                <span>Profile</span>
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center space-x-2">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {devOtpHint && (
            <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-xs font-mono text-center">
              {devOtpHint}
            </div>
          )}

          {/* SIGNED IN VIEW */}
          {customer ? (
            activeTab === 'orders' ? (
              /* TAB 1: ORDER HISTORY */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#6F5847] font-semibold">
                    Your Tailored Orders
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchCustomerOrders()}
                    disabled={loadingOrders}
                    className="text-xs text-[#B49A62] hover:text-[#34251F] flex items-center space-x-1"
                  >
                    <RefreshCw size={12} className={loadingOrders ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingOrders ? (
                  <div className="py-12 text-center text-xs text-[#7F6B5C] space-y-2">
                    <Loader2 size={22} className="animate-spin mx-auto text-[#B49A62]" />
                    <p>Loading your orders...</p>
                  </div>
                ) : ordersError ? (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs">
                    {ordersError}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-8 bg-white border border-[#E8E0D2] rounded-xs text-center space-y-3">
                    <Package size={32} className="mx-auto text-[#B49A62]/60" />
                    <h3 className="font-serif text-lg text-[#281D18]">No Orders Placed Yet</h3>
                    <p className="text-xs text-[#7F6B5C] max-w-sm mx-auto">
                      Explore our collections of tailored silhouettes and brocades to place your first bespoke atelier order.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        const elem = document.getElementById('collection');
                        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#34251F] text-[#FAF7F2] text-xs uppercase tracking-widest font-semibold rounded-xs hover:bg-[#201511]"
                    >
                      <span>Explore Collection</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order._id}
                        className="bg-white border border-[#E8E0D2] rounded-xs p-4 sm:p-5 space-y-3 shadow-xs hover:border-[#D8C2A0] transition-colors"
                      >
                        {/* Order Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F0EAE1]">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-[#8E7766] font-medium">Order Number</span>
                            <div className="font-mono text-sm font-semibold text-[#281D18]">#{order.orderNumber}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase tracking-wider text-[#8E7766] font-medium">Date Placed</span>
                            <div className="text-xs text-[#281D18] flex items-center space-x-1">
                              <Calendar size={11} className="text-[#B49A62]" />
                              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-semibold border ${getStatusBadge(order.orderStatus)}`}>
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="space-y-2">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-1">
                              <div className="flex items-center space-x-3">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-10 h-12 object-cover object-top rounded-xs border border-[#E8E0D2]"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-[#281D18]">{item.name}</p>
                                  <p className="text-[11px] text-[#7F6B5C]">
                                    Shade: {item.colorName || 'Bespoke'} | Size: {item.size} | Qty: {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <span className="font-semibold text-[#281D18]">
                                ₹{(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Confirmation Details if Confirmed */}
                        {order.orderStatus === 'confirmed' && (
                          <div className="p-3 bg-amber-50/80 border border-amber-300/70 rounded-xs text-xs space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-1 text-amber-950 font-semibold text-[11px]">
                              <span className="flex items-center space-x-1.5">
                                <Sparkles size={13} className="text-[#B49A62]" />
                                <span>Order Confirmed & Tailoring in Progress</span>
                              </span>
                              {order.confirmation?.expectedShippingDateFormatted && (
                                <span className="text-amber-900 font-normal">
                                  Expected Dispatch: <strong className="font-semibold">{order.confirmation.expectedShippingDateFormatted}</strong>
                                </span>
                              )}
                            </div>
                            {order.confirmation?.adminNote && (
                              <p className="text-[11px] text-amber-900/90 italic pt-0.5">
                                Note from Atelier: "{order.confirmation.adminNote}"
                              </p>
                            )}
                          </div>
                        )}

                        {/* Order Delivered Banner if Delivered */}
                        {order.orderStatus === 'delivered' && (
                          <div className="p-3 bg-emerald-50/90 border border-emerald-300 rounded-xs text-xs space-y-1">
                            <div className="flex items-center justify-between text-emerald-950 font-semibold text-[11px]">
                              <span className="flex items-center space-x-1.5">
                                <CheckCircle2 size={13} className="text-emerald-700" />
                                <span>Delivery Completed</span>
                              </span>
                              {order.deliveredAt && (
                                <span className="text-emerald-800 font-normal">
                                  Delivered: {new Date(order.deliveredAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-emerald-900 pt-0.5">
                              Your creation from Aarkis Collection has been safely delivered to your doorstep. We hope you cherish your atelier garment.
                            </p>
                          </div>
                        )}

                        {/* Shipment Info if dispatched */}
                        {order.shipment?.trackingNumber && (
                          <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xs text-xs space-y-1">
                            <div className="flex items-center justify-between text-sky-900 font-semibold text-[11px]">
                              <span className="flex items-center space-x-1">
                                <Truck size={13} />
                                <span>Dispatched via {order.shipment.courierName || 'BlueDart'}</span>
                              </span>
                              {order.shipment.trackingUrl && (
                                <a
                                  href={order.shipment.trackingUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sky-700 underline text-[11px] flex items-center space-x-1"
                                >
                                  <span>Track Package</span>
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                            <p className="font-mono text-[11px] text-sky-800">
                              Waybill / Tracking: {order.shipment.trackingNumber}
                            </p>
                          </div>
                        )}

                        {/* Order Cancellation Note if Cancelled */}
                        {order.orderStatus === 'cancelled' && (
                          <div className="p-3 bg-rose-50/90 border border-rose-300 rounded-xs text-xs space-y-1">
                            <div className="flex items-center justify-between text-rose-900 font-semibold text-[11px]">
                              <span className="flex items-center space-x-1.5">
                                <AlertCircle size={13} className="text-rose-600" />
                                <span>Order Cancelled</span>
                              </span>
                              {order.cancellation?.cancelledAt && (
                                <span className="text-rose-700 font-normal">
                                  {new Date(order.cancellation.cancelledAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {order.cancellation?.reason && (
                              <p className="text-[11px] text-rose-800 font-medium pt-0.5">
                                Reason: <span className="font-normal">{order.cancellation.reason}</span>
                              </p>
                            )}
                            {order.cancellation?.notes && (
                              <p className="text-[11px] text-rose-800/90 italic">
                                Note from Atelier: "{order.cancellation.notes}"
                              </p>
                            )}
                          </div>
                        )}

                        {/* Dedicated Customer Refund Status Banner */}
                        {(order.refundDetails?.status || order.paymentStatus === 'refund_pending' || order.paymentStatus === 'refunded') && (
                          <div className={`p-3 rounded-xs text-xs space-y-1 border ${
                            order.paymentStatus === 'refunded' || order.refundDetails?.status === 'processed'
                              ? 'bg-purple-50/90 border-purple-300 text-purple-950'
                              : 'bg-amber-50/90 border-amber-300 text-amber-950'
                          }`}>
                            <div className="flex items-center justify-between font-semibold text-[11px]">
                              <span className="flex items-center space-x-1.5">
                                <RefreshCw size={12} className={order.paymentStatus === 'refunded' ? 'text-purple-700' : 'text-amber-700'} />
                                <span>
                                  {order.paymentStatus === 'refunded' || order.refundDetails?.status === 'processed'
                                    ? 'Refund Completed'
                                    : 'Refund Pending'}
                                </span>
                              </span>
                              <span className="font-bold">
                                ₹{(order.refundDetails?.amount || order.finalAmount || 0).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[11px] opacity-90 leading-relaxed">
                              {order.paymentStatus === 'refunded' || order.refundDetails?.status === 'processed'
                                ? `Refund of ₹${(order.refundDetails?.amount || order.finalAmount || 0).toLocaleString()} has been settled to your original payment source.${order.refundDetails?.referenceNote ? ` (Ref: ${order.refundDetails.referenceNote})` : ''}`
                                : 'Your refund has been initiated by atelier accounts and will be returned to your original payment method shortly.'}
                            </p>
                          </div>
                        )}

                        {/* Total Footer */}
                        <div className="pt-2 border-t border-[#F0EAE1] flex justify-between items-center text-xs">
                          <span className="text-[#6F5847]">
                            Payment: <strong className="uppercase">{order.paymentMethod}</strong> ({order.paymentStatus})
                          </span>
                          <span className="text-sm font-semibold text-[#281D18]">
                            Total: ₹{order.finalAmount?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'addresses' ? (
              /* TAB 2: SAVED ADDRESSES */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-[#6F5847] font-semibold">
                      Saved Delivery Addresses
                    </h3>
                    <p className="text-[11px] text-[#8E7766]">
                      Manage addresses for swift 1-click checkout
                    </p>
                  </div>
                  {!addressFormOpen && (
                    <button
                      type="button"
                      onClick={handleOpenAddAddress}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#34251F] text-[#FAF7F2] text-xs uppercase tracking-wider font-semibold rounded-xs hover:bg-[#201511] transition-colors"
                    >
                      <Plus size={13} />
                      <span>Add Address</span>
                    </button>
                  )}
                </div>

                {/* Address Form (Add / Edit) */}
                {addressFormOpen ? (
                  <form onSubmit={handleSaveAddress} className="bg-white border border-[#D8C2A0] rounded-xs p-4 sm:p-5 space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE1]">
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-[#281D18]">
                        {editingAddressId ? 'Edit Delivery Address' : 'Add New Address'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setAddressFormOpen(false);
                          setEditingAddressId(null);
                        }}
                        className="text-xs text-[#8E7766] hover:text-[#34251F]"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Address Label Presets */}
                    <div>
                      <label className="block text-[11px] text-[#6F5847] mb-1 font-medium">Address Type / Label</label>
                      <div className="flex gap-2">
                        {['Home', 'Office', 'Studio', 'Other'].map(lbl => (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                            className={`px-3 py-1 text-xs rounded-xs border transition-colors ${
                              addressForm.label === lbl
                                ? 'bg-[#34251F] text-white border-[#34251F]'
                                : 'bg-[#FAF7F2] text-[#6F5847] border-[#E8E0D2] hover:border-[#B49A62]'
                            }`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#6F5847] mb-1 font-medium">Recipient Name *</label>
                        <input
                          type="text"
                          required
                          value={addressForm.fullName}
                          onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                          placeholder="Full Name"
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#6F5847] mb-1 font-medium">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#6F5847] mb-1 font-medium">Flat / House No. / Building / Street *</label>
                      <input
                        type="text"
                        required
                        value={addressForm.addressLine1}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                        placeholder="e.g. 402, Royal Palms, Altamount Road"
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#6F5847] mb-1 font-medium">Landmark / Locality (Optional)</label>
                      <input
                        type="text"
                        value={addressForm.addressLine2}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                        placeholder="Near Grand Hyatt"
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-[#6F5847] mb-1 font-medium">City *</label>
                        <input
                          type="text"
                          required
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          placeholder="Mumbai"
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#6F5847] mb-1 font-medium">State *</label>
                        <input
                          type="text"
                          required
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          placeholder="Maharashtra"
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#6F5847] mb-1 font-medium">PIN Code *</label>
                        <input
                          type="text"
                          required
                          value={addressForm.postalCode}
                          onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                          placeholder="400026"
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="checkbox"
                        id="isDefaultAddr"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                        className="rounded-xs border-[#D8C2A0] text-[#34251F] focus:ring-0"
                      />
                      <label htmlFor="isDefaultAddr" className="text-xs text-[#34251F] cursor-pointer">
                        Set as primary default address for orders
                      </label>
                    </div>

                    <div className="pt-2 flex items-center justify-end space-x-2 border-t border-[#F0EAE1]">
                      <button
                        type="button"
                        onClick={() => {
                          setAddressFormOpen(false);
                          setEditingAddressId(null);
                        }}
                        className="px-4 py-2 text-xs text-[#6F5847] hover:text-[#281D18]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2 bg-[#34251F] hover:bg-[#201511] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider rounded-xs flex items-center space-x-1.5 transition-colors"
                      >
                        {loading && <Loader2 size={13} className="animate-spin" />}
                        <span>{editingAddressId ? 'Update Address' : 'Save Address'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Address Cards List */
                  addresses.length === 0 ? (
                    <div className="p-8 bg-white border border-[#E8E0D2] rounded-xs text-center space-y-3">
                      <MapPin size={32} className="mx-auto text-[#B49A62]/60" />
                      <h4 className="font-serif text-lg text-[#281D18]">No Addresses Saved</h4>
                      <p className="text-xs text-[#7F6B5C] max-w-sm mx-auto">
                        Save your home or studio delivery address once and enjoy one-tap checkout on all future orders.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenAddAddress}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#34251F] text-[#FAF7F2] text-xs uppercase tracking-widest font-semibold rounded-xs hover:bg-[#201511]"
                      >
                        <Plus size={13} />
                        <span>Add Delivery Address</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((addr) => {
                        const addrId = addr._id || addr.id;
                        return (
                          <div
                            key={addrId}
                            className={`p-4 bg-white border rounded-xs transition-colors ${
                              addr.isDefault
                                ? 'border-[#34251F] shadow-xs'
                                : 'border-[#E8E0D2] hover:border-[#D8C2A0]'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE1]">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 bg-[#FAF7F2] text-[#34251F] border border-[#D8C2A0] text-[10px] uppercase font-semibold rounded-xs">
                                  {addr.label || 'Home'}
                                </span>
                                {addr.isDefault && (
                                  <span className="px-2 py-0.5 bg-[#2E6B4E]/10 text-[#2E6B4E] border border-[#2E6B4E]/30 text-[10px] uppercase font-semibold rounded-xs flex items-center space-x-1">
                                    <Check size={10} />
                                    <span>Default Address</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-2">
                                {!addr.isDefault && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetDefaultAddress(addrId)}
                                    className="text-[11px] text-[#B49A62] hover:text-[#34251F] underline font-medium"
                                  >
                                    Set Default
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditAddress(addr)}
                                  className="p-1 text-[#6F5847] hover:text-[#281D18] transition-colors"
                                  title="Edit address"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAddress(addrId)}
                                  className="p-1 text-[#A69483] hover:text-rose-600 transition-colors"
                                  title="Delete address"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            <div className="pt-2 text-xs space-y-0.5 text-[#6F5847]">
                              <p className="font-semibold text-[#281D18]">{addr.fullName}</p>
                              <p>{addr.addressLine1}</p>
                              {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                              <p>
                                {addr.city}, {addr.state} - <span className="font-mono">{addr.postalCode}</span>
                              </p>
                              <p className="text-[11px] text-[#8E7766] pt-1">
                                Mobile: <span className="font-mono">{addr.phone}</span>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            ) : (
              /* TAB 2: PROFILE DETAILS */
              <div className="space-y-4">
                <div className="p-4 bg-white border border-[#E8E0D2] rounded-xs space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE1]">
                    <span className="text-[11px] uppercase tracking-wider text-[#B49A62] font-semibold">Verified Profile</span>
                    <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                      <CheckCircle2 size={13} />
                      <span>Phone Authenticated</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#8E7766]">Full Name</span>
                    <p className="font-medium text-[#281D18] text-sm">{customer.name || 'Aarkis Patron'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#8E7766]">Mobile Phone</span>
                    <p className="font-mono text-[#281D18]">{customer.phone}</p>
                  </div>
                  {customer.email && (
                    <div>
                      <span className="text-[10px] uppercase text-[#8E7766]">Registered Email</span>
                      <p className="text-[#281D18]">{customer.email}</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white border border-[#E8E0D2] rounded-xs text-xs space-y-1.5 text-[#6F5847]">
                  <h4 className="text-[11px] uppercase tracking-wider font-semibold text-[#34251F] flex items-center space-x-1.5">
                    <ShieldCheck size={14} className="text-[#B49A62]" />
                    <span>Patron Privacy & Security</span>
                  </h4>
                  <p>
                    Your telephone number is verified using one-time passcode verification. Orders placed under this phone number are securely synchronized to your private wardrobe account.
                  </p>
                </div>

                <div className="pt-2 flex flex-col space-y-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2.5 text-xs uppercase tracking-wider text-[#6F5847] hover:text-[#281D18] border border-[#E8E0D2] rounded-xs flex items-center justify-center space-x-1.5 transition-colors bg-white hover:bg-[#F9F6F0]"
                  >
                    <LogOut size={14} />
                    <span>Sign Out of Account</span>
                  </button>

                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full py-2.5 text-xs uppercase tracking-wider text-rose-700 hover:text-rose-900 border border-rose-200 rounded-xs flex items-center justify-center space-x-1.5 transition-colors bg-white hover:bg-rose-50"
                    >
                      <Trash2 size={14} />
                      <span>Delete Account & Erase Personal Data</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xs space-y-2 text-xs">
                      <p className="text-rose-900 font-medium text-[11px] leading-relaxed">
                        Are you sure? This will permanently erase your profile, saved addresses, and anonymize all historical order records under your phone number. This action cannot be undone.
                      </p>
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          type="button"
                          disabled={deletingAccount}
                          onClick={handleDeleteAccount}
                          className="flex-1 py-2 bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-semibold uppercase tracking-wider rounded-xs flex items-center justify-center space-x-1 transition-colors"
                        >
                          {deletingAccount ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          <span>Confirm Erasure</span>
                        </button>
                        <button
                          type="button"
                          disabled={deletingAccount}
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-3 py-2 bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 text-[11px] uppercase tracking-wider rounded-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            /* SIGN-IN FORM: STEP 1 (INPUT) OR STEP 2 (OTP) */
            step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                {/* Method Switcher */}
                <div className="flex border border-[#E8E0D2] rounded-xs p-0.5 bg-[#FAF7F2]">
                  <button
                    type="button"
                    onClick={() => { setAuthMethod('email'); setError(''); }}
                    className={`flex-1 py-1.5 text-[11px] font-medium tracking-wider uppercase rounded-xs transition-all flex items-center justify-center space-x-1.5 ${
                      authMethod === 'email'
                        ? 'bg-white text-[#281D18] shadow-xs font-semibold'
                        : 'text-[#8E7766] hover:text-[#281D18]'
                    }`}
                  >
                    <Mail size={13} className={authMethod === 'email' ? 'text-[#B49A62]' : ''} />
                    <span>Email Passcode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMethod('phone'); setError(''); }}
                    className={`flex-1 py-1.5 text-[11px] font-medium tracking-wider uppercase rounded-xs transition-all flex items-center justify-center space-x-1.5 ${
                      authMethod === 'phone'
                        ? 'bg-white text-[#281D18] shadow-xs font-semibold'
                        : 'text-[#8E7766] hover:text-[#281D18]'
                    }`}
                  >
                    <Phone size={13} className={authMethod === 'phone' ? 'text-[#B49A62]' : ''} />
                    <span>Mobile SMS</span>
                  </button>
                </div>

                {authMethod === 'email' ? (
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#6F5847] mb-1 font-medium">
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="patron@domain.com"
                        className="w-full px-4 py-3 bg-white border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F] pl-10"
                      />
                      <Mail size={15} className="absolute left-3.5 top-3.5 text-[#B49A62]" />
                    </div>
                    <p className="text-[10px] text-[#8E7766] mt-1">
                      Enter your email to receive an instant 6-digit access code.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#6F5847] mb-1 font-medium">
                      Mobile Phone Number *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 bg-white border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F] pl-10"
                      />
                      <Phone size={15} className="absolute left-3.5 top-3.5 text-[#B49A62]" />
                    </div>
                    <p className="text-[10px] text-[#8E7766] mt-1">
                      Enter your mobile number to receive a 6-digit OTP passcode.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#6F5847] mb-1 font-medium">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full px-4 py-3 bg-white border border-[#D8C2A0] text-xs text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#34251F] hover:bg-[#201511] text-[#FAF7F2] text-xs font-semibold uppercase tracking-[0.2em] rounded-xs flex items-center justify-center space-x-2 transition-colors shadow-md disabled:opacity-75"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Dispatching Passcode...</span>
                    </>
                  ) : (
                    <>
                      <span>Request Verification Code</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* STEP 2: ENTER OTP */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 bg-white border border-[#E8E0D2] rounded-xs text-xs text-[#6F5847] text-center">
                  <span>Enter the 6-digit verification code sent to </span>
                  <strong className="text-[#281D18] font-mono">{authMethod === 'email' ? email : phone}</strong>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#6F5847] mb-1 font-medium text-center">
                    6-Digit Passcode *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3 bg-white border border-[#D8C2A0] text-center font-mono text-lg tracking-[0.3em] font-semibold text-[#281D18] rounded-xs focus:outline-none focus:border-[#34251F]"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setOtp(''); }}
                    className="px-4 py-3 bg-white border border-[#D8C2A0] text-xs uppercase tracking-wider text-[#6F5847] rounded-xs hover:bg-[#FAF7F2]"
                  >
                    Change {authMethod === 'email' ? 'Email' : 'Phone'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-[#34251F] hover:bg-[#201511] text-[#FAF7F2] text-xs font-semibold uppercase tracking-[0.2em] rounded-xs flex items-center justify-center space-x-2 transition-colors shadow-md disabled:opacity-75"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Enter</span>
                        <ShieldCheck size={15} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
}
