import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginAdmin, clearError, clearMessage } from '../store/slices/authSlice';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineShieldCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user, message } = useSelector(
    (state) => state.auth
  );

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (isAuthenticated && user?.role === 'superadmin') {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (message && isAuthenticated) {
      toast.success(message);
      dispatch(clearMessage());
    }
  }, [message, isAuthenticated, dispatch]);

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: '' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      dispatch(loginAdmin(formData));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <HiOutlineShieldCheck className="admin-shield-icon" />
          </div>
          <h2 className="auth-title">Admin Access</h2>
          <p className="auth-subtitle">
            Restricted area — Authorized personnel only
          </p>
        </div>

        <form onSubmit={handleSubmit} id="admin-login-form">
          <div className="form-group">
            <label htmlFor="admin-email" className="form-label">
              Admin Email
            </label>
            <div className="input-wrapper">
              <HiOutlineMail className="input-icon" />
              <input
                type="email"
                id="admin-email"
                name="email"
                className={`form-input ${formErrors.email ? 'error' : ''}`}
                placeholder="admin@onshop.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
            {formErrors.email && (
              <span className="form-error">{formErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="admin-password" className="form-label">
              Password
            </label>
            <div className="input-wrapper">
              <HiOutlineLockClosed className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="admin-password"
                name="password"
                className={`form-input ${formErrors.password ? 'error' : ''}`}
                placeholder="Enter admin password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
            </div>
            {formErrors.password && (
              <span className="form-error">{formErrors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-secondary btn-block"
            disabled={isLoading}
            id="admin-login-submit-btn"
          >
            {isLoading ? (
              <>
                <span className="spinner spinner-sm"></span>
                <span>Verifying...</span>
              </>
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>

        <div className="form-footer">
          <p className="text-muted">
            This login is for platform administrators only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
