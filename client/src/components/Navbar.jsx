import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import {
  HiOutlineLogout, HiOutlineUser, HiOutlineMenu, HiOutlineX,
  HiOutlineShoppingCart, HiOutlineClipboardList, HiOutlineHome,
} from 'react-icons/hi';
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
    setMobileMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'superadmin') return '/admin/dashboard';
    if (user.role === 'vendor') return '/vendor/dashboard';
    return '/shop';
  };

  const getRoleBadgeClass = () => {
    if (!user) return '';
    if (user.role === 'superadmin') return 'role-badge-admin';
    if (user.role === 'vendor') return 'role-badge-vendor';
    return 'role-badge-customer';
  };

  const closeMobile = () => setMobileMenuOpen(false);

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
                <HiOutlineHome style={{ marginRight: '0.25rem' }} />
                {user?.role === 'customer' ? 'Shop' : 'Dashboard'}
              </Link>

              {user?.role === 'customer' && (
                <>
                  <Link to="/orders" className="nav-link">
                    <HiOutlineClipboardList style={{ marginRight: '0.25rem' }} />
                    My Orders
                  </Link>
                  <Link to="/wishlist" className="nav-link" title="Wishlist">
                    ❤️
                  </Link>
                  <Link to="/checkout" className="nav-cart-btn" title="View Cart">
                    <HiOutlineShoppingCart />
                    {totalQuantity > 0 && <span className="cart-badge">{totalQuantity}</span>}
                  </Link>
                </>
              )}

              <Link to="/profile" className="nav-link">
                <HiOutlineUser style={{ marginRight: '0.25rem' }} />
                Profile
              </Link>

              <div className="nav-user-info">
                <span className="nav-user-name">{user?.name}</span>
                <span className={`role-badge ${getRoleBadgeClass()}`}>{user?.role}</span>
              </div>

              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                <HiOutlineLogout />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <HiOutlineX /> : <HiOutlineMenu />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          {isAuthenticated ? (
            <>
              <div className="mobile-user-info">
                <HiOutlineUser />
                <span>{user?.name}</span>
                <span className={`role-badge ${getRoleBadgeClass()}`}>{user?.role}</span>
              </div>
              <Link to={getDashboardLink()} className="mobile-link" onClick={closeMobile}>
                {user?.role === 'customer' ? 'Shop' : 'Dashboard'}
              </Link>
              {user?.role === 'customer' && (
                <>
                  <Link to="/orders" className="mobile-link" onClick={closeMobile}>
                    My Orders
                  </Link>
                  <Link to="/wishlist" className="mobile-link" onClick={closeMobile}>
                    ❤️ Wishlist
                  </Link>
                  <Link to="/checkout" className="mobile-link" onClick={closeMobile}>
                    Cart {totalQuantity > 0 && `(${totalQuantity})`}
                  </Link>
                </>
              )}
              <Link to="/profile" className="mobile-link" onClick={closeMobile}>Profile</Link>
              <button onClick={handleLogout} className="mobile-link logout-link">
                <HiOutlineLogout /><span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-link" onClick={closeMobile}>Login</Link>
              <Link to="/register" className="mobile-link" onClick={closeMobile}>Register as Customer</Link>
              <Link to="/vendor/register" className="mobile-link" onClick={closeMobile}>Register as Vendor</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
