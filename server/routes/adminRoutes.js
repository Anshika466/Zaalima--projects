const express = require('express');
const {
  approveVendor,
  suspendUser,
  activateUser,
  getAllUsers,
  getPendingVendors,
} = require('../controllers/adminController');
const { protect, authorizeRoles, checkAccountStatus } = require('../middleware/auth');

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

module.exports = router;
