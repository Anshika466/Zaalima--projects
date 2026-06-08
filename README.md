# 🛍️ OnShop: Multi-Tenant SaaS E-Commerce Platform

OnShop is a secure, multi-tenant Software-as-a-Service (SaaS) e-commerce platform designed to allow multiple vendors to host their independent storefronts while customers browse products, manage their shopping carts, and place orders. The platform is protected by a robust Role-Based Access Control (RBAC) security system.

Developed under **Zaalima Development**, this project is modularized into four primary areas:
1. **Authentication & Roles Module**
2. **Store & Product Management Module**
3. **Cart & Payments Module**
4. **Dashboard & Analytics Module**

---

## 🏗️ Architecture & Modules Overview

### 🔑 1. Authentication & RBAC (Security Layer)
* **JWT Session Management:** Stateless session handling using JWTs with custom lifetimes (7 days for customers, 24 hours for vendors and admins).
* **Role-Based Access Control (RBAC):** Three distinct roles with custom registration, login, and authorization logic:
  * **Super Admin:** Pre-seeded platform managers with capabilities to approve vendors, suspend users, and view platform-wide analytics.
  * **Vendor:** Business owners who register (subject to admin approval) to manage their stores and inventory.
  * **Customer:** Regular users who register instantly, browse stores, purchase products, and track order histories.
* **Security & Defense Systems:**
  * Global HTTP protection using **Helmet.js**.
  * Dynamic CORS configuration limiting API access to authorized frontend origins.
  * API rate limiting on authentication routes (maximum 10 requests per 15 minutes per IP).
  * Input validation and sanitization using `express-validator`.

### 🏪 2. Store & Product Management
* **Store Isolation:** Vendors are linked to their own store context (`storeId` ref), preventing them from viewing or modifying other stores.
* **Product CRUD:** Complete create, read, update, and delete actions for store items.
* **Media Storage:** Integrated **Cloudinary** storage for secure product image uploads.

### 🛒 3. Cart & Payments
* **Customer Context linkage:** Cart items and checkouts are dynamically linked directly to the authenticated customer via the `protect` middleware.
* **Shopping Cart:** Real-time adding, removing, and quantity adjustments of items.
* **Checkout System:** Dynamic order placement and order history logs.

### 📊 4. Dashboard & Analytics
* **Super Admin Analytics:** Comprehensive charts and stats showing total platform revenue, order volumes, and active stores.
* **Vendor Analytics:** Deep dives into store-specific sales performance and revenue metrics.
* **UI Protection:** Route guards that restrict dashboard access to authorized roles.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React (Vite) | Component-based, lightning-fast SPA rendering |
| **State Management** | Redux Toolkit | Global and persistent state slicing (auth, cart) |
| **Routing** | React Router DOM | Router configuration with custom `<ProtectedRoute>` guards |
| **Styling** | Vanilla CSS / Tailwind CSS | Polished, interactive, and responsive UI components |
| **Backend API** | Node.js / Express.js | Core web application router and middleware runner |
| **Security** | JWT, Bcrypt.js, Helmet.js | Token authorization, secure password hashing, and HTTP security headers |
| **Database** | MongoDB & Mongoose | Document-oriented data persistence with Schema rules |
| **Storage** | Cloudinary | Static asset and product image hosting |

---

## 📂 Repository Directory Structure

```
z-p1/
├── client/                     # React Frontend App
│   ├── src/
│   │   ├── components/         # Reusable UI elements (Spinner, Navbar, protected router)
│   │   ├── pages/              # Portals & Dashboards (Shop, Vendor Dashboard, Admin Console)
│   │   ├── store/              # Redux slices (authSlice, cartSlice, etc.)
│   │   ├── App.jsx             # Main Router and Page Definitions
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js Express REST API
│   ├── config/                 # DB connection and helper utilities
│   ├── middleware/             # Auth parser, RBAC controller, Rate limiters
│   ├── models/                 # Database Schemas (User.js, Store.js, Product.js, Order.js)
│   ├── routes/                 # Core API endpoints (auth, admin, vendor, shop, etc.)
│   ├── seedAdmin.js            # Database seeding script for Super Admin
│   ├── server.js               # Entrypoint script
│   └── package.json
│
├── handoff_notes.md            # Technical guidelines for module integration
└── walkthrough.md              # Detailed walkthrough of auth flows & testing steps
```

---

## 💾 Database Schema: User Model

The core database model handles authentication, business linking, and account states:

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | `ObjectId` | Auto | - | Primary Key |
| `name` | `String` | Yes | - | User's full name (2-100 characters) |
| `email` | `String` | Yes | - | Unique, indexed, lowercased on save |
| `password` | `String` | Yes | - | Bcrypt hashed; omitted from API responses |
| `role` | `String` | Yes | `'customer'` | Enum: `'superadmin'`, `'vendor'`, `'customer'` |
| `status` | `String` | Yes | `'active'` / `'pending'` | Enum: `'pending'`, `'active'`, `'suspended'` |
| `businessName` | `String` | Conditional | - | Required only when `role` is `'vendor'` |
| `storeId` | `ObjectId` | No | `null` | References `Store` model (linked on store creation) |

---

## ⚙️ Environment Configuration

Create a `.env` file inside the `server/` directory and configure the variables below:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/onshop?retryWrites=true&w=majority&replicaSet=<your_replica_set>
JWT_SECRET=your_secure_random_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## 🚀 Getting Started

### 1. Install Project Dependencies

Install dependencies for both frontend and backend modules:

```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

### 2. Run Database Seeding
To initialize the Super Admin role for testing and review:

```bash
cd ../server
node seedAdmin.js
```
* **Super Admin Login:** `admin@onshop.com` / `Admin@123456`

### 3. Launch Development Servers

Start the Express API:
```bash
# Inside server/
npm run dev
```
*Port:* `http://localhost:5000`

Start the Vite React Application:
```bash
# Inside client/
npm run dev
```
*Port:* `http://localhost:5173`

---

## 🛡️ Middleware Reference (Developer Guide)

When developing or integrating endpoints, apply the following authorization filters:

| Middleware | Path | Purpose |
|---|---|---|
| `protect` | `server/middleware/auth.js` | Parses the `Authorization: Bearer <JWT>` header and attaches `req.user` payload. |
| `authorizeRoles(...roles)` | `server/middleware/auth.js` | Restricts route access to specific role arrays (e.g., `authorizeRoles('vendor', 'superadmin')`). |
| `checkAccountStatus` | `server/middleware/auth.js` | Rejects requests from users whose status is set to `'pending'` or `'suspended'`. |
| `apiLimiter` | `server/middleware/rateLimiter.js` | Protects authentication routes from brute force attacks (max 10 requests per 15 mins). |

### Integration Examples:

**Route Protection & RBAC:**
```javascript
const { protect, authorizeRoles, checkAccountStatus } = require('../middleware/auth');

// Protect vendor products CRUD
router.post('/products', protect, checkAccountStatus, authorizeRoles('vendor'), createProduct);
```

**Context Association:**
```javascript
router.post('/orders', protect, async (req, res) => {
  const newOrder = await Order.create({
    user: req.user.id, // Linked dynamically from JWT payload
    items: req.body.items
  });
  res.status(201).json(newOrder);
});
```

---

## 🤝 Git Commit Guidelines

To maintain clean repository histories, write commits conforming to standard prefixes:
* `feat:` for new capabilities (e.g. `feat: add product model and route`)
* `fix:` for fixing bugs (e.g. `fix: patch cross-origin redirect error`)
* `chore:` for housekeeping (e.g. `chore: update dependencies`)
* `docs:` for documentation modifications
