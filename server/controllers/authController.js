const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new Customer account
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerCustomer = async (req, res, next) => {
  try {
    // Check validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create customer (status defaults to 'active', role defaults to 'customer')
    const user = await User.create({
      name,
      email,
      password,
      role: 'customer',
      status: 'active',
    });

    // Generate JWT
    const token = generateToken(user._id, user.role, user.status);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
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
 * @desc    Register a new Vendor account (pending approval)
 * @route   POST /api/auth/vendor/register
 * @access  Public
 */
const registerVendor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }

    const { name, email, password, businessName, businessDescription } =
      req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create vendor with 'pending' status
    const user = await User.create({
      name,
      email,
      password,
      role: 'vendor',
      status: 'pending',
      businessName,
      businessDescription: businessDescription || '',
    });

    res.status(201).json({
      success: true,
      message:
        'Your application is under review. You will be notified via email upon approval.',
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
 * @desc    Login for Customer and Vendor
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }

    const { email, password } = req.body;

    // Find user and explicitly select password (since select: false on schema)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Don't allow superadmin to login through this route
    if (user.role === 'superadmin') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if vendor account is pending
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Account pending approval. Please wait for admin verification.',
      });
    }

    // Check if account is suspended
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role, user.status);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        ...(user.businessName && { businessName: user.businessName }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login exclusively for Super Admin
 * @route   POST /api/auth/admin/login
 * @access  Public (but only superadmin role accepted)
 */
const loginAdmin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }

    const { email, password } = req.body;

    // Find user and select password
    const user = await User.findOne({ email }).select('+password');

    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin credentials required.',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role, user.status);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
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
 * @desc    Get current authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Protected
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        ...(user.businessName && { businessName: user.businessName }),
        ...(user.businessDescription && {
          businessDescription: user.businessDescription,
        }),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Protected
 */
const logoutUser = async (req, res, next) => {
  try {
    // With JWT stateless auth, logout is handled client-side
    // by removing the token from localStorage.
    // This endpoint confirms the action to the frontend.
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCustomer,
  registerVendor,
  loginUser,
  loginAdmin,
  getMe,
  logoutUser,
};
