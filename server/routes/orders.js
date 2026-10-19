import express from 'express';
import { ordersDB, productsDB, couponsDB } from '../config/db.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

const generateOrderNumber = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ARK-${new Date().getFullYear()}-${randomNum}`;
};

router.post('/checkout', async (req, res) => {
  try {
    const { items, couponCode, shippingAddress, customer, paymentMethod = 'cod' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Shopping bag is empty' });
    }

    const custName = customer?.fullName || shippingAddress?.fullName;
    const custEmail = customer?.email || shippingAddress?.email;
    const custPhone = customer?.phone || shippingAddress?.phone;
    const addrStreet = shippingAddress?.addressLine1 || shippingAddress?.street;
    const addrCity = shippingAddress?.city;
    const addrPostal = shippingAddress?.postalCode || shippingAddress?.pincode;

    if (!custName || !custEmail || !custPhone || !addrStreet || !addrCity) {
      return res.status(400).json({ success: false, message: 'Please provide full customer contact and delivery address' });
    }

    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await productsDB.findOne({
        $or: [{ _id: item.productId }, { slug: item.productId }],
      });

      if (!product || product.status !== 'active') {
        return res.status(400).json({ success: false, message: `Product "${item.name}" is no longer available` });
      }

      const variantIdToFind = item.variantId || item.colorId;
      const variant = (product.variants || []).find(v => v.id === variantIdToFind) || (product.variants || [])[0];
      if (!variant) {
        return res.status(400).json({ success: false, message: `Color variant not found for ${product.name}` });
      }

      const currentStock = variant.inventory?.[item.size];
      if (currentStock !== undefined && currentStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name} (${variant.colorName}, Size ${item.size}). Available: ${currentStock}`,
        });
      }

      const itemTotal = product.price * item.quantity;
      calculatedSubtotal += itemTotal;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        shortName: product.shortName,
        category: product.category,
        price: product.price,
        colorId: variant.id,
        colorName: variant.colorName,
        colorHex: variant.colorHex,
        image: variant.image,
        size: item.size,
        quantity: item.quantity,
        subtotal: itemTotal,
      });
    }

    // Validate coupon
    let discountAmount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await couponsDB.findOne({ code: couponCode.toUpperCase().trim() });
      if (coupon && coupon.isActive) {
        if (coupon.discountType === 'fixed') {
          discountAmount = Math.min(coupon.discountValue, calculatedSubtotal);
        } else {
          discountAmount = (calculatedSubtotal * coupon.discountValue) / 100;
        }
        appliedCoupon = coupon.code;
        await couponsDB.update({ _id: coupon._id }, { $inc: { usedCount: 1 } });
      }
    }

    const finalTotal = Math.max(0, calculatedSubtotal - discountAmount);
    const orderNumber = generateOrderNumber();

    // Decrement inventory
    for (const item of validatedItems) {
      const product = await productsDB.findOne({ _id: item.productId });
      if (product) {
        const variants = product.variants || [];
        const v = variants.find(varItem => varItem.id === item.colorId);
        if (v && v.inventory && v.inventory[item.size] !== undefined) {
          v.inventory[item.size] = Math.max(0, v.inventory[item.size] - item.quantity);
          await productsDB.update({ _id: product._id }, { $set: { variants } });
        }
      }
    }

    const isMockPayment = paymentMethod === 'mock_card' || paymentMethod === 'mock_upi';

    const order = await ordersDB.insert({
      orderNumber,
      customer: {
        fullName: custName,
        email: custEmail,
        phone: custPhone,
      },
      shippingAddress: {
        addressLine1: addrStreet,
        city: addrCity,
        state: shippingAddress.state || 'Maharashtra',
        postalCode: addrPostal || '400001',
        country: shippingAddress.country || 'India',
      },
      items: validatedItems,
      subtotal: calculatedSubtotal,
      discountAmount,
      couponCode: appliedCoupon,
      shippingCharge: 0,
      taxAmount: 0,
      finalAmount: finalTotal,
      orderStatus: isMockPayment ? 'confirmed' : 'placed',
      paymentStatus: isMockPayment ? 'paid' : 'pending',
      paymentMethod,
      paymentDetails: {
        razorpayOrderId: `rzp_ord_${Date.now()}`,
        paidAt: isMockPayment ? new Date() : null,
      },
      timeline: [
        {
          status: 'placed',
          timestamp: new Date(),
          actor: 'customer',
          note: `Order placed for ₹${finalTotal.toLocaleString()}`,
        },
        ...(isMockPayment
          ? [
              {
                status: 'paid',
                timestamp: new Date(),
                actor: 'mock_gateway',
                note: 'Mock development payment confirmed',
              },
              {
                status: 'confirmed',
                timestamp: new Date(),
                actor: 'system',
                note: 'Order confirmed and scheduled for tailoring',
              },
            ]
          : []),
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    sendEmail({
      to: shippingAddress.email,
      subject: `Order Confirmed: #${order.orderNumber} | Aarkis Collection`,
      text: `Thank you for your order #${order.orderNumber}! Your atelier pieces are being tailored. Total: ₹${finalTotal.toLocaleString()}.`,
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        items: order.items,
        shippingAddress: order.shippingAddress,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/track/:orderNumber', async (req, res) => {
  try {
    const order = await ordersDB.findOne({ orderNumber: req.params.orderNumber.toUpperCase().trim() });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order number not found' });
    }

    res.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        items: order.items,
        totalAmount: order.totalAmount,
        shipmentDetails: order.shipmentDetails,
        timeline: order.timeline,
        cancellation: order.cancellation,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
