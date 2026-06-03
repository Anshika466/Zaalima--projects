# 🚀 Authentication & RBAC Module — Walkthrough

We have successfully resolved the connection issues, seeded the default Super Admin account under the **OnShop** branding, and verified that both the Node.js/Express backend and Vite/React frontend are fully running!

Below is the complete walkthrough of what has been built, how to access the dashboards, and the step-by-step testing flows.

---

## 🛠️ What We Did Just Now

1. **Fixed MongoDB Connection**:
   - The connection was failing due to an incorrect replica set name in the old non-SRV string and a DNS SRV lookup failure on the local DNS resolver.
   - We updated `server/.env` to use the direct connection string with the correct replica set name (`replicaSet=atlas-11327l-shard-0`), which successfully bypassed the DNS SRV limitation.
2. **Seeded the Super Admin**:
   - Ran `seedAdmin.js`, which successfully created the default Admin user in your database under the new email `admin@onshop.com`.
3. **Started Both Servers**:
   - **Backend API**: Running at [http://localhost:5000](http://localhost:5000) (connected to MongoDB Atlas)
   - **Frontend App**: Running at [http://localhost:5173](http://localhost:5173)

---

## 🔑 Default Credentials

Here is your login info to start testing the dashboards immediately:

### 1. Super Admin (Pre-seeded)
- **Login URL**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login) (Separate admin portal)
- **Email**: `admin@onshop.com`
- **Password**: `Admin@123456`
- **Role**: `superadmin`

### 2. Customers (Create via UI)
- **Register URL**: [http://localhost:5173/register](http://localhost:5173/register)
- **Role**: `customer` (Redirects to `/shop` upon successful login)

### 3. Vendors (Create via UI)
- **Register URL**: [http://localhost:5173/vendor/register](http://localhost:5173/vendor/register)
- **Role**: `vendor` (Starts as `pending` status; requires Admin approval before they can log in!)

---

## 🧪 Step-by-Step Testing Flow

Open your browser at [http://localhost:5173/](http://localhost:5173/) and perform the following verification:

### Flow A: Register and Test a Customer
1. Go to [http://localhost:5173/register](http://localhost:5173/register).
2. Register a new customer (e.g., `customer@example.com` / `Password@123`).
3. You will be automatically redirected to the **Customer Shop Home Page** (`/shop`).
4. Log out.

### Flow B: Register a Vendor & Approve via Super Admin
1. Go to [http://localhost:5173/vendor/register](http://localhost:5173/vendor/register).
2. Register a new vendor (e.g., `vendor@example.com` / `Password@123` / Store: `My Store`).
3. After registration, try logging in with this vendor account. **It should fail or show a message** that the account is "pending approval" (as per security rules).
4. Go to [http://localhost:5173/admin/login](http://localhost:5173/admin/login).
5. Log in with the pre-seeded **Super Admin** credentials (`admin@onshop.com` / `Admin@123456`).
6. You will see the **Admin Dashboard** listing all registered users and pending vendors.
7. Locate your newly registered vendor and click **"Approve"**. The vendor's status will change from `pending` to `active`.
8. Log out of the Admin panel.
9. Go back to [http://localhost:5173/login](http://localhost:5173/login).
10. Log in with the approved vendor account. You will now be successfully logged in and redirected to the **Vendor Dashboard** (`/vendor/dashboard`).

### Flow C: RBAC Security Guard Test
1. While logged in as a Customer, try to manually visit [http://localhost:5173/vendor/dashboard](http://localhost:5173/vendor/dashboard) or `/admin/dashboard`.
2. The router's `ProtectedRoute` will intercept this and redirect you back to `/shop`, completely protecting unauthorized pages!

---

## 📂 Architecture and Features Built

### Backend Features (`server/`)
* **Stateless JWT Session Management**:
  * Role-based token expiry (7 days for Customers, 24 hours for Vendors & Admins).
  * JWT verification and role authorization middleware.
* **Security & Defense**:
  * **Helmet.js**: Sets security-related HTTP headers.
  * **CORS**: Configured specifically to only trust your frontend port.
  * **Rate Limiter**: Blocks brute force logins (max 10 requests per 15 minutes per IP).
  * **Input Validation**: Mongoose schema and `express-validator` prevent bad data injection.

### Frontend Features (`client/`)
* **Global Redux Store**:
  * Persistent slice for auth state (restores token automatically on page refresh).
* **Route Guards**:
  * Dynamic navigation and path protection via custom `<ProtectedRoute>` component.
* **Rich UI Elements**:
  * Polished pages with vanilla CSS styles, dynamic status badges, error handling notifications, loading spinners, and layout consistency.
