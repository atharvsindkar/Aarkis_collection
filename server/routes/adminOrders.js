import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { ordersDB, auditLogsDB } from '../config/db.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

router.use(authenticate, authorize('owner', 'admin'));

// 1. GET /api/admin/orders - List all orders with search, filter, pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 15, status, paymentStatus, search } = req.query;

    let orders = await ordersDB.find({});

    if (status && status !== 'all') {
      orders = orders.filter(o => o.orderStatus === status);
    }

    if (paymentStatus && paymentStatus !== 'all') {
      orders = orders.filter(o => o.paymentStatus === paymentStatus);
    }

    if (search) {
      const q = search.toLowerCase();
      orders = orders.filter(o =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.shippingAddress?.fullName && o.shippingAddress.fullName.toLowerCase().includes(q)) ||
        (o.shippingAddress?.email && o.shippingAddress.email.toLowerCase().includes(q))
      );
    }

    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = orders.length;
    const paginated = orders.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      orders: paginated,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. GET /api/admin/orders/:id - Get full order details
router.get('/:id', async (req, res) => {
  try {
    const order = await ordersDB.findOne({ _id: req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. PATCH /api/admin/orders/:id/confirm - Confirm an eligible order
router.patch('/:id/confirm', async (req, res) => {
  try {
    const order = await ordersDB.findOne({ _id: req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot confirm a cancelled order' });
    }

    const timeline = order.timeline || [];
    timeline.push({
      status: 'confirmed',
      timestamp: new Date(),
      actor: `admin:${req.user.name}`,
      note: 'Order confirmed by atelier administration',
    });

    await ordersDB.update(
      { _id: req.params.id },
      { $set: { orderStatus: 'confirmed', timeline, updatedAt: new Date() } }
    );

    await auditLogsDB.insert({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'CONFIRM_ORDER',
      targetType: 'order',
      targetId: order.orderNumber,
      ip: req.ip,
      createdAt: new Date(),
    });

    sendEmail({
      to: order.shippingAddress.email,
      subject: `Order Confirmed: #${order.orderNumber} | Aarkis Collection`,
      text: `Your order #${order.orderNumber} has been verified and confirmed by our atelier. Total: ₹${order.totalAmount}`,
    });

    res.json({ success: true, message: 'Order confirmed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const handleShipmentUpdate = async (req, res) => {
  try {
    const { 
      courier, courierName, 
      trackingId, trackingNumber, 
      trackingUrl, 
      dispatchDate, estimatedDeliveryDate, estimatedDelivery, 
      shipmentStatus, notes 
    } = req.body;

    const order = await ordersDB.findOne({ _id: req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const effectiveCourier = courierName || courier || order.shipment?.courierName || order.shipmentDetails?.courier || 'BlueDart Express';
    const effectiveTrackingId = trackingNumber || trackingId || order.shipment?.trackingNumber || order.shipmentDetails?.trackingId;
    const effectiveStatus = shipmentStatus || 'shipped';

    const shipmentDetails = {
      courier: effectiveCourier,
      courierName: effectiveCourier,
      trackingId: effectiveTrackingId,
      trackingNumber: effectiveTrackingId,
      trackingUrl: trackingUrl || order.shipment?.trackingUrl || order.shipmentDetails?.trackingUrl,
      dispatchDate: dispatchDate ? new Date(dispatchDate) : new Date(),
      estimatedDeliveryDate: (estimatedDeliveryDate || estimatedDelivery) ? new Date(estimatedDeliveryDate || estimatedDelivery) : null,
      shipmentStatus: effectiveStatus,
      notes: notes !== undefined ? notes : '',
    };

    let newOrderStatus = 'shipped';
    if (effectiveStatus === 'delivered') newOrderStatus = 'delivered';

    const timeline = order.timeline || [];
    timeline.push({
      status: newOrderStatus,
      timestamp: new Date(),
      actor: `admin (${req.user.name})`,
      note: `Shipment updated: ${effectiveCourier} - #${effectiveTrackingId}`,
    });

    await ordersDB.update(
      { _id: order._id },
      {
        $set: {
          shipment: shipmentDetails,
          shipmentDetails,
          orderStatus: newOrderStatus,
          timeline,
          updatedAt: new Date(),
        },
      }
    );

    const updated = await ordersDB.findOne({ _id: order._id });

    await auditLogsDB.insert({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'UPDATE_SHIPMENT',
      targetType: 'order',
      targetId: order.orderNumber,
      details: shipmentDetails,
      ip: req.ip,
      createdAt: new Date(),
    });

    res.json({ success: true, message: 'Shipment updated successfully', order: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.patch('/:id/shipment', handleShipmentUpdate);
router.post('/:id/shipment', handleShipmentUpdate);


// 5. PATCH /api/admin/orders/:id/cancel - Cancel order with mandatory reason
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { reason, notes } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'A mandatory cancellation reason must be provided' });
    }

    const order = await ordersDB.findOne({ _id: req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    const cancellation = {
      isCancelled: true,
      cancelledAt: new Date(),
      cancelledBy: `admin:${req.user.name}`,
      reason,
      notes: notes || '',
    };

    let newPaymentStatus = order.paymentStatus;
    let refundDetails = order.refundDetails || {};

    if (order.paymentStatus === 'paid') {
      newPaymentStatus = 'refund_pending';
      refundDetails = {
        amount: order.totalAmount,
        reason: `Order cancelled: ${reason}`,
        status: 'pending',
        initiatedAt: new Date(),
        initiatedBy: req.user.email,
        isManual: false,
      };
    }

    const timeline = order.timeline || [];
    timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      actor: `admin:${req.user.name}`,
      note: `Cancelled reason: ${reason}`,
    });

    await ordersDB.update(
      { _id: req.params.id },
      {
        $set: {
          orderStatus: 'cancelled',
          cancellation,
          paymentStatus: newPaymentStatus,
          refundDetails,
          timeline,
          updatedAt: new Date(),
        },
      }
    );

    sendEmail({
      to: order.shippingAddress.email,
      subject: `Order Cancelled: #${order.orderNumber} | Aarkis Collection`,
      text: `Your order #${order.orderNumber} has been cancelled. Reason: ${reason}. ${newPaymentStatus === 'refund_pending' ? 'Your refund has been scheduled.' : ''}`,
    });

    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. PATCH /api/admin/orders/:id/refund - Process or mark refund
router.patch('/:id/refund', async (req, res) => {
  try {
    const { amount, reason, isManual, referenceNote } = req.body;

    const order = await ordersDB.findOne({ _id: req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const refundAmount = amount ? Number(amount) : order.totalAmount;

    const refundDetails = {
      refundId: isManual ? `manual_ref_${Date.now()}` : `rzp_refund_${Date.now()}`,
      amount: refundAmount,
      reason: reason || 'Customer request / Cancellation',
      status: 'processed',
      initiatedAt: order.refundDetails?.initiatedAt || new Date(),
      completedAt: new Date(),
      initiatedBy: req.user.email,
      isManual: Boolean(isManual),
      referenceNote: referenceNote || '',
    };

    const timeline = order.timeline || [];
    timeline.push({
      status: 'refunded',
      timestamp: new Date(),
      actor: `admin:${req.user.name}`,
      note: `Refund of ₹${refundAmount} recorded. ${isManual ? `(Manual Reference: ${referenceNote})` : '(Gateway Confirmed)'}`,
    });

    await ordersDB.update(
      { _id: req.params.id },
      { $set: { paymentStatus: 'refunded', refundDetails, timeline, updatedAt: new Date() } }
    );

    sendEmail({
      to: order.shippingAddress.email,
      subject: `Refund Processed: #${order.orderNumber} | Aarkis Collection`,
      text: `Your refund of ₹${refundAmount} for order #${order.orderNumber} has been completed.`,
    });

    res.json({ success: true, message: 'Refund completed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
