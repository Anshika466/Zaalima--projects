const express = require('express');
const Order = require('../models/Order');
const { protect, checkAccountStatus, authorizeRoles } = require('../middleware/auth');
const sendOrderMail = require('../utils/sendOrderMail');
const sendStatusMail = require('../utils/sendStatusMail');

const router = express.Router();

/**
 * POST /api/orders
 * Place a new order (customer only).
 * @access Protected — customer
 */
router.post('/', protect, checkAccountStatus, authorizeRoles('customer'), async (req, res) => {
  try {
    const { products, amount, shippingAddress, paymentMethod, couponCode, discountAmount, originalAmount } = req.body;

    if (!products || !products.length) {
      return res.status(400).json({ success: false, message: 'Products are required.' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required.' });
    }

    const Product = require('../models/Product');

    // Verify stock levels for all products
    for (const item of products) {
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.name}` });
      }
      if (dbProduct.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product "${item.name}". Only ${dbProduct.stock} left in stock.`,
        });
      }
    }

    // Decrement stock
    for (const item of products) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    // If couponCode is used, increment its count
    if (couponCode) {
      const Coupon = require('../models/Coupon');
      await Coupon.findOneAndUpdate({ code: couponCode }, { $inc: { usedCount: 1 } });
    }

    const order = await Order.create({
      userId: req.user._id,
      products,
      amount,
      shippingAddress: shippingAddress || {},
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: paymentMethod === 'online' ? 'paid' : 'pending',
      orderStatus: 'placed',
      couponCode: couponCode || '',
      discountAmount: discountAmount || 0,
      originalAmount: originalAmount || amount,
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

    // Send notification email to super admin (non-blocking)
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: process.env.EMAIL, // Super admin email is same as sender email
        subject: 'New Order Received — Zaalima Admin Alert',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px;">
            <h2 style="color: #4F46E5;">New Order Placed on Zaalima! 🛍️</h2>
            <p>Hello Admin,</p>
            <p>A new order has been placed successfully by a customer.</p>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Total Amount:</strong> ₹${order.amount.toLocaleString()}</p>
            <hr style="border: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="color: #6B7280; font-size: 12px;">This is an automated alert.</p>
          </div>
        `,
      });
    } catch (adminMailErr) {
      console.warn('Admin order notification email failed:', adminMailErr.message);
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
      const order = await Order.findById(req.params.id).populate('userId', 'name email');

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      // Handle stock adjustments on cancellation / reinstatement
      if (orderStatus && orderStatus !== order.orderStatus) {
        const Product = require('../models/Product');
        
        if (orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
          // Refund stock
          for (const item of order.products) {
            if (item.productId) {
              await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: item.quantity }
              });
            }
          }
        } else if (orderStatus !== 'cancelled' && order.orderStatus === 'cancelled') {
          // Re-deduct stock
          for (const item of order.products) {
            if (item.productId) {
              const dbProduct = await Product.findById(item.productId);
              if (dbProduct && dbProduct.stock < item.quantity) {
                return res.status(400).json({
                  success: false,
                  message: `Cannot change status. Insufficient stock for product "${item.name}". Only ${dbProduct.stock} left.`,
                });
              }
            }
          }
          for (const item of order.products) {
            if (item.productId) {
              await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
              });
            }
          }
        }
      }

      const oldStatus = order.orderStatus;
      if (orderStatus) order.orderStatus = orderStatus;
      if (paymentStatus) order.paymentStatus = paymentStatus;
      await order.save();

      // Send status update email if status changed
      if (orderStatus && orderStatus !== oldStatus && order.userId && order.userId.email) {
        try {
          await sendStatusMail(order.userId.email, {
            orderId: order._id,
            amount: order.amount,
            status: orderStatus,
          });
        } catch (mailErr) {
          console.warn('Status update email failed:', mailErr.message);
        }
      }

      res.status(200).json({ success: true, message: 'Order updated.', order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * PATCH /api/orders/:id/cancel
 * Customer: Cancel their own order (only if status is placed or processing).
 * @access Protected — customer only
 */
router.patch(
  '/:id/cancel',
  protect,
  checkAccountStatus,
  authorizeRoles('customer'),
  async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      // Check ownership
      if (order.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to cancel this order.' });
      }

      // Check status
      if (order.orderStatus === 'cancelled') {
        return res.status(400).json({ success: false, message: 'Order is already cancelled.' });
      }
      if (order.orderStatus !== 'placed' && order.orderStatus !== 'processing') {
        return res.status(400).json({
          success: false,
          message: `Order cannot be cancelled because it is already ${order.orderStatus}.`,
        });
      }

      const Product = require('../models/Product');
      
      // Refund stock
      for (const item of order.products) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.quantity }
          });
        }
      }

      order.orderStatus = 'cancelled';
      await order.save();

      res.status(200).json({ success: true, message: 'Order cancelled successfully.', order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
