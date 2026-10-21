import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Calendar, Percent, AlertCircle, Check, Loader2, Power } from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminTheme } from './AdminThemeContext';

export default function AdminCoupons() {
  const { authFetch } = useAdminAuth();
  const { isDark } = useAdminTheme();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' | 'fixed'
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/coupons/admin/all');
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      setError('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      setError('Discount value must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountType,
          discountValue: val,
          minOrderAmount: parseFloat(minOrderAmount) || 0,
          maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
          usageLimit: usageLimit ? parseInt(usageLimit) : null,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(`Coupon "${code.toUpperCase()}" registered successfully!`);
        setCode('');
        setDiscountValue('');
        setMaxDiscountAmount('');
        setUsageLimit('');
        setExpiryDate('');
        fetchCoupons();
      } else {
        setError(data.message || 'Failed to create coupon');
      }
    } catch (err) {
      setError('Network failure creating coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (couponId, couponCode) => {
    if (!window.confirm(`Delete coupon "${couponCode}" permanently?`)) return;

    try {
      const res = await authFetch(`/api/coupons/${couponId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Coupon "${couponCode}" deleted.`);
        fetchCoupons();
      } else {
        alert(data.message || 'Failed to delete coupon');
      }
    } catch (err) {
      alert('Delete request failed.');
    }
  };

  const handleToggleCoupon = async (couponId) => {
    try {
      const res = await authFetch(`/api/coupons/${couponId}/toggle`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchCoupons();
      }
    } catch (err) {
      alert('Failed to toggle coupon status');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className={`pb-6 border-b ${isDark ? 'border-[#342922]' : 'border-[#E8E0D2]'}`}>
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#B49A62] font-semibold">
          Promotions & Privileges
        </span>
        <h2 className={`font-serif text-2xl sm:text-3xl font-normal ${
          isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'
        }`}>
          Vouchers & Discount Rules
        </h2>
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 text-xs rounded-xs flex items-center space-x-2">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs rounded-xs flex items-center space-x-2">
          <Check size={15} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Coupon */}
        <div className={`border p-6 rounded-xs shadow-lg space-y-4 h-fit ${
          isDark ? 'bg-[#221B17] border-[#3E322A]' : 'bg-white border-[#E8E0D2]'
        }`}>
          <h3 className={`font-serif text-lg font-medium flex items-center space-x-2 ${
            isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'
          }`}>
            <Tag size={16} className="text-[#B49A62]" />
            <span>Generate New Voucher</span>
          </h3>

          <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
            <div>
              <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                Coupon Code *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. VIP20 or AARKIS10"
                className={`w-full px-3 py-2 border uppercase font-mono rounded-xs focus:outline-none focus:border-[#B49A62] ${
                  isDark ? 'bg-[#181311] border-[#3E322A] text-white' : 'bg-[#FAF7F2] border-[#D8C2A0] text-black'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                  Type
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className={`w-full px-2.5 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                    isDark ? 'bg-[#181311] border-[#3E322A] text-white' : 'bg-[#FAF7F2] border-[#D8C2A0] text-black'
                  }`}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (₹)</option>
                </select>
              </div>

              <div>
                <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                  Value ({discountType === 'percentage' ? '%' : '₹'}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? '15' : '500'}
                  className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                    isDark ? 'bg-[#181311] border-[#3E322A] text-white' : 'bg-[#FAF7F2] border-[#D8C2A0] text-black'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                  Min Order (₹)
                </label>
                <input
                  type="number"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  placeholder="0"
                  className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                    isDark ? 'bg-[#181311] border-[#3E322A] text-white' : 'bg-[#FAF7F2] border-[#D8C2A0] text-black'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                  Max Cap (₹)
                </label>
                <input
                  type="number"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  placeholder="Optional"
                  className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                    isDark ? 'bg-[#181311] border-[#3E322A] text-white' : 'bg-[#FAF7F2] border-[#D8C2A0] text-black'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                  Usage Limit
                </label>
                <input
                  type="number"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="Unlimited"
                  className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                    isDark ? 'bg-[#181311] border-[#3E322A] text-white' : 'bg-[#FAF7F2] border-[#D8C2A0] text-black'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                    isDark ? 'bg-[#181311] border-[#3E322A] text-white' : 'bg-[#FAF7F2] border-[#D8C2A0] text-black'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#B49A62] hover:bg-[#A38853] text-[#181311] font-semibold uppercase tracking-wider text-xs rounded-xs flex items-center justify-center space-x-1 shadow-sm transition-colors"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Plus size={14} />
                  <span>Register Voucher</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Coupons List */}
        <div className={`lg:col-span-2 border p-6 rounded-xs shadow-lg space-y-4 ${
          isDark ? 'bg-[#221B17] border-[#3E322A]' : 'bg-white border-[#E8E0D2]'
        }`}>
          <h3 className={`font-serif text-lg font-medium ${isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'}`}>
            Active Promotion Registry ({coupons.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#A69483]">
              <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#B49A62]" />
              Loading vouchers...
            </div>
          ) : coupons.length === 0 ? (
            <p className="text-xs text-[#8E7766] py-6 text-center">No coupons created yet.</p>
          ) : (
            <div className={`divide-y ${isDark ? 'divide-[#2E241E]' : 'divide-[#EDE5D8]'}`}>
              {coupons.map((c) => (
                <div key={c._id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-mono text-sm font-semibold px-2 py-0.5 rounded-xs border ${
                        isDark ? 'text-[#FAF7F2] bg-[#181311] border-[#3E322A]' : 'text-[#281D18] bg-[#FAF7F2] border-[#D8C2A0]'
                      }`}>
                        {c.code}
                      </span>
                      <span className="text-xs text-[#B49A62] font-semibold">
                        {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                        c.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-[#8E7766]' : 'text-[#6F5847]'}`}>
                      Min Order: ₹{c.minOrderAmount} | Uses: {c.usedCount || c.usageCount || 0}
                      {c.usageLimit || c.usageLimitTotal ? ` / ${c.usageLimit || c.usageLimitTotal}` : ' (Unlimited)'}
                      {c.expiryDate && ` | Valid until: ${new Date(c.expiryDate).toLocaleDateString()}`}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleCoupon(c._id)}
                      className={`p-1.5 rounded-xs border text-xs transition-colors ${
                        c.isActive
                          ? 'border-amber-700 text-amber-500 hover:bg-amber-500/10'
                          : 'border-emerald-700 text-emerald-500 hover:bg-emerald-500/10'
                      }`}
                      title={c.isActive ? 'Deactivate coupon' : 'Activate coupon'}
                    >
                      <Power size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(c._id, c.code)}
                      className="p-1.5 text-[#8E7766] hover:text-rose-500 transition-colors"
                      title="Delete coupon"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
