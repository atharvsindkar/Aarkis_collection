import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { ordersDB, productsDB, auditLogsDB } from '../config/db.js';
import { sendInternalError } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(authenticate, authorize('owner', 'admin'));

router.get('/metrics', async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const allOrders = await ordersDB.find({});
    const allProducts = await productsDB.find({});

    const todayOrdersCount = allOrders.filter(o => new Date(o.createdAt) >= todayStart).length;
    const awaitingActionCount = allOrders.filter(o => ['placed', 'confirmed'].includes(o.orderStatus)).length;
    
    // In Transit: orders marked as shipped or with courier in transit/shipped/dispatched
    const inTransitCount = allOrders.filter(o => 
      o.orderStatus === 'shipped' || 
      ['in_transit', 'shipped', 'dispatched'].includes(o.shipment?.shipmentStatus || o.shipmentDetails?.shipmentStatus)
    ).length;

    const deliveredCount = allOrders.filter(o => o.orderStatus === 'delivered').length;

    const cancelledCount = allOrders.filter(o => o.orderStatus === 'cancelled').length;

    // Pending Refunds: orders marked as refund_pending, with refundDetails.status === 'pending', or cancelled unrefunded orders
    const pendingRefundOrders = allOrders.filter(o => 
      (o.paymentStatus === 'refund_pending' || 
       o.refundDetails?.status === 'pending' || 
       (o.orderStatus === 'cancelled' && o.paymentStatus !== 'refunded')) &&
      o.paymentStatus !== 'refunded' &&
      o.refundDetails?.status !== 'processed'
    );
    const refundsPendingCount = pendingRefundOrders.length;
    const pendingRefundAmount = pendingRefundOrders.reduce((sum, o) => 
      sum + Number(o.refundDetails?.amount || o.finalAmount || o.totalAmount || 0), 0
    );

    // Real paid revenue calculation
    const paidOrders = allOrders.filter(o => o.paymentStatus === 'paid' && o.orderStatus !== 'cancelled');
    const totalSales = paidOrders.reduce((sum, o) => sum + (o.totalAmount || o.finalAmount || 0), 0);

    const activeProducts = allProducts.filter(p => p.status === 'active' || p.status === undefined);

    // Low stock product calculation (any variant with inventory count <= 3)
    let lowStockCount = 0;
    for (const p of activeProducts) {
      let isLow = false;
      for (const v of (p.variants || [])) {
        if (v.inventory && typeof v.inventory === 'object') {
          for (const size of Object.keys(v.inventory)) {
            const count = Number(v.inventory[size]);
            if (!isNaN(count) && count > 0 && count <= 3) {
              isLow = true;
              break;
            }
          }
        }
        if (isLow) break;
      }
      if (isLow) lowStockCount++;
    }

    // Recent 5 orders
    const recentOrders = allOrders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(o => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        totalAmount: o.finalAmount || o.totalAmount,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
        shippingAddress: o.shippingAddress,
      }));

    const recentAuditLogs = (await auditLogsDB.find({}))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    res.json({
      success: true,
      metrics: {
        todayOrders: todayOrdersCount,
        awaitingAction: awaitingActionCount,
        inTransit: inTransitCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
        refundsPending: refundsPendingCount,
        pendingRefunds: refundsPendingCount, // Alias for frontend compatibility
        pendingRefundAmount,
        totalSales,
        totalPaidSales: totalSales, // Alias for frontend compatibility
        paidOrdersCount: paidOrders.length,
        activeProducts: activeProducts.length,
        lowStockProducts: lowStockCount,
        lowStockCount: lowStockCount, // Alias for frontend compatibility
      },
      recentOrders,
      recentAuditLogs,
    });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to compile dashboard metrics.');
  }
});

export default router;
