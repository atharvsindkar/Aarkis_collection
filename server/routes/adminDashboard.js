import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { ordersDB, productsDB, auditLogsDB } from '../config/db.js';

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
    const inTransitCount = allOrders.filter(o => o.shipmentDetails?.shipmentStatus === 'in_transit').length;
    const deliveredCount = allOrders.filter(o => o.orderStatus === 'delivered').length;
    const cancelledCount = allOrders.filter(o => o.orderStatus === 'cancelled').length;
    const refundsPendingCount = allOrders.filter(o => o.refundDetails?.status === 'pending').length;

    // Real paid revenue calculation
    const paidOrders = allOrders.filter(o => o.paymentStatus === 'paid' && o.orderStatus !== 'cancelled');
    const totalSales = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const activeProducts = allProducts.filter(p => p.status === 'active');

    // Low stock product calculation
    let lowStockCount = 0;
    for (const p of activeProducts) {
      let isLow = false;
      for (const v of (p.variants || [])) {
        if (v.inventory) {
          for (const size of Object.keys(v.inventory)) {
            if (v.inventory[size] <= 2) isLow = true;
          }
        }
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
        totalAmount: o.totalAmount,
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
        totalSales,
        paidOrdersCount: paidOrders.length,
        activeProducts: activeProducts.length,
        lowStockProducts: lowStockCount,
      },
      recentOrders,
      recentAuditLogs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
