const User = require('../models/User');

/**
 * @desc    Approve a pending Vendor account
 * @route   PATCH /api/admin/vendors/:id/approve
 * @access  Admin Only
 */
const approveVendor = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user.role !== 'vendor') {
      return res.status(400).json({
        success: false,
        message: 'This user is not a vendor.',
      });
    }

    if (user.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'This vendor is already approved.',
      });
    }

    user.status = 'active';
    await user.save();

    // Send email notification (non-blocking)
    try {
      const { sendVendorApprovedMail } = require('../utils/sendNotificationMail');
      sendVendorApprovedMail(user);
    } catch (mailErr) {
      console.warn('Vendor approval email failed:', mailErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Vendor "${user.businessName}" has been approved successfully.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        businessName: user.businessName,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Suspend any user account (Vendor or Customer)
 * @route   PATCH /api/admin/users/:id/suspend
 * @access  Admin Only
 */
const suspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Prevent suspending other superadmins
    if (user.role === 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot suspend a Super Admin account.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(400).json({
        success: false,
        message: 'This user is already suspended.',
      });
    }

    user.status = 'suspended';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User "${user.name}" has been suspended.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reactivate a suspended or pending user account
 * @route   PATCH /api/admin/users/:id/activate
 * @access  Admin Only
 */
const activateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'This user is already active.',
      });
    }

    user.status = 'active';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User "${user.name}" has been activated.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users (with optional role/status filters)
 * @route   GET /api/admin/users
 * @access  Admin Only
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, status } = req.query;

    // Build filter object
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all pending vendors
 * @route   GET /api/admin/vendors/pending
 * @access  Admin Only
 */
const getPendingVendors = async (req, res, next) => {
  try {
    const vendors = await User.find({ role: 'vendor', status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vendors.length,
      vendors,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  approveVendor,
  suspendUser,
  activateUser,
  getAllUsers,
  getPendingVendors,
};
