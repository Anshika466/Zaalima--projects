const express = require('express');
const { protect, checkAccountStatus, authorizeRoles } = require('../middleware/auth');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

// All analytics routes require superadmin access
router.use(protect, checkAccountStatus, authorizeRoles('superadmin'));

/**
 * GET /api/analytics/admin
 * Returns platform-wide analytics summary.
 * @access Admin Only
 */
router.get('/admin', async (req, res) => {
  try {
    // Fetch live counts from DB
    const totalVendors = await User.countDocuments({ role: 'vendor', status: 'active' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const pendingVendors = await User.countDocuments({ role: 'vendor', status: 'pending' });
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();

    // Revenue: sum of all paid orders
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Daily sales for the last 5 days
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const dailySales = [];

    for (let i = 4; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));

      const dayOrders = await Order.find({
        createdAt: { $gte: start, $lte: end },
        paymentStatus: 'paid',
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + o.amount, 0);
      const dayName = days[start.getDay() === 0 ? 6 : start.getDay() - 1];

      dailySales.push({
        day: dayName,
        revenue: dayRevenue,
        orders: dayOrders.length,
      });
    }

    res.status(200).json({
      success: true,
      totalRevenue,
      totalOrders,
      totalVendors,
      totalCustomers,
      totalProducts,
      pendingVendors,
      dailySales,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
