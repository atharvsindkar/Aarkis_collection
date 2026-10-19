import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Calendar, Percent, AlertCircle, Check, Loader2 } from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';

export default function AdminCoupons() {
  const { authFetch } = useAdminAuth();
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
          usageLimit: usageLimit ? parseInt(usageLimit) : null
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(`Coupon ${code.toUpperCase()} registered.`);
        setCode('');
        setDiscountValue('');
        setMaxDiscountAmount('');
        setUsageLimit('');
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="pb-6 border-b border-[#342922]">
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#B49A62] font-semibold">
          Promotions & Privileges
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl text-[#FAF7F2] font-normal">
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
        <div className="bg-[#221B17] border border-[#3E322A] p-6 rounded-xs shadow-lg space-y-4 h-fit">
          <h3 className="font-serif text-lg text-[#FAF7F2] font-medium flex items-center space-x-2">
            <Tag size={16} className="text-[#B49A62]" />
            <span>Generate New Voucher</span>
          </h3>

          <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. VIP20"
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] uppercase font-mono text-white rounded-xs focus:outline-none focus:border-[#B49A62]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-[#A69483] mb-1">Type</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-full px-2.5 py-2 bg-[#181311] border border-[#3E322A] text-white rounded-xs"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#A69483] mb-1">
                  Value ({discountType === 'percentage' ? '%' : '₹'}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? '15' : '500'}
                  className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-white rounded-xs"
                >
                </input>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-[#A69483] mb-1">Min Order (₹)</label>
                <input
                  type="number"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-white rounded-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#A69483] mb-1">Max Cap (₹)</label>
                <input
                  type="number"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-white rounded-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Total Usage Limit</label>
              <input
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Unlimited if empty"
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-white rounded-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#B49A62] hover:bg-[#A38853] text-[#181311] font-semibold uppercase tracking-wider text-xs rounded-xs flex items-center justify-center space-x-1"
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
        <div className="lg:col-span-2 bg-[#221B17] border border-[#3E322A] p-6 rounded-xs shadow-lg space-y-4">
          <h3 className="font-serif text-lg text-[#FAF7F2] font-medium">
            Active Promotion Registry ({coupons.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#A69483]">
              <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#B49A62]" />
              Loading vouchers...
            </div>
          ) : (
            <div className="divide-y divide-[#2E241E]">
              {coupons.map((c) => (
                <div key={c._id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-semibold text-[#FAF7F2] bg-[#181311] px-2 py-0.5 rounded-xs border border-[#3E322A]">
                        {c.code}
                      </span>
                      <span className="text-xs text-[#B49A62] font-medium">
                        {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8E7766] mt-1">
                      Min Order: ₹{c.minOrderAmount} | Uses: {c.usageCount || 0}
                      {c.usageLimit ? ` / ${c.usageLimit}` : ' (Unlimited)'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] rounded-full uppercase font-semibold">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
