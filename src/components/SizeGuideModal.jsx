import React from 'react';
import { X, Ruler } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function SizeGuideModal() {
  const { isSizeGuideOpen, setIsSizeGuideOpen } = useShop();

  if (!isSizeGuideOpen) return null;

  const chart = [
    { size: 'S', bust: '34 - 35"', waist: '27 - 28"', hip: '37 - 38"', trouserLength: '39"' },
    { size: 'M', bust: '36 - 37"', waist: '29 - 30"', hip: '39 - 40"', trouserLength: '40"' },
    { size: 'L', bust: '38 - 40"', waist: '31 - 33"', hip: '41 - 43"', trouserLength: '40.5"' },
    { size: 'XL', bust: '41 - 43"', waist: '34 - 36"', hip: '44 - 46"', trouserLength: '41"' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#221612]/75 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setIsSizeGuideOpen(false)}
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <div
          className="relative bg-[#FAF7F2] w-full max-w-xl shadow-2xl border border-[#D8C2A0] rounded-xs overflow-hidden z-10 animate-fade-in my-8 p-6 sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D2] mb-6">
            <div className="flex items-center space-x-2">
              <Ruler size={18} className="text-[#34251F]" />
              <h3 className="font-serif text-2xl text-[#281D18] font-normal">
                Atelier Sizing Guide
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsSizeGuideOpen(false)}
              className="p-1 text-[#6F5847] hover:text-[#34251F]"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-xs text-[#6F5847] leading-relaxed mb-6 font-light">
            Our waistcoats and tailored co-ord sets are cut for modern structured drape with comfortable ease. All measurements are in inches.
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-xs text-left border border-[#E8E0D2] bg-white">
              <thead className="bg-[#F0EAE1] text-[#34251F] uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="p-3 border-b border-[#E8E0D2]">Size</th>
                  <th className="p-3 border-b border-[#E8E0D2]">Bust</th>
                  <th className="p-3 border-b border-[#E8E0D2]">Waist</th>
                  <th className="p-3 border-b border-[#E8E0D2]">Hip</th>
                  <th className="p-3 border-b border-[#E8E0D2]">Trouser Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1] text-[#6F5847]">
                {chart.map((row) => (
                  <tr key={row.size} className="hover:bg-[#FAF7F2]">
                    <td className="p-3 font-semibold text-[#34251F]">{row.size}</td>
                    <td className="p-3">{row.bust}</td>
                    <td className="p-3">{row.waist}</td>
                    <td className="p-3">{row.hip}</td>
                    <td className="p-3">{row.trouserLength}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-white border border-[#E8E0D2] rounded-xs text-[11px] text-[#7F6B5C] leading-relaxed">
            <strong className="text-[#34251F] block mb-1">Tailoring Note:</strong>
            Between sizes? We suggest selecting the larger size for a relaxed editorial drape or the smaller size for a sculpted waistcoat contour.
          </div>

          <div className="mt-6 text-right">
            <button
              type="button"
              onClick={() => setIsSizeGuideOpen(false)}
              className="px-6 py-2.5 bg-[#34251F] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider rounded-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
