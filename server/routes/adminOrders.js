import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { ordersDB, auditLogsDB, productsDB } from '../config/db.js';
import { sendEmail } from '../services/emailService.js';
import { sendInternalError } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(authenticate, authorize('owner', 'admin'));

// 1. GET /api/admin/orders - List all orders with search, filter, pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, paymentStatus, search } = req.query;

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
        (o.customer?.fullName && o.customer.fullName.toLowerCase().includes(q)) ||
        (o.customer?.phone && o.customer.phone.includes(q)) ||
        (o.customer?.email && o.customer.email.toLowerCase().includes(q)) ||
        (o.shippingAddress?.fullName && o.shippingAddress.fullName.toLowerCase().includes(q))
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
    return sendInternalError(res, error, 'Failed to retrieve administrative orders.');
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
    return sendInternalError(res, error, 'Failed to retrieve order details.');
  }
});

// 3. Confirm order handler (Supports both POST & PATCH)
const handleConfirmOrder = async (req, res) => {
  try {
    const { expectedShippingDate, adminNote } = req.body || {};
    const order = await ordersDB.findOne({ _id: req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot confirm a cancelled order' });
    }

    const defaultEstimated = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const parsedDate = expectedShippingDate ? new Date(expectedShippingDate) : defaultEstimated;
    const formattedDateStr = parsedDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const note = adminNote || `Your bespoke order has been verified and scheduled for dispatch by ${formattedDateStr}.`;

    const timeline = order.timeline || [];
    timeline.push({
      status: 'confirmed',
      timestamp: new Date(),
      actor: `admin:${req.user.name || req.user.email}`,
      note: `Order confirmed by atelier administration. Expected shipping: ${formattedDateStr}`,
    });

    const confirmationDetails = {
      confirmedAt: new Date(),
      expectedShippingDate: parsedDate,
      expectedShippingDateFormatted: formattedDateStr,
      adminNote: note
    };

    await ordersDB.update(
      { _id: req.params.id },
      { 
        $set: { 
          orderStatus: 'confirmed', 
          confirmation: confirmationDetails, 
          timeline, 
          updatedAt: new Date() 
        } 
      }
    );

    const updated = await ordersDB.findOne({ _id: req.params.id });

    await auditLogsDB.insert({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'CONFIRM_ORDER',
      targetType: 'order',
      targetId: order.orderNumber,
      details: confirmationDetails,
      ip: req.ip,
      createdAt: new Date(),
    });

    const recipientEmail = order.customer?.email || order.shippingAddress?.email;
    if (recipientEmail) {
      sendEmail({
        to: recipientEmail,
        subject: `Order Confirmed: #${order.orderNumber} | Aarkis Collection`,
        text: `Your bespoke order #${order.orderNumber} has been verified and confirmed by our atelier.\nExpected Dispatch: ${formattedDateStr}\nNote: ${note}`,
      });
    }

    res.json({ 
      success: true, 
      message: 'Order confirmed successfully with expected shipping date and patron note.', 
      order: updated 
    });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to confirm order.');
  }
};

router.post('/:id/confirm', handleConfirmOrder);
router.patch('/:id/confirm', handleConfirmOrder);

// 4. Update shipment handler (Supports both POST & PATCH)
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
      actor: `admin:${req.user.name || req.user.email}`,
      note: `Shipment updated: ${effectiveCourier} (${effectiveTrackingId || 'No tracking ID'})`,
    });

    await ordersDB.update(
      { _id: req.params.id },
      {
        $set: {
          orderStatus: newOrderStatus,
          shipment: shipmentDetails,
          shipmentDetails,
          timeline,
          updatedAt: new Date(),
        },
      }
    );

    const updated = await ordersDB.findOne({ _id: req.params.id });

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
    return sendInternalError(res, error, 'Failed to update shipment.');
  }
};

router.patch('/:id/shipment', handleShipmentUpdate);
router.post('/:id/shipment', handleShipmentUpdate);

// 5. Cancel order handler (Supports both POST & PATCH)
const handleCancelOrder = async (req, res) => {
  try {
    const { reason, notes } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A mandatory cancellation reason must be provided' });
    }

    const order = await ordersDB.findOne({ _id: req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    // Restock product inventory
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        if (item.productId && item.size) {
          const product = await productsDB.findOne({ _id: item.productId });
          if (product && product.variants) {
            const variants = product.variants.map(v => {
              if (v.id === item.colorId || v.id === item.variantId) {
                const currentStock = v.inventory?.[item.size] ?? 0;
                return {
                  ...v,
                  inventory: {
                    ...v.inventory,
                    [item.size]: currentStock + item.quantity
                  }
                };
              }
              return v;
            });
            await productsDB.update({ _id: product._id }, { $set: { variants } });
          }
        }
      }
    }

    const cancellation = {
      isCancelled: true,
      cancelledAt: new Date(),
      cancelledBy: `admin:${req.user.name || req.user.email}`,
      reason: reason.trim(),
      notes: notes || '',
    };

    const cancelAmount = Number(order.finalAmount || order.totalAmount || 0);
    const newPaymentStatus = 'refund_pending';
    const refundDetails = {
      amount: cancelAmount,
      reason: `Order cancelled: ${reason}`,
      status: 'pending',
      initiatedAt: new Date(),
      initiatedBy: req.user?.email || 'admin',
      isManual: false,
    };

    const timeline = order.timeline || [];
    timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      actor: `admin:${req.user.name || req.user.email}`,
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

    const updated = await ordersDB.findOne({ _id: req.params.id });

    const recipientEmail = order.customer?.email || order.shippingAddress?.email;
    if (recipientEmail) {
      sendEmail({
        to: recipientEmail,
        subject: `Order Cancelled: #${order.orderNumber} | Aarkis Collection`,
        text: `Your order #${order.orderNumber} has been cancelled. Reason: ${reason}. ${newPaymentStatus === 'refund_pending' ? 'Your refund has been scheduled.' : ''}`,
      });
    }

    res.json({ success: true, message: 'Order cancelled successfully and inventory restocked', order: updated });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to cancel order.');
  }
};

