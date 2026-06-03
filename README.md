# 🛍️ OnShop: E-Commerce Platform (Authentication & RBAC Module)

OnShop is a multi-vendor e-commerce platform featuring robust authentication and dynamic Role-Based Access Control (RBAC). This repository hosts the core Authentication and Authorization module, which separates access levels for three key roles: **Super Admins**, **Vendors**, and **Customers**.

---

## 🚀 Key Features

### 🔒 Backend (Express & Node.js)
* **Stateless JWT Session Management:** Role-based token expiry (7 days for Customers, 24 hours for Vendors & Admins).
* **Role-Based Authorization Middlewares:** Granular route protection using custom middleware layers.
* **Security & Defense System:**
  * **Helmet.js:** Secures HTTP headers to protect against common vulnerabilities.
  * **CORS Integration:** Configured to trust only designated frontend origin ports.
  * **Rate Limiting:** Prevents brute force login attempts (max 10 requests per 15 minutes per IP).
  * **Input Validation:** Validation schemas using `express-validator` and Mongoose schema constraints to prevent injection attacks.
* **Database Seeding:** Dedicated CLI scripts to easily bootstrap default Super Admin accounts.

### 💻 Frontend (React & Vite)
* **Global Redux Store:** Stores auth state globally, persisting JWTs and restoring session data automatically on browser refreshes.
* **Declarative Route Guards:** Custom `<ProtectedRoute>` component intercepting unauthorized access and redirecting users dynamically based on roles.
* **Responsive Dashboard UIs:** Polished user flows using Vanilla CSS, complete with loader spinners, custom status badges, forms, and layout grids.
* **Role-Based Registrations:** Distinct endpoints and pages for customer and vendor registration.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React (Vite), Redux Toolkit, React Router DOM, HTML5, Vanilla CSS |
| **Backend** | Node.js, Express.js, JWT (`jsonwebtoken`), `bcryptjs`, `express-validator`, `express-rate-limit`, `helmet`, `cors` |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Tooling** | npm, Git |

---

## 📂 Project Structure

```
z-p1/
├── client/                 # React Frontend Application
│   ├── src/
│   │   ├── components/     # Reusable UI Elements (Spinner, Route Guards, etc.)
│   │   ├── pages/          # Dashboards (Admin, Vendor, Customer Shop)
│   │   ├── store/          # Redux Toolkit Slices (Auth state, etc.)
│   │   ├── App.jsx         # Routes definition
│   │   └── main.jsx        # App entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Express Backend API
│   ├── config/             # DB Connection Config
│   ├── middleware/         # Auth, Role Guards, & Rate Limiters
│   ├── models/             # Mongoose Schemas (User, Store)
│   ├── routes/             # Authentication & User Management Routes
│   ├── seedAdmin.js        # Seed script for Super Admin
│   ├── server.js           # Express Entrypoint
│   └── package.json
│
├── handoff_notes.md        # Technical guidelines for subsequent modules
└── walkthrough.md          # Step-by-step feature walkthrough
```

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the `server` directory and configure the following parameters:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/onshop?retryWrites=true&w=majority&replicaSet=<your_replica_set>
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## ⚡ Getting Started

### 1. Clone & Install Dependencies

Open your terminal in the root directory and install packages for both the client and server:

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 2. Bootstrapping the Super Admin Account

Run the pre-configured seeding script to create the initial Super Admin account:

```bash
cd ../server
node seedAdmin.js
```

* **Default Admin Email:** `admin@onshop.com`
* **Default Admin Password:** `Admin@123456`

### 3. Run the Development Servers

Run both servers concurrently.

**Start the Backend API:**
```bash
# In server/ directory
npm run dev
# or: node server.js
```
*API will run on [http://localhost:5000](http://localhost:5000)*

**Start the Frontend App:**
```bash
# In client/ directory
npm run dev
```
*Frontend will run on [http://localhost:5173](http://localhost:5173)*

---

## 🧪 Role & Verification Flows

Use the following flows to test user registration, approvals, and route security:

### Flow A: Customer Shop Registration
1. Navigate to `http://localhost:5173/register`.
2. Register a new Customer account.
3. You are automatically signed in and redirected to the `/shop` route.

### Flow B: Vendor Registration & Admin Approval
1. Navigate to `http://localhost:5173/vendor/register`.
2. Register a Vendor account. Try logging in immediately; you should be blocked since your status is `pending`.
3. Open `http://localhost:5173/admin/login` and authenticate using the Super Admin credentials (`admin@onshop.com` / `Admin@123456`).
4. Approve the pending Vendor from the Admin panel table.
5. Log out of the Admin panel, go to `http://localhost:5173/login`, and log in as the approved Vendor. You will be redirected to the Vendor Dashboard (`/vendor/dashboard`).

### Flow C: Role-Based Router Security Check
1. Log in as a Customer.
2. Manually type `http://localhost:5173/vendor/dashboard` or `/admin/dashboard` in the address bar.
3. The `<ProtectedRoute>` interceptor will immediately redirect you back to `/shop` to protect system boundaries.

---

## 🛡️ Developer Integration Guide

If you are building subsequent modules (e.g., Store Management, Cart, Checkout, or Analytics), incorporate the auth controls as follows:

### 1. Accessing Authenticated User Context
The `protect` middleware attaches the validated user payload directly to `req.user`.

```javascript
const { protect } = require('../middleware/auth');

router.get('/my-data', protect, (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  // Proceed with DB query using userId
});
```

### 2. Securing Routes by Role
Pass roles allowed to access specific endpoints into `authorizeRoles`:

```javascript
const { protect, authorizeRoles } = require('../middleware/auth');

// Only Vendors can create products
router.post('/products', protect, authorizeRoles('vendor'), createProduct);

// Only Super Admins can fetch platform metrics
router.get('/admin/analytics', protect, authorizeRoles('superadmin'), getAdminAnalytics);
```

### 3. Blocking Suspended or Pending Accounts
Add `checkAccountStatus` to ensure deactivated or pending vendors cannot access routes:

```javascript
const { protect, checkAccountStatus } = require('../middleware/auth');

router.get('/vendor/profile', protect, checkAccountStatus, getVendorProfile);
```
