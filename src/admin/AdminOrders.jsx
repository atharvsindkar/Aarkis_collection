import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Eye, CheckCircle, CheckCircle2, Truck, XCircle, RotateCcw, 
  ChevronRight, Calendar, User, MapPin, CreditCard, AlertCircle, Loader2, X 
} from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminTheme } from './AdminThemeContext';

const safeFormatDate = (d) => {
  if (!d) return '';
  try {
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString();
  } catch {
    return '';
  }
};

class AdminModalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Admin order modal error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center text-xs text-rose-300 bg-rose-950/80 border border-rose-800 rounded-xs m-4 max-w-md mx-auto">
          <p className="font-semibold mb-2">Display error loading order details.</p>
          <p className="font-mono text-[11px] opacity-80 mb-4">{this.state.error?.message}</p>
          <button
            type="button"
            onClick={this.props.onClose}
            className="px-4 py-1.5 bg-rose-900 hover:bg-rose-800 text-white rounded-xs uppercase tracking-wider text-[10px]"
          >
            Dismiss
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminOrders({ initialStatusFilter = 'all', onStatusFilterChange }) {
  const { authFetch } = useAdminAuth();
  const { isDark } = useAdminTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionModal, setActionModal] = useState(null); // 'confirm' | 'ship' | 'cancel' | 'refund' | 'deliver'
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Keep filter synced with props if navigated from dashboard
  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Shipment inputs
  const [courierName, setCourierName] = useState('BlueDart Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  // Confirm inputs
  const [confirmDate, setConfirmDate] = useState(() => {
    const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  });
  const [confirmNote, setConfirmNote] = useState('Your order has been verified and scheduled for atelier dispatch.');

  // Cancel inputs
  const [cancelReason, setCancelReason] = useState('');

  // Refund inputs
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundRefNote, setRefundRefNote] = useState('');

  // Delivery inputs
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/admin/orders?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search]);

  // Actions
  const handleConfirmOrderSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setActionError('');
      const res = await authFetch(`/api/admin/orders/${selectedOrder._id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          expectedShippingDate: confirmDate,
          adminNote: confirmNote
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedOrder(data.order);
        setActionModal(null);
        fetchOrders();
        try { localStorage.setItem('aarkis_catalog_sync', Date.now().toString()); } catch {}
      } else {
        setActionError(data.message || 'Failed to confirm order');
      }
    } catch (err) {
      setActionError('Network error confirming order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShipOrder = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setActionError('');
      const res = await authFetch(`/api/admin/orders/${selectedOrder._id}/shipment`, {
        method: 'POST',
        body: JSON.stringify({
          courierName,
          trackingNumber,
          trackingUrl,
          estimatedDelivery
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedOrder(data.order);
        setActionModal(null);
        fetchOrders();
        try { localStorage.setItem('aarkis_catalog_sync', Date.now().toString()); } catch {}
      } else {
        setActionError(data.message || 'Failed to update shipment');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancelReason) {
      setActionError('Cancellation reason is strictly mandatory.');
      return;
    }
    try {
      setActionLoading(true);
      setActionError('');
      const res = await authFetch(`/api/admin/orders/${selectedOrder._id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedOrder(data.order);
        setActionModal(null);
        setCancelReason('');
        fetchOrders();
      } else {
        setActionError(data.message || 'Failed to cancel order');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefundOrder = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setActionError('');
      const res = await authFetch(`/api/admin/orders/${selectedOrder._id}/refund`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(refundAmount),
          reason: refundReason,
          isManual: true,
          referenceNote: refundRefNote
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedOrder(data.order);
        setActionModal(null);
        fetchOrders();
        try { localStorage.setItem('aarkis_catalog_sync', Date.now().toString()); } catch {}
      } else {
        setActionError(data.message || 'Failed to process refund');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliverOrder = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setActionError('');
      const res = await authFetch(`/api/admin/orders/${selectedOrder._id}/deliver`, {
        method: 'POST',
        body: JSON.stringify({
          deliveryNotes
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedOrder(data.order);
        setActionModal(null);
        fetchOrders();
        try { localStorage.setItem('aarkis_catalog_sync', Date.now().toString()); } catch {}
      } else {
        setActionError(data.message || 'Failed to complete delivery');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const isRefundPendingOrder = (o) => {
    return (
      (o.paymentStatus === 'refund_pending' || 
       o.refundDetails?.status === 'pending' || 
       (o.orderStatus === 'cancelled' && o.paymentStatus !== 'refunded')) &&
      o.paymentStatus !== 'refunded' &&
      o.refundDetails?.status !== 'processed'
    );
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'awaiting') return ['placed', 'confirmed'].includes(o.orderStatus);
    if (statusFilter === 'shipped') return o.orderStatus === 'shipped' || ['in_transit', 'shipped'].includes(o.shipment?.shipmentStatus || o.shipmentDetails?.shipmentStatus);
    if (statusFilter === 'delivered') return o.orderStatus === 'delivered' || o.shipment?.shipmentStatus === 'delivered';
    if (statusFilter === 'cancelled') return o.orderStatus === 'cancelled';
    if (statusFilter === 'refund_pending') return isRefundPendingOrder(o);
    if (statusFilter === 'paid') return o.paymentStatus === 'paid';
    return o.orderStatus === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b ${
        isDark ? 'border-[#342922]' : 'border-[#E8E0D2]'
      }`}>
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#B49A62] font-semibold">
            Order Fulfillment
          </span>
          <h2 className={`font-serif text-2xl sm:text-3xl font-normal ${
            isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'
          }`}>
            Orders Management
          </h2>
        </div>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, phone..."
            className={`w-full px-3.5 py-2 pl-9 border text-xs rounded-xs focus:outline-none focus:border-[#B49A62] ${
              isDark 
                ? 'bg-[#221B17] border-[#3E322A] text-[#FAF7F2]' 
                : 'bg-white border-[#D8C2A0] text-[#281D18]'
            }`}
          />
          <Search size={14} className="absolute left-3 top-2.5 text-[#8E7766]" />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All Orders', count: orders.length },
          { id: 'awaiting', label: 'Awaiting Action', count: orders.filter(o => ['placed', 'confirmed'].includes(o.orderStatus)).length },
          { id: 'shipped', label: 'In Transit', count: orders.filter(o => o.orderStatus === 'shipped' || ['in_transit', 'shipped'].includes(o.shipment?.shipmentStatus)).length },
          { id: 'delivered', label: 'Delivered', count: orders.filter(o => o.orderStatus === 'delivered').length },
          { id: 'refund_pending', label: 'Refund Pending', count: orders.filter(o => isRefundPendingOrder(o)).length },
          { id: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.orderStatus === 'cancelled').length }
        ].map((tab) => {
          const isSelected = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                onStatusFilterChange?.(tab.id);
              }}
              className={`px-3.5 py-1.5 rounded-xs text-xs uppercase tracking-wider font-medium transition-all flex items-center space-x-1.5 border ${
                isSelected
                  ? (isDark ? 'bg-[#FAF7F2] text-[#281D18] border-[#FAF7F2] font-semibold shadow-xs' : 'bg-[#34251F] text-[#FAF7F2] border-[#34251F] font-semibold shadow-xs')
                  : (isDark ? 'bg-[#221B17] text-[#A69483] border-[#3E322A] hover:border-[#B49A62]' : 'bg-white text-[#6F5847] border-[#D8C2A0] hover:border-[#B49A62]')
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isSelected 
                  ? (isDark ? 'bg-black/20 text-black' : 'bg-white/20 text-white')
                  : (isDark ? 'bg-[#2E241E] text-[#B49A62]' : 'bg-[#FAF7F2] text-[#B49A62]')
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders Table Container */}
      <div className={`border rounded-xs overflow-hidden shadow-lg ${
        isDark ? 'bg-[#221B17] border-[#3E322A]' : 'bg-white border-[#E8E0D2]'
      }`}>
        {loading ? (
          <div className="p-12 text-center text-xs text-[#A69483]">
            <Loader2 size={24} className="animate-spin mx-auto mb-2 text-[#B49A62]" />
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7F6B5C]">
            No orders found under {statusFilter.replace('_', ' ')}.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[850px] border-collapse">
              <thead className={`uppercase tracking-wider text-[10px] border-b ${
                isDark ? 'bg-[#181311] text-[#A69483] border-[#342922]' : 'bg-[#FAF7F2] text-[#6F5847] border-[#E8E0D2]'
              }`}>
                <tr>
                  <th className="py-3.5 px-4 w-36">Order #</th>
                  <th className="py-3.5 px-4 w-52">Customer</th>
                  <th className="py-3.5 px-4 w-28">Date</th>
                  <th className="py-3.5 px-4 w-28">Total</th>
                  <th className="py-3.5 px-4 w-32">Payment</th>
                  <th className="py-3.5 px-4 w-32">Order Status</th>
                  <th className="py-3.5 px-4 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDark ? 'divide-[#2E241E] text-[#EFEAE2]' : 'divide-[#F0EAE1] text-[#281D18]'
              }`}>
                {filteredOrders.map((o) => (
                  <tr key={o._id} className={`transition-colors ${
                    isDark ? 'hover:bg-[#28201B]' : 'hover:bg-[#FAF7F2]'
                  }`}>
                    <td className="py-3.5 px-4 font-mono font-medium">
                      {o.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium">{o.customer?.fullName}</div>
                      <div className="text-[10px] text-[#8E7766]">{o.customer?.phone || o.customer?.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-[#A69483]">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      ₹{o.finalAmount?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold ${
                        o.paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        o.paymentStatus === 'refunded' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                        'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold ${
                        o.orderStatus === 'delivered' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        o.orderStatus === 'shipped' ? 'bg-sky-950 text-sky-300 border border-sky-800' :
                        o.orderStatus === 'cancelled' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className={`px-3 py-1.5 border rounded-xs inline-flex items-center space-x-1.5 transition-colors ${
                          isDark 
                            ? 'bg-[#2E241E] hover:bg-[#3E322A] text-[#FAF7F2] border-[#4A3B31]' 
                            : 'bg-[#FAF7F2] hover:bg-[#EFE8DD] text-[#34251F] border-[#D8C2A0]'
                        }`}
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Drawer / Modal Mounted Directly to Body via Portal */}
      {selectedOrder && createPortal(
        <AdminModalErrorBoundary onClose={() => setSelectedOrder(null)}>
          <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedOrder(null)}
          />

          {/* Modal Container */}
          <div className={`relative w-full max-w-4xl max-h-[92vh] rounded-xs border shadow-2xl flex flex-col overflow-hidden z-10 ${
            isDark ? 'bg-[#1C1613] text-[#FAF7F2] border-[#3E322A]' : 'bg-[#FAF7F2] text-[#281D18] border-[#D8C2A0]'
          }`}>
            
            {/* Header */}
            <div className={`flex items-center justify-between p-5 sm:p-6 border-b flex-shrink-0 ${
              isDark ? 'border-[#342922] bg-[#221B17]' : 'border-[#E8E0D2] bg-white'
            }`}>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#B49A62] font-semibold">
                  Order Details & Fulfillment
                </span>
                <h3 className={`font-serif text-2xl font-light mt-0.5 ${isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'}`}>
                  #{selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className={`p-1.5 rounded-full transition-colors ${
                  isDark ? 'text-[#8E7766] hover:text-white hover:bg-[#2E241E]' : 'text-[#8E7766] hover:text-black hover:bg-[#EFE8DD]'
                }`}
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Status Action Buttons (Hidden when order is delivered, since no action is needed) */}
              {selectedOrder.orderStatus !== 'delivered' && (
                <div className={`flex flex-wrap gap-2 p-3.5 border rounded-xs ${
                  isDark ? 'bg-[#221B17] border-[#3E322A]' : 'bg-white border-[#E8E0D2]'
                }`}>
                  {selectedOrder.orderStatus === 'placed' && (
                    <button
                      onClick={() => {
                        setActionError('');
                        setActionModal('confirm');
                      }}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xs text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 transition-colors shadow-xs"
                    >
                      <CheckCircle size={14} />
                      <span>Confirm Order</span>
                    </button>
                  )}
                  {selectedOrder.orderStatus !== 'cancelled' && (
                    <button
                      onClick={() => setActionModal('ship')}
                      className="px-3.5 py-1.5 bg-sky-900 hover:bg-sky-800 text-white rounded-xs text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 transition-colors shadow-xs"
                    >
                      <Truck size={14} />
                      <span>Update Shipment</span>
                    </button>
                  )}
                  {selectedOrder.orderStatus !== 'cancelled' && (
                    <button
                      onClick={() => {
                        setActionError('');
                        setDeliveryNotes('');
                        setActionModal('deliver');
                      }}
                      className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xs text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 transition-colors shadow-xs"
                    >
                      <CheckCircle2 size={14} />
                      <span>Mark Delivered</span>
                    </button>
                  )}
                  {selectedOrder.orderStatus !== 'cancelled' && (
                    <button
                      onClick={() => setActionModal('cancel')}
                      className="px-3.5 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded-xs text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
                    >
                      <XCircle size={14} />
                      <span>Cancel Order</span>
                    </button>
                  )}
                  {(selectedOrder.paymentStatus === 'refund_pending' || selectedOrder.paymentStatus === 'paid' || selectedOrder.orderStatus === 'cancelled') && selectedOrder.paymentStatus !== 'refunded' && (
                    <button
                      onClick={() => {
                        setRefundAmount(selectedOrder.refundDetails?.amount || selectedOrder.finalAmount);
                        setRefundReason(selectedOrder.refundDetails?.reason || 'Order cancellation');
                        setRefundRefNote('');
                        setActionError('');
                        setActionModal('refund');
                      }}
                      className="px-3.5 py-1.5 bg-purple-900 hover:bg-purple-800 text-purple-100 border border-purple-700 rounded-xs text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 transition-colors shadow-xs"
                    >
                      <RotateCcw size={14} />
                      <span>{selectedOrder.paymentStatus === 'refund_pending' ? 'Mark Refund Done' : 'Issue Refund'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Delivery Completed Banner if Delivered */}
              {selectedOrder.orderStatus === 'delivered' && (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/80 rounded-xs text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
                    <CheckCircle2 size={13} />
                    <span>Delivery Completed</span>
                  </div>
                  <p className="text-emerald-200">
                    Product delivered on <strong>{safeFormatDate(selectedOrder.deliveredAt || selectedOrder.updatedAt)}</strong>
                  </p>
                  {selectedOrder.shipment?.deliveryNotes && (
                    <p className="text-[11px] text-[#C8B8A6] italic">"{selectedOrder.shipment.deliveryNotes}"</p>
                  )}
                </div>
              )}

              {/* Dedicated Refund Status Banner */}
              {(selectedOrder.refundDetails?.status || selectedOrder.paymentStatus === 'refund_pending' || selectedOrder.paymentStatus === 'refunded') && (
                <div className={`p-4 rounded-xs border text-xs space-y-1.5 ${
                  selectedOrder.paymentStatus === 'refunded' || selectedOrder.refundDetails?.status === 'processed'
                    ? (isDark ? 'bg-purple-950/40 border-purple-800/80 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-950')
                    : (isDark ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-950')
                }`}>
                  <div className="flex items-center justify-between font-semibold">
                    <div className="flex items-center space-x-2">
                      <RotateCcw size={14} className={selectedOrder.paymentStatus === 'refunded' ? 'text-purple-400' : 'text-amber-500'} />
                      <span className="uppercase tracking-wider">
                        Refund Status: {selectedOrder.paymentStatus === 'refunded' || selectedOrder.refundDetails?.status === 'processed' ? 'Refund Done (Completed)' : 'Refund Pending'}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-bold">
                      ₹{(selectedOrder.refundDetails?.amount || selectedOrder.finalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {selectedOrder.paymentStatus === 'refunded' || selectedOrder.refundDetails?.status === 'processed'
                      ? `Settled on ${safeFormatDate(selectedOrder.refundDetails?.completedAt || selectedOrder.updatedAt)} by ${selectedOrder.refundDetails?.initiatedBy || 'Atelier Accounts'}.${selectedOrder.refundDetails?.referenceNote ? ` Ref: ${selectedOrder.refundDetails.referenceNote}` : ''}`
                      : 'Order cancellation was recorded. Refund is pending atelier accounts dispatch to customer.'}
                  </p>
                </div>
              )}

              {/* Confirmation Details Note if Confirmed */}
              {selectedOrder.confirmation && (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/80 rounded-xs text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
                    <CheckCircle size={13} />
                    <span>Atelier Order Confirmed</span>
                  </div>
                  <p className="text-emerald-200">
                    Expected Dispatch Date: <strong>{selectedOrder.confirmation.expectedShippingDateFormatted || safeFormatDate(selectedOrder.confirmation.expectedShippingDate)}</strong>
                  </p>
                  {selectedOrder.confirmation.adminNote && (
                    <p className="text-[11px] text-[#C8B8A6] italic">"{selectedOrder.confirmation.adminNote}"</p>
                  )}
                </div>
              )}

              {/* Customer and Shipping Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 border rounded-xs space-y-2 text-xs ${
                  isDark ? 'bg-[#221B17] border-[#342922]' : 'bg-white border-[#E8E0D2]'
                }`}>
                  <h4 className="text-[11px] uppercase tracking-wider text-[#B49A62] font-semibold flex items-center space-x-1.5">
                    <User size={13} />
                    <span>Customer Profile</span>
                  </h4>
                  <p className={`font-medium ${isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'}`}>{selectedOrder.customer?.fullName}</p>
                  <p className={isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}>{selectedOrder.customer?.email}</p>
                  <p className="font-mono text-[11px] text-[#B49A62]">{selectedOrder.customer?.phone}</p>
                </div>

                <div className={`p-4 border rounded-xs space-y-2 text-xs ${
                  isDark ? 'bg-[#221B17] border-[#342922]' : 'bg-white border-[#E8E0D2]'
                }`}>
                  <h4 className="text-[11px] uppercase tracking-wider text-[#B49A62] font-semibold flex items-center space-x-1.5">
                    <MapPin size={13} />
                    <span>Shipping Address</span>
                  </h4>
                  <p className={isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'}>{selectedOrder.shippingAddress?.addressLine1}</p>
                  <p className={isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}>
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.postalCode}
                  </p>
                  <p className={isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}>{selectedOrder.shippingAddress?.country || 'India'}</p>
                </div>
              </div>

              {/* Shipment Tracking Info */}
              {selectedOrder.shipment?.trackingNumber && (
                <div className={`p-4 border rounded-xs space-y-1.5 text-xs ${
                  isDark ? 'bg-[#1E252B] border-sky-900/60' : 'bg-sky-50 border-sky-200'
                }`}>
                  <h4 className="text-[11px] uppercase tracking-wider text-sky-600 font-semibold flex items-center space-x-1.5">
                    <Truck size={13} />
                    <span>Dispatch & Courier Logistics</span>
                  </h4>
                  <div className={`flex justify-between ${isDark ? 'text-[#C8B8A6]' : 'text-[#555]'}`}>
                    <span>Courier:</span>
                    <strong className={isDark ? 'text-white' : 'text-[#181311]'}>{selectedOrder.shipment.courierName || selectedOrder.shipment.courier}</strong>
                  </div>
                  <div className={`flex justify-between ${isDark ? 'text-[#C8B8A6]' : 'text-[#555]'}`}>
                    <span>Tracking Number:</span>
                    <strong className={`font-mono ${isDark ? 'text-white' : 'text-[#181311]'}`}>{selectedOrder.shipment.trackingNumber || selectedOrder.shipment.trackingId}</strong>
                  </div>
                  {selectedOrder.shipment.trackingUrl && (
                    <a
                      href={selectedOrder.shipment.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-1 text-sky-600 underline text-[11px]"
                    >
                      Track on courier portal →
                    </a>
                  )}
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-[11px] uppercase tracking-wider text-[#B49A62] font-semibold">
                  Items Ordered
                </h4>
                <div className={`divide-y border rounded-xs p-3.5 ${
                  isDark ? 'divide-[#2E241E] border-[#342922] bg-[#221B17]' : 'divide-[#EDE5D8] border-[#E8E0D2] bg-white'
                }`}>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className={`font-medium ${isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'}`}>{item.name || item.productName}</p>
                        <p className={`text-[11px] ${isDark ? 'text-[#8E7766]' : 'text-[#7A6757]'}`}>
                          Variant: {item.colorName || item.variantName} | Size: {item.size} | Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'}`}>
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                        <p className={`text-[10px] ${isDark ? 'text-[#7F6B5C]' : 'text-[#9A8777]'}`}>₹{item.price} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Summary */}
              <div className={`p-4 border rounded-xs space-y-1.5 text-xs ${
                isDark ? 'bg-[#221B17] border-[#342922] text-[#A69483]' : 'bg-white border-[#E8E0D2] text-[#6F5847]'
              }`}>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal?.toLocaleString()}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({selectedOrder.couponCode})</span>
                    <span>-₹{selectedOrder.discountAmount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>₹{selectedOrder.shippingCharge || 0}</span>
                </div>
                <div className={`flex justify-between pt-2 border-t font-semibold text-sm ${
                  isDark ? 'border-[#342922] text-[#FAF7F2]' : 'border-[#E8E0D2] text-[#281D18]'
                }`}>
                  <span>Final Total</span>
                  <span>₹{selectedOrder.finalAmount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex justify-end ${
              isDark ? 'border-[#342922] bg-[#221B17]' : 'border-[#E8E0D2] bg-white'
            }`}>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className={`px-5 py-2 text-xs uppercase tracking-wider rounded-xs border transition-colors ${
                  isDark 
                    ? 'bg-[#2E241E] border-[#4A3B31] text-[#C8B8A6] hover:bg-[#3E322A] hover:text-white' 
                    : 'bg-[#FAF7F2] border-[#D8C2A0] text-[#6F5847] hover:bg-[#EFE8DD] hover:text-black'
                }`}
              >
                Close Inspection
              </button>
            </div>

          </div>
        </div>
      </AdminModalErrorBoundary>,
      document.body
    )}

      {/* Confirm Order Modal Mounted to Body via Portal */}
      {actionModal === 'confirm' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <form onSubmit={handleConfirmOrderSubmit} className="w-full max-w-md bg-[#221B17] border border-[#3E322A] p-6 rounded-xs space-y-4">
            <h3 className="font-serif text-xl text-emerald-400">Confirm Order & Schedule Dispatch</h3>
            {actionError && <p className="text-xs text-red-400">{actionError}</p>}
            <p className="text-xs text-[#A69483]">
              The customer will see their order status as <strong>CONFIRMED</strong> with your expected shipping date note in their account.
            </p>
            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Expected Dispatch Date *</label>
              <input
                type="date"
                required
                value={confirmDate}
                onChange={(e) => setConfirmDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-xs text-white rounded-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Atelier Note for Patron</label>
              <textarea
                rows={2}
                value={confirmNote}
                onChange={(e) => setConfirmNote(e.target.value)}
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-xs text-white rounded-xs"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-[#2E241E] text-xs uppercase tracking-wider text-[#A69483] rounded-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-xs uppercase tracking-wider font-semibold text-white rounded-xs"
              >
                Confirm Order & Notify
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Shipment Modal Mounted to Body via Portal */}
      {actionModal === 'ship' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <form onSubmit={handleShipOrder} className="w-full max-w-md bg-[#221B17] border border-[#3E322A] p-6 rounded-xs space-y-4">
            <h3 className="font-serif text-xl text-[#FAF7F2]">Update Shipment Logistics</h3>
            {actionError && <p className="text-xs text-red-400">{actionError}</p>}
            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Courier Partner *</label>
              <input
                type="text"
                required
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-xs text-white rounded-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Tracking Number *</label>
              <input
                type="text"
                required
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. BLUEDART-8492049"
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-xs text-white rounded-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Tracking Portal URL</label>
              <input
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-xs text-white rounded-xs"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-[#2E241E] text-xs uppercase tracking-wider text-[#A69483] rounded-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-sky-900 hover:bg-sky-800 text-xs uppercase tracking-wider font-semibold text-white rounded-xs"
              >
                Save & Notify Customer
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Cancel Modal Mounted to Body via Portal */}
      {actionModal === 'cancel' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <form onSubmit={handleCancelOrder} className="w-full max-w-md bg-[#221B17] border border-[#3E322A] p-6 rounded-xs space-y-4">
            <h3 className="font-serif text-xl text-rose-300">Mandatory Cancellation Reason</h3>
            {actionError && <p className="text-xs text-red-400">{actionError}</p>}
            <p className="text-xs text-[#A69483]">
              Cancelling will restock the inventory and send an automated cancellation notice.
            </p>
            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Reason for cancellation *</label>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer requested size modification prior to dispatch"
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-xs text-white rounded-xs"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-[#2E241E] text-xs uppercase tracking-wider text-[#A69483] rounded-xs"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs uppercase tracking-wider font-semibold rounded-xs"
              >
                Confirm Cancellation
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Deliver Modal Mounted to Body via Portal */}
      {actionModal === 'deliver' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <form onSubmit={handleDeliverOrder} className="w-full max-w-md bg-[#221B17] border border-[#3E322A] p-6 rounded-xs space-y-4">
            <h3 className="font-serif text-xl text-emerald-300">Complete Order Delivery</h3>
            {actionError && <p className="text-xs text-red-400">{actionError}</p>}
            <p className="text-xs text-[#A69483]">
              Marking as delivered will record delivery completion, update the customer's portal tracking, and if Cash On Delivery, finalize payment.
            </p>
            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Delivery Notes / Handover Details</label>
              <textarea
                rows={2}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="e.g. Delivered directly to patron at recipient residence."
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-xs text-white rounded-xs"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-[#2E241E] text-xs uppercase tracking-wider text-[#A69483] rounded-xs"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-xs uppercase tracking-wider font-semibold text-white rounded-xs shadow-xs"
              >
                Confirm Delivery Completed
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Refund Modal Mounted to Body via Portal */}
      {actionModal === 'refund' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <form onSubmit={handleRefundOrder} className="w-full max-w-md bg-[#221B17] border border-[#3E322A] p-6 rounded-xs space-y-4">
            <div className="flex items-center space-x-2 text-purple-300">
              <RotateCcw size={18} />
              <h3 className="font-serif text-xl">Record Refund Done</h3>
            </div>
            {actionError && <p className="text-xs text-red-400">{actionError}</p>}
            <p className="text-xs text-[#A69483]">
              Mark refund as settled/done for order #{selectedOrder?.orderNumber}. This updates the customer's portal and sets refund status to completed.
            </p>
            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Refund Amount (₹) *</label>
              <input
                type="number"
                required
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-xs text-white rounded-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Bank Reference / Gateway Ref # (Optional)</label>
              <input
                type="text"
                value={refundRefNote}
                onChange={(e) => setRefundRefNote(e.target.value)}
                placeholder="e.g. UPI/NEFT Ref 948201847 or Gateway Ref"
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-xs text-white rounded-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Refund Justification / Reason</label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Customer requested order cancellation"
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-xs text-white rounded-xs"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-[#2E241E] text-xs uppercase tracking-wider text-[#A69483] rounded-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-purple-100 border border-purple-700 text-xs uppercase tracking-wider font-semibold rounded-xs shadow-xs"
              >
                Confirm Refund Done
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}
