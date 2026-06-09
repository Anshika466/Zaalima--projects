const express = require('express');
const Store = require('../models/Store');
const User = require('../models/User');
const Order = require('../models/Order');
const { protect, checkAccountStatus, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

/**
 * @desc    Get current vendor's store
 * @route   GET /api/stores/my
 * @access  Private (Vendor)
 */
router.get('/my', protect, checkAccountStatus, authorizeRoles('vendor'), async (req, res, next) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return res.status(200).json({ success: true, store: null });
    }
    res.status(200).json({ success: true, store });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Create a new store for the vendor
 * @route   POST /api/stores
 * @access  Private (Vendor)
 */
router.post('/', protect, checkAccountStatus, authorizeRoles('vendor'), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Store name is required.' });
    }

    // Check if store already exists for owner
    let store = await Store.findOne({ owner: req.user._id });
    if (store) {
      return res.status(400).json({ success: false, message: 'Store already exists for this vendor.' });
    }

    store = await Store.create({
      owner: req.user._id,
      name,
      description,
    });

    // Update user profile with storeId
    await User.findByIdAndUpdate(req.user._id, { storeId: store._id });

    res.status(201).json({ success: true, message: 'Store created successfully.', store });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Update current vendor's store info
 * @route   PATCH /api/stores/my
 * @access  Private (Vendor)
 */
router.patch('/my', protect, checkAccountStatus, authorizeRoles('vendor'), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const store = await Store.findOneAndUpdate(
      { owner: req.user._id },
      { name, description },
      { new: true, runValidators: true }
    );
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });
    res.status(200).json({ success: true, message: 'Store updated.', store });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get all orders that include the vendor's products
 * @route   GET /api/stores/my-orders
 * @access  Private (Vendor)
 */
router.get('/my-orders', protect, checkAccountStatus, authorizeRoles('vendor'), async (req, res, next) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) return res.status(400).json({ success: false, message: 'No store found.' });

    // Find all orders where any product item has storeId matching this vendor's store
    const orders = await Order.find({ 'products.storeId': store._id.toString() })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get public store page by store ID (includes store info)
 * @route   GET /api/stores/:id
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id).populate('owner', 'name businessName businessDescription');
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });
    res.status(200).json({ success: true, store });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

