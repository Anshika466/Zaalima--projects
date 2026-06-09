const express = require('express');
const {
  approveVendor,
  suspendUser,
  activateUser,
  getAllUsers,
  getPendingVendors,
} = require('../controllers/adminController');
const { protect, authorizeRoles, checkAccountStatus } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

// All admin routes require: authentication + active status + superadmin role
router.use(protect, checkAccountStatus, authorizeRoles('superadmin'));

/**
 * GET /api/admin/users — Get all users (with optional ?role=&status= filters)
 */
router.get('/users', getAllUsers);

/**
 * GET /api/admin/vendors/pending — Get all pending vendor applications
 */
router.get('/vendors/pending', getPendingVendors);

/**
 * PATCH /api/admin/vendors/:id/approve — Approve a pending vendor
 */
router.patch('/vendors/:id/approve', approveVendor);

/**
 * PATCH /api/admin/users/:id/suspend — Suspend a user account
 */
router.patch('/users/:id/suspend', suspendUser);

/**
 * PATCH /api/admin/users/:id/activate — Reactivate a user account
 */
router.patch('/users/:id/activate', activateUser);

/**
 * GET /api/admin/orders — Get all orders on the platform
 */
router.get('/orders', async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/orders/:id/status — Update order status
 */
router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    await order.save();
    res.status(200).json({ success: true, message: 'Order updated.', order });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/products — Get all products on the platform
 */
router.get('/products', async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('storeId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/products/:id — Delete any product
 */
router.delete('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.status(200).json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