router.patch('/:id/cancel', handleCancelOrder);
router.post('/:id/cancel', handleCancelOrder);

// 6. Refund handler (Supports both POST & PATCH)
const handleRefund = async (req, res) => {
  try {
    const { amount, reason, isManual, referenceNote } = req.body;

    const order = await ordersDB.findOne({ _id: req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const refundAmount = amount ? Number(amount) : (order.finalAmount || order.totalAmount);

    const refundDetails = {
      refundId: referenceNote || (isManual ? `manual_ref_${Date.now()}` : `rzp_refund_${Date.now()}`),
      amount: refundAmount,
      reason: reason || 'Customer request / Cancellation settlement',
      status: 'processed',
      initiatedAt: order.refundDetails?.initiatedAt || new Date(),
      completedAt: new Date(),
      initiatedBy: req.user.email,
      isManual: Boolean(isManual),
      referenceNote: referenceNote || 'Settled and completed by atelier accounts',
    };

    const timeline = order.timeline || [];
    timeline.push({
      status: 'refunded',
      timestamp: new Date(),
      actor: `admin:${req.user.name || req.user.email}`,
      note: `Refund of ₹${refundAmount} marked as completed/done. ${referenceNote ? `(Ref: ${referenceNote})` : ''}`,
    });

    await ordersDB.update(
      { _id: req.params.id },
      {
        $set: {
          paymentStatus: 'refunded',
          refundDetails,
          timeline,
          updatedAt: new Date(),
        },
      }
    );

    const updated = await ordersDB.findOne({ _id: req.params.id });

    await auditLogsDB.insert({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'PROCESS_REFUND',
      targetType: 'order',
      targetId: order.orderNumber,
      details: refundDetails,
      ip: req.ip,
      createdAt: new Date(),
    });

    const recipientEmail = order.customer?.email || order.shippingAddress?.email;
    if (recipientEmail) {
      sendEmail({
        to: recipientEmail,
        subject: `Refund Processed: #${order.orderNumber} | Aarkis Collection`,
        text: `Your refund of ₹${refundAmount} for order #${order.orderNumber} has been successfully completed and settled to your original payment source.\nReference: ${refundDetails.refundId}`,
      });
    }

    res.json({ success: true, message: 'Refund marked as done and recorded successfully', order: updated });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to process refund.');
  }
};

router.patch('/:id/refund', handleRefund);
router.post('/:id/refund', handleRefund);

// 7. Deliver order handler (Delivery Completed)
const handleDeliverOrder = async (req, res) => {
  try {
    const { deliveryNotes, deliveredAt } = req.body || {};
    const order = await ordersDB.findOne({ _id: req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot mark a cancelled order as delivered' });
    }

    const deliveryTimestamp = deliveredAt ? new Date(deliveredAt) : new Date();
    const updatedShipment = {
      ...(order.shipment || order.shipmentDetails || {}),
      shipmentStatus: 'delivered',
      deliveredAt: deliveryTimestamp,
      deliveryNotes: deliveryNotes || 'Successfully delivered to customer address.'
    };

    const timeline = order.timeline || [];
    timeline.push({
      status: 'delivered',
      timestamp: deliveryTimestamp,
      actor: `admin:${req.user.name || req.user.email}`,
      note: deliveryNotes || 'Order delivery completed successfully.',
    });

    // If order was COD and payment was pending, mark as paid upon confirmed delivery
    let paymentStatus = order.paymentStatus;
    if (order.paymentMethod === 'cod' && paymentStatus === 'pending') {
      paymentStatus = 'paid';
    }

    await ordersDB.update(
      { _id: req.params.id },
      {
        $set: {
          orderStatus: 'delivered',
          deliveredAt: deliveryTimestamp,
          shipment: updatedShipment,
          shipmentDetails: updatedShipment,
          paymentStatus,
          timeline,
          updatedAt: new Date(),
        },
      }
    );

    const updated = await ordersDB.findOne({ _id: req.params.id });

    await auditLogsDB.insert({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'DELIVER_ORDER',
      targetType: 'order',
      targetId: order.orderNumber,
      details: { deliveredAt: deliveryTimestamp, notes: deliveryNotes },
      ip: req.ip,
      createdAt: new Date(),
    });

    const recipientEmail = order.customer?.email || order.shippingAddress?.email;
    if (recipientEmail) {
      sendEmail({
        to: recipientEmail,
        subject: `Delivered: #${order.orderNumber} | Aarkis Collection`,
        text: `Your bespoke creation from Aarkis Collection (Order #${order.orderNumber}) has been delivered.\nThank you for choosing Aarkis.`,
      });
    }

    res.json({ success: true, message: 'Order marked as delivered successfully', order: updated });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to complete order delivery.');
  }
};

router.patch('/:id/deliver', handleDeliverOrder);
router.post('/:id/deliver', handleDeliverOrder);

export default router;
