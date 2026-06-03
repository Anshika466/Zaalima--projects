Authentication & RBAC Handoff Notes

This document provides technical integration guidelines and handoff details for team members working on subsequent modules (Store Management, Cart & Payments, Dashboard & Analytics) based on the completed **Authentication and Role-Based Access Control (RBAC)** foundation.

---

## 🔑 Environment Configuration (`.env`)
To run the server, ensure your local `server/.env` contains the following keys:
```env
PORT=5000
MONGO_URI=mongodb://<your_connection_string>
JWT_SECRET=z@@l1m@_d3v_s3cr3t_k3y_2026_x7q9w2m4p8r1
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## 🧑‍💻 Integration Guide by Role

### 🏪 Member 2: Store & Product Management
1. **User Model Extension**:
   - The `User` model (`server/models/User.js`) already contains the `storeId` field (ref: `Store`) ready for linkage.
   - When a Vendor creates a store, you should update the `storeId` on their `User` document:
     ```javascript
     await User.findByIdAndUpdate(vendorId, { storeId: newStore._id });
     ```
2. **Protecting Product / Store CRUD Routes**:
   - Import the `protect` and `authorizeRoles` middleware from `server/middleware/auth.js`.
   - Apply them to your routes to ensure only authorized vendors can manage their products:
     ```javascript
     const { protect, authorizeRoles } = require('../middleware/auth');
     
     // Only approved vendors can create products
     router.post('/products', protect, authorizeRoles('vendor'), createProduct);
     ```

---

### 🛒 Member 3: Cart & Payments
1. **Authenticated Customer Context**:
   - The `protect` middleware automatically extracts the customer details from the JWT and attaches it to `req.user`.
   - Use `req.user.id` (or `req.user._id`) to dynamically associate cart items or orders with the authenticated customer:
     ```javascript
     const { protect } = require('../middleware/auth');
     
     // Retrieve cart for the logged-in customer
     router.get('/cart', protect, getCustomerCart);
     
     // Inside your controller:
     const customerId = req.user.id;
     const cart = await Cart.findOne({ user: customerId });
     ```

---

### 📊 Member 4: Dashboard & Analytics
1. **Route Protection**:
   - Secure platform-level analytics for the Super Admin, or store-level analytics for Vendors using the RBAC middleware:
     ```javascript
     const { protect, authorizeRoles } = require('../middleware/auth');
     
     // Platform Analytics (Super Admin only)
     router.get('/admin/analytics/revenue', protect, authorizeRoles('superadmin'), getPlatformRevenue);
     
     // Store Analytics (Vendor only)
     router.get('/vendor/analytics/sales', protect, authorizeRoles('vendor'), getStoreSales);
     ```

---

## 🔒 Security Middleware Reference

| Middleware | File Path | Usage & Purpose |
|------------|-----------|-----------------|
| `protect` | `server/middleware/auth.js` | Validates JWT token from the `Authorization: Bearer <token>` header and attaches `req.user` |
| `authorizeRoles(...roles)` | `server/middleware/auth.js` | Verifies that `req.user.role` matches one of the permitted roles (e.g., `'superadmin'`, `'vendor'`, `'customer'`) |
| `checkAccountStatus` | `server/middleware/auth.js` | Automatically blocks any requests from accounts with status `'pending'` or `'suspended'` |
| `apiLimiter` | `server/middleware/rateLimiter.js` | Prevents brute force logins by rate limiting requests to `10 requests per 15 minutes` |
