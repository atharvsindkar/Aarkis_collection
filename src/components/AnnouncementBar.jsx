import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, Truck, Check } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function AnnouncementBar() {
  const { showToast } = useShop();
  const [coupons, setCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const fetchPublicCoupons = async () => {
      try {
        const res = await fetch('/api/coupons/public');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.coupons)) {
            setCoupons(data.coupons);
          }
        }
      } catch (err) {
        // Fallback to presets
      }
    };
    fetchPublicCoupons();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    showToast(`Coupon code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Build coupon items
  const dynamicItems = coupons.length > 0
    ? coupons.map(c => ({
        code: c.code,
        text: `USE CODE "${c.code}" — ${
          c.discountType === 'percentage'
            ? `${c.discountValue}% OFF ON ORDERS ABOVE ₹${c.minOrderAmount?.toLocaleString()}`
            : `FLAT ₹${c.discountValue} OFF ON ORDERS ABOVE ₹${c.minOrderAmount?.toLocaleString()}`
        }`
      }))
    : [
        { code: 'AARKIS10', text: 'USE CODE "AARKIS10" — 10% OFF ON ORDERS ABOVE ₹2,000' },
        { code: 'ATELIER500', text: 'USE CODE "ATELIER500" — FLAT ₹500 OFF ON ORDERS ABOVE ₹3,000' }
      ];

  const allItems = [
    ...dynamicItems,
    { code: null, text: 'COMPLIMENTARY EXPRESS ATELIER SHIPPING ACROSS INDIA OVER ₹5,000' },
    { code: null, text: 'AUTUMN / WINTER 2026 COUTURE EDIT — STYLE YOUR OWN WAY' }
  ];

  // Repeat for continuous seamless looping marquee
  const repeatedItems = [...allItems, ...allItems];

  return (
    <div className="w-full bg-[#18110E] text-[#D8C2A0] border-b border-[#2C211B] py-2 overflow-hidden select-none relative group">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused] items-center space-x-8 text-[10px] sm:text-[11px] font-medium tracking-[0.24em] uppercase">
        {repeatedItems.map((item, idx) => (
          <div key={idx} className="flex items-center space-x-8 shrink-0">
            {item.code ? (
              <span
                onClick={() => handleCopyCode(item.code)}
                className="cursor-pointer hover:text-white transition-colors flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-3 py-0.5 rounded-full border border-[#D8C2A0]/20"
                title="Click to copy code"
              >
                <Tag size={11} className="text-[#B49A62] shrink-0" />
                <span>{item.text}</span>
                {copiedCode === item.code ? (
                  <Check size={11} className="text-emerald-400" />
                ) : (
                  <span className="text-[9px] bg-[#B49A62] text-[#18110E] px-1.5 py-0.2 rounded-xs font-bold font-mono lowercase">
                    copy
                  </span>
                )}
              </span>
            ) : item.text.includes('SHIPPING') ? (
              <span className="flex items-center space-x-2">
                <Truck size={12} className="text-[#B49A62] shrink-0" />
                <span>{item.text}</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <Sparkles size={11} className="text-[#B49A62] shrink-0" />
                <span>{item.text}</span>
              </span>
            )}
            <span className="text-[#B49A62]/60 text-xs select-none">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
