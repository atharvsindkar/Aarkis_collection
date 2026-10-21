import express from 'express';
import jwt from 'jsonwebtoken';
import { ordersDB, productsDB, couponsDB, usersDB } from '../config/db.js';
import { sendEmail } from '../services/emailService.js';
import { sendInternalError } from '../middleware/errorHandler.js';

const router = express.Router();

const generateOrderNumber = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ARK-${new Date().getFullYear()}-${randomNum}`;
};

// GET /api/orders/my-orders - Customer Order History (Protected by Token or Authenticated Session)
router.get('/my-orders', async (req, res) => {
  try {
    let authCustomer = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        if (process.env.JWT_SECRET) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          authCustomer = await usersDB.findOne({ _id: decoded.id });
        }
      } catch {}
    }

    const phone = authCustomer ? authCustomer.phone : req.query.phone;
    const email = authCustomer ? authCustomer.email : req.query.email;

    if (!phone && !email) {
      return res.status(401).json({ success: false, message: 'Authentication required to view order history' });
    }

    const allOrders = await ordersDB.find({});
    let matchingOrders = [];

    if (phone) {
      const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
      const last10 = cleanPhone.slice(-10);
      matchingOrders = allOrders.filter(o => {
        const oPhone = (o.customer?.phone || '').replace(/[\s\-\(\)\+]/g, '');
        const matchPhone = oPhone.length >= 10 && (oPhone.endsWith(last10) || last10.endsWith(oPhone));
        const matchEmail = email && o.customer?.email && o.customer.email.toLowerCase() === email.toLowerCase();
        return matchPhone || matchEmail;
      });
    } else if (email) {
      matchingOrders = allOrders.filter(o => o.customer?.email?.toLowerCase() === email.toLowerCase());
    }

    matchingOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      orders: matchingOrders.map(o => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        finalAmount: o.finalAmount || o.totalAmount,
        subtotal: o.subtotal,
        discountAmount: o.discountAmount || 0,
        shippingCharge: o.shippingCharge || 0,
        couponCode: o.couponCode,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        orderStatus: o.orderStatus,
        items: o.items || [],
        shippingAddress: o.shippingAddress,
        shipment: o.shipment || o.shipmentDetails || null,
        confirmation: o.confirmation || null,
        cancellation: o.cancellation || null,
        deliveredAt: o.deliveredAt || o.shipment?.deliveredAt || null,
        refundDetails: o.refundDetails || null,
        timeline: o.timeline || []
      }))
    });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to retrieve order history.');
  }
});

// POST /api/orders/checkout - Place Order
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

    if (!custName || !custEmail || !custPhone || !custPhone.trim() || !addrStreet || !addrCity) {
      return res.status(400).json({ success: false, message: 'Please provide full customer contact (including phone number) and delivery address' });
    }

    // Mandatory Phone Verification Check: at least 10 valid digits
    const cleanedPhone = custPhone.replace(/[\s\-\(\)\+]/g, '');
    if (cleanedPhone.length < 10) {
      return res.status(401).json({
        success: false,
        message: 'Patron sign-in with a verified phone number is mandatory to place an order.'
      });
    }

    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await productsDB.findOne({
        $or: [{ _id: item.productId }, { slug: item.productId }],
      });

      if (!product || product.status !== 'active') {
        return res.status(400).json({ success: false, message: `Product "${item.name || 'Selected product'}" is no longer available` });
      }

      // Check if product is coming soon
      if (product.isComingSoon) {
        return res.status(400).json({
          success: false,
          message: `"${product.name}" is a Coming Soon piece and is not available for purchase yet.`
        });
      }

      const variantIdToFind = item.variantId || item.colorId;
      const variant = (product.variants || []).find(v => v.id === variantIdToFind) || (product.variants || [])[0];
      if (!variant) {
        return res.status(400).json({ success: false, message: `Color variant not found for ${product.name}` });
      }

      // Robust case-insensitive size inventory lookup
      const sizeKey = Object.keys(variant.inventory || {}).find(
        k => k.trim().toUpperCase() === (item.size || '').trim().toUpperCase()
      ) || item.size;

      const rawStock = variant.inventory?.[sizeKey];
      const currentStock = (rawStock !== undefined && rawStock !== null) ? Number(rawStock) : 0;

      if (currentStock <= 0) {
        return res.status(400).json({
          success: false,
          message: `"${product.name}" (${variant.name || variant.colorName || 'Variant'}, Size ${item.size}) is currently out of stock.`
        });
      }

      if (currentStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name} (Size ${item.size}). Only ${currentStock} piece(s) available in atelier, but ${item.quantity} requested.`,
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
          if (coupon.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
          }
        }
        appliedCoupon = coupon.code;
        await couponsDB.update(
          { _id: coupon._id },
          { $inc: { usedCount: 1, usageCount: 1 } }
        );
      }
    }

    const finalTotal = Math.max(0, calculatedSubtotal - discountAmount);
    const orderNumber = generateOrderNumber();

    // Decrement inventory accurately
    for (const item of validatedItems) {
      const product = await productsDB.findOne({ _id: item.productId });
      if (product) {
        const variants = product.variants || [];
        const v = variants.find(varItem => varItem.id === item.colorId);
        if (v) {
          if (!v.inventory) v.inventory = {};
          const sizeKey = Object.keys(v.inventory).find(
            k => k.trim().toUpperCase() === (item.size || '').trim().toUpperCase()
          ) || item.size;
          const oldStock = Number(v.inventory[sizeKey] || 0);
          v.inventory[sizeKey] = Math.max(0, oldStock - item.quantity);
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
      to: custEmail,
      subject: `Order Confirmed: #${order.orderNumber} | Aarkis Collection`,
      text: `Thank you for your order #${order.orderNumber}! Your atelier pieces are being tailored. Total: ₹${finalTotal.toLocaleString()}.`,
    });

    // Auto-save shipping address to customer profile if user exists in DB
    try {
      const cleanPhone = custPhone.replace(/[\s\-\(\)\+]/g, '');
      const user = await usersDB.findOne({ 
        $or: [
          { phone: custPhone }, 
          { phone: `+91${cleanPhone.slice(-10)}` },
          { phone: cleanPhone.slice(-10) }
        ] 
      });
      if (user) {
        const addresses = user.addresses || [];
        const isDuplicate = addresses.some(a => 
          a.addressLine1?.toLowerCase().trim() === addrStreet.toLowerCase().trim() &&
          a.postalCode === addrPostal
        );
        if (!isDuplicate) {
          addresses.push({
            id: `addr_${Date.now()}`,
            addressLine1: addrStreet,
            city: addrCity,
            state: shippingAddress.state || 'Maharashtra',
            postalCode: addrPostal || '400001',
            country: shippingAddress.country || 'India',
            isDefault: addresses.length === 0
          });
          await usersDB.update({ _id: user._id }, { $set: { addresses, updatedAt: new Date() } });
        }
      }
    } catch (e) {
      console.error('Error auto-saving address to customer profile:', e);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order._id,
        _id: order._id,
        orderNumber: order.orderNumber,
        finalAmount: order.finalAmount,
        totalAmount: order.finalAmount,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        customer: order.customer,
        items: order.items,
        shippingAddress: order.shippingAddress,
      },
    });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to process checkout order.');
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
        totalAmount: order.finalAmount || order.totalAmount,
        finalAmount: order.finalAmount || order.totalAmount,
        shipmentDetails: order.shipment || order.shipmentDetails,
        deliveredAt: order.deliveredAt || order.shipment?.deliveredAt || null,
        refundDetails: order.refundDetails || null,
        timeline: order.timeline,
        cancellation: order.cancellation,
      },
    });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to track order details.');
  }
});

export default router;
