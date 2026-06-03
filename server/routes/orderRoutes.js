const express = require('express');
const Order = require('../models/Order');
const { protect, checkAccountStatus, authorizeRoles } = require('../middleware/auth');
const sendOrderMail = require('../utils/sendOrderMail');

const router = express.Router();

/**
 * POST /api/orders
 * Place a new order (customer only).
 * @access Protected — customer
 */
router.post('/', protect, checkAccountStatus, authorizeRoles('customer'), async (req, res) => {
  try {
    const { products, amount, shippingAddress } = req.body;

    if (!products || !products.length) {
      return res.status(400).json({ success: false, message: 'Products are required.' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required.' });
    }

    const order = await Order.create({
      userId: req.user._id,
      products,
      amount,
      shippingAddress: shippingAddress || {},
      paymentStatus: 'pending',
      orderStatus: 'placed',
    });

    // Send confirmation email (non-blocking)
    try {
      await sendOrderMail(req.user.email, {
        orderId: order._id,
        amount: order.amount,
      });
    } catch (mailErr) {
      console.warn('Order email failed:', mailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/orders/my
 * Get all orders for the currently logged-in customer.
 * @access Protected — customer
 */
router.get('/my', protect, checkAccountStatus, authorizeRoles('customer'), async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/orders
 * Admin: Get all orders on the platform.
 * @access Admin Only
 */
router.get(
  '/',
  protect,
  checkAccountStatus,
  authorizeRoles('superadmin'),
  async (req, res) => {
    try {
      const orders = await Order.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });
      res.status(200).json({ success: true, count: orders.length, orders });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * PATCH /api/orders/:id/status
 * Admin: Update an order's status.
 * @access Admin Only
 */
router.patch(
  '/:id/status',
  protect,
  checkAccountStatus,
  authorizeRoles('superadmin'),
  async (req, res) => {
    try {
      const { orderStatus, paymentStatus } = req.body;
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      if (orderStatus) order.orderStatus = orderStatus;
      if (paymentStatus) order.paymentStatus = paymentStatus;
      await order.save();

      res.status(200).json({ success: true, message: 'Order updated.', order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
