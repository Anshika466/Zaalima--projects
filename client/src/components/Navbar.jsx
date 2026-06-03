import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import { HiOutlineLogout, HiOutlineUser, HiOutlineMenu, HiOutlineX, HiOutlineShoppingCart } from 'react-icons/hi';
import { useState } from 'react';

const Navbar = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { totalQuantity } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  // Determine dashboard link based on role
  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'superadmin':
        return '/admin/dashboard';
      case 'vendor':
        return '/vendor/dashboard';
      case 'customer':
        return '/shop';
      default:
        return '/login';
    }
  };

  // Get role badge color
  const getRoleBadgeClass = () => {
    if (!user) return '';
    switch (user.role) {
      case 'superadmin':
        return 'role-badge-admin';
      case 'vendor':
        return 'role-badge-vendor';
      case 'customer':
        return 'role-badge-customer';
      default:
        return '';
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">O</span>
          <span className="logo-text">OnShop</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <Link to={getDashboardLink()} className="nav-link">
                Dashboard
              </Link>
              {user?.role === 'customer' && (
                <Link to="/checkout" className="nav-cart-btn" title="View Cart">
                  <HiOutlineShoppingCart />
                  {totalQuantity > 0 && (
                    <span className="cart-badge">{totalQuantity}</span>
                  )}
                </Link>
              )}
              <div className="nav-user-info">
                <HiOutlineUser className="nav-user-icon" />
                <span className="nav-user-name">{user?.name}</span>
                <span className={`role-badge ${getRoleBadgeClass()}`}>
                  {user?.role}
                </span>
              </div>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                <HiOutlineLogout />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <HiOutlineX /> : <HiOutlineMenu />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          {isAuthenticated ? (
            <>
              <div className="mobile-user-info">
                <HiOutlineUser />
                <span>{user?.name}</span>
                <span className={`role-badge ${getRoleBadgeClass()}`}>
                  {user?.role}
                </span>
              </div>
              <Link
                to={getDashboardLink()}
                className="mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="mobile-link logout-link"
              >
                <HiOutlineLogout />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
              <Link
                to="/vendor/register"
                className="mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register as Vendor
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
