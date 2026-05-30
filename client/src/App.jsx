import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from './store/slices/authSlice';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import CustomerRegister from './pages/CustomerRegister';
import VendorRegister from './pages/VendorRegister';
import CustomerHome from './pages/CustomerHome';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  // On app load, if token exists, fetch user profile to restore session
  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(getMe());
    }
  }, [token, isAuthenticated, dispatch]);

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/register" element={<CustomerRegister />} />
          <Route path="/vendor/register" element={<VendorRegister />} />

          {/* Protected Routes */}
          <Route
            path="/shop"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <VendorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
