import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * ProtectedRoute Component (PRD Section 4.5)
 *
 * Wraps authenticated pages. Checks JWT and role.
 * - Unauthenticated users → /login
 * - Wrong role → redirects to their correct home page
 *
 * @param {React.ReactNode} children - Page component to render
 * @param {string[]} allowedRoles - Roles permitted to access this route
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);

  // Not authenticated → redirect to login
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is in the allowed roles
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to their correct home page based on role
    const roleRedirects = {
      customer: '/shop',
      vendor: '/vendor/dashboard',
      superadmin: '/admin/dashboard',
    };

    const redirectPath = roleRedirects[user?.role] || '/login';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
