import React, { useState } from 'react';
import { 
  ShoppingBag, Clock, Truck, CheckCircle2, XCircle, 
  RotateCcw, DollarSign, AlertTriangle, Layers, ArrowUpRight, Activity 
} from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminTheme } from './AdminThemeContext';

export default function AdminDashboard({ onNavigate }) {
  const { authFetch } = useAdminAuth();
  const { isDark } = useAdminTheme();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/admin/dashboard/metrics');
      const data = await res.json();
      if (res.ok && data.success) {
        setMetrics(data.metrics);
      } else {
        setError(data.message || 'Failed to fetch metrics');
      }
    } catch (err) {
      setError('Network error fetching dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-[#B49A62] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
          Querying Live Atelier Database...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-950/40 border border-red-800 text-red-200 text-xs rounded-xs">
        {error}
      </div>
    );
  }

  const cards = [
    {
      id: "today",
      title: "Today's Orders",
      value: metrics?.todayOrders ?? 0,
      icon: ShoppingBag,
      sub: "Placed since midnight",
      color: "text-amber-500",
      action: () => onNavigate?.('orders', 'all')
    },
    {
      id: "awaiting",
      title: "Awaiting Action",
      value: metrics?.awaitingAction ?? 0,
      icon: Clock,
      sub: "Need confirmation/dispatch",
      color: "text-yellow-500",
      action: () => onNavigate?.('orders', 'awaiting')
    },
    {
      id: "inTransit",
      title: "In Transit",
      value: metrics?.inTransit ?? 0,
      icon: Truck,
      sub: "With courier partner",
      color: "text-sky-500",
      action: () => onNavigate?.('orders', 'shipped')
    },
    {
      id: "delivered",
      title: "Delivered",
      value: metrics?.delivered ?? 0,
      icon: CheckCircle2,
      sub: "Successfully completed",
      color: "text-emerald-500",
      action: () => onNavigate?.('orders', 'delivered')
    },
    {
      id: "cancelled",
      title: "Cancelled",
      value: metrics?.cancelled ?? 0,
      icon: XCircle,
      sub: "Voided or buyer cancelled",
      color: "text-rose-500",
      action: () => onNavigate?.('orders', 'cancelled')
    },
    {
      id: "refundsPending",
      title: "Pending Refunds",
      value: `₹${(metrics?.pendingRefundAmount || 0).toLocaleString()}`,
      icon: RotateCcw,
      sub: `${metrics?.pendingRefunds ?? metrics?.refundsPending ?? 0} order(s) awaiting return`,
      color: "text-purple-500",
      action: () => onNavigate?.('orders', 'refund_pending')
    },
    {
      id: "totalSales",
      title: "Total Sales (Real Paid)",
      value: `₹${(metrics?.totalPaidSales ?? metrics?.totalSales ?? 0).toLocaleString()}`,
      icon: DollarSign,
      sub: "Excludes cancelled/unpaid",
      color: "text-emerald-500",
      action: () => onNavigate?.('orders', 'paid')
    },
    {
      id: "lowStock",
      title: "Low Stock Items",
      value: metrics?.lowStockCount ?? metrics?.lowStockProducts ?? 0,
      icon: AlertTriangle,
      sub: "Variants ≤ 3 pieces",
      color: "text-amber-500",
      action: () => onNavigate?.('products')
    },
    {
      id: "activeProducts",
      title: "Active Products",
      value: metrics?.activeProducts ?? 0,
      icon: Layers,
      sub: "Published on storefront",
      color: "text-[#B49A62]",
      action: () => onNavigate?.('products')
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b ${
        isDark ? 'border-[#342922]' : 'border-[#E8E0D2]'
      }`}>
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#B49A62] font-semibold">
            Live Telemetry
          </span>
          <h2 className={`font-serif text-2xl sm:text-3xl font-normal ${
            isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'
          }`}>
            Atelier Executive Overview
          </h2>
        </div>
        <button
          onClick={fetchMetrics}
          className={`self-start sm:self-auto px-4 py-2 text-xs uppercase tracking-wider rounded-xs border transition-colors ${
            isDark 
              ? 'bg-[#2E241E] hover:bg-[#3E322A] text-[#C8B8A6] border-[#4A3B31]' 
              : 'bg-white hover:bg-[#FAF7F2] text-[#44332A] border-[#D8C2A0]'
          }`}
        >
          Refresh Data
        </button>
      </div>

      {/* Grid of 9 Real Database Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.action}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') card.action?.(); }}
              className={`p-5 border rounded-xs shadow-md flex items-start justify-between group transition-all duration-200 cursor-pointer ${
                isDark 
                  ? 'bg-[#221B17] border-[#3E322A] hover:border-[#B49A62] hover:bg-[#28201B]' 
                  : 'bg-white border-[#E8E0D2] hover:border-[#B49A62] hover:shadow-lg'
              }`}
            >
              <div>
                <p className={`text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5 ${
                  isDark ? 'text-[#A69483] group-hover:text-[#FAF7F2]' : 'text-[#6F5847] group-hover:text-[#281D18]'
                }`}>
                  <span>{card.title}</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#B49A62]" />
                </p>
                <p className={`font-serif text-2xl sm:text-3xl font-medium ${
                  isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'
                }`}>
                  {card.value}
                </p>
                <p className={`text-[10px] mt-1.5 ${isDark ? 'text-[#7F6B5C]' : 'text-[#8E7766]'}`}>
                  {card.sub}
                </p>
              </div>
              <div className={`p-2.5 border rounded-xs transition-transform group-hover:scale-105 ${
                isDark ? 'bg-[#181311] border-[#342922]' : 'bg-[#FAF7F2] border-[#E8E0D2]'
              }`}>
                <Icon size={18} className={card.color} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity / Audit Log Strip */}
      <div className={`border rounded-xs p-6 shadow-md ${
        isDark ? 'bg-[#221B17] border-[#3E322A]' : 'bg-white border-[#E8E0D2]'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity size={16} className="text-[#B49A62]" />
            <h3 className={`font-serif text-lg font-medium ${isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'}`}>
              Live Governance & Audit Trail
            </h3>
          </div>
          <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-[#7F6B5C]' : 'text-[#8E7766]'}`}>
            Latest Server Events
          </span>
        </div>

        {metrics?.recentAuditLogs?.length === 0 ? (
          <p className="text-xs text-[#7F6B5C] py-4 text-center">
            No audit events recorded yet.
          </p>
        ) : (
          <div className={`divide-y text-xs ${isDark ? 'divide-[#2E241E]' : 'divide-[#EDE5D8]'}`}>
            {metrics?.recentAuditLogs?.map((log) => (
              <div key={log._id || log.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className={`font-medium mr-2 ${isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'}`}>
                    [{log.action}]
                  </span>
                  <span className={isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}>
                    {log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)) : log.targetType}
                  </span>
                </div>
                <span className={`text-[10px] ${isDark ? 'text-[#7F6B5C]' : 'text-[#8E7766]'}`}>
                  {new Date(log.timestamp || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
