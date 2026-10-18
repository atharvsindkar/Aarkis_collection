import React from 'react';
import { Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function ToastNotification() {
  const { toast } = useShop();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-fade-in pointer-events-none">
      <div className="bg-[#2C211B] text-[#FAF7F2] px-5 py-3.5 rounded-xs shadow-2xl border border-[#D8C2A0]/40 flex items-center space-x-3 pointer-events-auto">
        <Sparkles size={16} className="text-[#D8C2A0] flex-shrink-0" />
        <p className="text-xs font-light tracking-wide">{toast}</p>
      </div>
    </div>
  );
}
