import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Clock, Truck, CheckCircle2, XCircle, 
  RotateCcw, DollarSign, AlertTriangle, Layers, ArrowUpRight, Activity 
} from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';

export default function AdminDashboard({ onNavigate }) {
  const { authFetch } = useAdminAuth();
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

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-[#B49A62] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs uppercase tracking-wider text-[#A69483]">Querying Live Atelier Database...</p>
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
      title: "Today's Orders",
      value: metrics?.todayOrders || 0,
      icon: ShoppingBag,
      sub: "Placed since midnight",
      color: "text-amber-300"
    },
    {
      title: "Awaiting Action",
      value: metrics?.awaitingAction || 0,
      icon: Clock,
      sub: "Need confirmation/dispatch",
      color: "text-yellow-400"
    },
    {
      title: "In Transit",
      value: metrics?.inTransit || 0,
      icon: Truck,
      sub: "With courier partner",
      color: "text-sky-400"
    },
    {
      title: "Delivered",
      value: metrics?.delivered || 0,
      icon: CheckCircle2,
      sub: "Successfully completed",
      color: "text-emerald-400"
    },
    {
      title: "Cancelled",
      value: metrics?.cancelled || 0,
      icon: XCircle,
      sub: "Voided or buyer cancelled",
      color: "text-rose-400"
    },
    {
      title: "Pending Refunds",
      value: metrics?.pendingRefunds || 0,
      icon: RotateCcw,
      sub: "Awaiting financial return",
      color: "text-purple-400"
    },
    {
      title: "Total Sales (Real Paid)",
      value: `₹${(metrics?.totalPaidSales || 0).toLocaleString()}`,
      icon: DollarSign,
      sub: "Excludes cancelled/unpaid",
      color: "text-emerald-300"
    },
    {
      title: "Low Stock Items",
      value: metrics?.lowStockCount || 0,
      icon: AlertTriangle,
      sub: "Variants ≤ 3 pieces",
      color: "text-amber-400"
    },
    {
      title: "Active Products",
      value: metrics?.activeProducts || 0,
      icon: Layers,
      sub: "Published on storefront",
      color: "text-[#B49A62]"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#342922]">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#B49A62] font-semibold">
            Live Telemetry
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#FAF7F2] font-normal">
            Atelier Executive Overview
          </h2>
        </div>
        <button
          onClick={fetchMetrics}
          className="self-start sm:self-auto px-4 py-2 bg-[#2E241E] hover:bg-[#3E322A] text-xs uppercase tracking-wider text-[#C8B8A6] rounded-xs border border-[#4A3B31] transition-colors"
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
              className="p-5 bg-[#221B17] border border-[#3E322A] rounded-xs shadow-md flex items-start justify-between group hover:border-[#B49A62]/50 transition-colors"
            >
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#A69483] mb-1">
                  {card.title}
                </p>
                <p className="font-serif text-2xl sm:text-3xl font-medium text-[#FAF7F2]">
                  {card.value}
                </p>
                <p className="text-[10px] text-[#7F6B5C] mt-1.5">{card.sub}</p>
              </div>
              <div className="p-2.5 bg-[#181311] border border-[#342922] rounded-xs">
                <Icon size={18} className={card.color} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity / Audit Log Strip */}
      <div className="bg-[#221B17] border border-[#3E322A] rounded-xs p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity size={16} className="text-[#B49A62]" />
            <h3 className="font-serif text-lg text-[#FAF7F2] font-medium">
              Live Governance & Audit Trail
            </h3>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-[#7F6B5C]">
            Latest Server Events
          </span>
        </div>

        {metrics?.recentAuditLogs?.length === 0 ? (
          <p className="text-xs text-[#7F6B5C] py-4 text-center">
            No audit events recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-[#2E241E] text-xs">
            {metrics?.recentAuditLogs?.map((log) => (
              <div key={log._id || log.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-[#FAF7F2] mr-2">[{log.action}]</span>
                  <span className="text-[#A69483]">{log.details || log.targetType}</span>
                </div>
                <span className="text-[10px] text-[#7F6B5C]">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
