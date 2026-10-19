import React, { useState, useEffect } from 'react';
import { 
  Search, Eye, CheckCircle, Truck, XCircle, RotateCcw, 
  ChevronRight, Calendar, User, MapPin, CreditCard, AlertCircle, Loader2 
} from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';

export default function AdminOrders() {
  const { authFetch } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionModal, setActionModal] = useState(null); // 'ship' | 'cancel' | 'refund'
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Shipment inputs
  const [courierName, setCourierName] = useState('BlueDart Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  // Cancel inputs
  const [cancelReason, setCancelReason] = useState('');

  // Refund inputs
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

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
  const handleConfirmOrder = async (orderId) => {
    try {
      setActionLoading(true);
      const res = await authFetch(`/api/admin/orders/${orderId}/confirm`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedOrder(data.order);
        fetchOrders();
      }
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
          reason: refundReason
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedOrder(data.order);
        setActionModal(null);
        fetchOrders();
      } else {
        setActionError(data.message || 'Failed to process refund');
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#342922]">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#B49A62] font-semibold">
            Order Fulfillment
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#FAF7F2] font-normal">
            Orders Management
          </h2>
        </div>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, phone..."
            className="w-full px-3.5 py-2 pl-9 bg-[#221B17] border border-[#3E322A] text-xs text-[#FAF7F2] rounded-xs focus:outline-none focus:border-[#B49A62]"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-[#8E7766]" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#221B17] border border-[#3E322A] rounded-xs overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#A69483]">
            <Loader2 size={24} className="animate-spin mx-auto mb-2 text-[#B49A62]" />
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7F6B5C]">
            No orders found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181311] text-[#A69483] uppercase tracking-wider text-[10px] border-b border-[#342922]">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E241E] text-[#EFEAE2]">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-[#28201B] transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-[#FAF7F2]">
                      {o.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#FAF7F2]">{o.customer?.fullName}</div>
                      <div className="text-[10px] text-[#8E7766]">{o.customer?.email}</div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[#A69483]">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#FAF7F2]">
                      ₹{o.finalAmount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${
                        o.paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        o.paymentStatus === 'refunded' ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                        'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${
                        o.orderStatus === 'delivered' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        o.orderStatus === 'shipped' ? 'bg-sky-950 text-sky-400 border border-sky-800' :
                        o.orderStatus === 'cancelled' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="px-3 py-1 bg-[#2E241E] hover:bg-[#3E322A] text-[#FAF7F2] border border-[#4A3B31] rounded-xs inline-flex items-center space-x-1"
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

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <div className="w-screen max-w-2xl bg-[#1C1613] text-[#FAF7F2] border-l border-[#3E322A] shadow-2xl flex flex-col p-6 overflow-y-auto space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-[#342922]">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#B49A62]">
                    Order Details
                  </span>
                  <h3 className="font-serif text-2xl font-light text-[#FAF7F2]">
                    #{selectedOrder.orderNumber}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-[#8E7766] hover:text-white"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap gap-2 p-3 bg-[#221B17] border border-[#3E322A] rounded-xs">
                {selectedOrder.orderStatus === 'placed' && (
                  <button
                    onClick={() => handleConfirmOrder(selectedOrder._id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xs text-xs font-semibold uppercase tracking-wider flex items-center space-x-1"
                  >
                    <CheckCircle size={14} />
                    <span>Confirm Order</span>
                  </button>
                )}
                {selectedOrder.orderStatus !== 'cancelled' && selectedOrder.orderStatus !== 'delivered' && (
                  <button
                    onClick={() => setActionModal('ship')}
                    className="px-3 py-1.5 bg-sky-900 hover:bg-sky-800 text-white rounded-xs text-xs font-semibold uppercase tracking-wider flex items-center space-x-1"
                  >
                    <Truck size={14} />
                    <span>Update Shipment</span>
                  </button>
                )}
                {selectedOrder.orderStatus !== 'cancelled' && (
                  <button
                    onClick={() => setActionModal('cancel')}
                    className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded-xs text-xs font-semibold uppercase tracking-wider flex items-center space-x-1"
                  >
                    <XCircle size={14} />
                    <span>Cancel Order</span>
                  </button>
                )}
                {selectedOrder.paymentStatus === 'paid' && (
                  <button
                    onClick={() => {
                      setRefundAmount(selectedOrder.finalAmount);
                      setActionModal('refund');
                    }}
                    className="px-3 py-1.5 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-800 rounded-xs text-xs font-semibold uppercase tracking-wider flex items-center space-x-1"
                  >
                    <RotateCcw size={14} />
                    <span>Issue Refund</span>
                  </button>
                )}
              </div>

              {/* Customer and Shipping Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#221B17] border border-[#342922] rounded-xs space-y-2 text-xs">
                  <h4 className="text-[11px] uppercase tracking-wider text-[#B49A62] font-semibold flex items-center space-x-1.5">
                    <User size={13} />
                    <span>Customer Profile</span>
                  </h4>
                  <p className="font-medium text-[#FAF7F2]">{selectedOrder.customer?.fullName}</p>
                  <p className="text-[#A69483]">{selectedOrder.customer?.email}</p>
                  <p className="text-[#A69483]">{selectedOrder.customer?.phone}</p>
                </div>

                <div className="p-4 bg-[#221B17] border border-[#342922] rounded-xs space-y-2 text-xs">
                  <h4 className="text-[11px] uppercase tracking-wider text-[#B49A62] font-semibold flex items-center space-x-1.5">
                    <MapPin size={13} />
                    <span>Shipping Address</span>
                  </h4>
                  <p className="text-[#FAF7F2]">{selectedOrder.shippingAddress?.addressLine1}</p>
                  <p className="text-[#A69483]">
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.postalCode}
                  </p>
                  <p className="text-[#A69483]">{selectedOrder.shippingAddress?.country}</p>
                </div>
              </div>

              {/* Shipment Tracking Info */}
              {selectedOrder.shipment?.trackingNumber && (
                <div className="p-4 bg-[#1E252B] border border-sky-900/60 rounded-xs space-y-1.5 text-xs">
                  <h4 className="text-[11px] uppercase tracking-wider text-sky-400 font-semibold flex items-center space-x-1.5">
                    <Truck size={13} />
                    <span>Dispatch & Courier Logistics</span>
                  </h4>
                  <div className="flex justify-between text-[#C8B8A6]">
                    <span>Courier:</span>
                    <strong className="text-white">{selectedOrder.shipment.courierName}</strong>
                  </div>
                  <div className="flex justify-between text-[#C8B8A6]">
                    <span>Tracking Number:</span>
                    <strong className="font-mono text-white">{selectedOrder.shipment.trackingNumber}</strong>
                  </div>
                  {selectedOrder.shipment.trackingUrl && (
                    <a
                      href={selectedOrder.shipment.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-1 text-sky-400 underline text-[11px]"
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
                <div className="divide-y divide-[#2E241E] border border-[#342922] rounded-xs bg-[#221B17] p-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-medium text-[#FAF7F2]">{item.productName}</p>
                        <p className="text-[11px] text-[#8E7766]">
                          Variant: {item.variantName} | Size: {item.size} | Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#FAF7F2]">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-[#7F6B5C]">₹{item.price} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Summary */}
              <div className="p-4 bg-[#221B17] border border-[#342922] rounded-xs space-y-1.5 text-xs text-[#A69483]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal?.toLocaleString()}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({selectedOrder.couponCode})</span>
                    <span>-₹{selectedOrder.discountAmount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>₹{selectedOrder.shippingCharge || 0}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#342922] font-semibold text-sm text-[#FAF7F2]">
                  <span>Final Total</span>
                  <span>₹{selectedOrder.finalAmount?.toLocaleString()}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Shipment Modal */}
      {actionModal === 'ship' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
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
        </div>
      )}

      {/* Cancel Modal */}
      {actionModal === 'cancel' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
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
        </div>
      )}

      {/* Refund Modal */}
      {actionModal === 'refund' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <form onSubmit={handleRefundOrder} className="w-full max-w-md bg-[#221B17] border border-[#3E322A] p-6 rounded-xs space-y-4">
            <h3 className="font-serif text-xl text-purple-300">Issue Payment Refund</h3>
            {actionError && <p className="text-xs text-red-400">{actionError}</p>}
            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Refund Amount (₹) *</label>
              <input
                type="number"
                required
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-xs text-white rounded-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Refund Justification</label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Fitting return requested"
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
                className="px-4 py-2 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-800 text-xs uppercase tracking-wider font-semibold rounded-xs"
              >
                Record Refund
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
