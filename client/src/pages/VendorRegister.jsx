import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { registerVendor, clearError, clearMessage } from '../store/slices/authSlice';
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineUser,
  HiOutlineOfficeBuilding,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const VendorRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessDescription: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const dispatch = useDispatch();
  const { isLoading, error, message } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (message && !error) {
      setSubmitted(true);
      dispatch(clearMessage());
    }
  }, [message, error, dispatch]);

  // Client-side validation (PRD Section 4.2)
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Owner full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.businessName.trim()) {
      errors.businessName = 'Business name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      const { confirmPassword, ...submitData } = formData;
      dispatch(registerVendor(submitData));
    }
  };

  // Show success message after submission
  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card fade-in">
          <div className="success-container">
            <HiOutlineCheckCircle className="success-icon" />
            <h2 className="auth-title">Application Submitted!</h2>
            <p className="success-message">
              Your vendor application is under review. You will be notified via
              email upon approval. This process typically takes 1-2 business days.
            </p>
            <Link to="/login" className="btn btn-primary btn-block">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <HiOutlineOfficeBuilding className="vendor-building-icon" />
          </div>
          <h2 className="auth-title">Vendor Registration</h2>
          <p className="auth-subtitle">
            Apply to sell on the OnShop platform
          </p>
        </div>

        <form onSubmit={handleSubmit} id="vendor-register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="vendor-name" className="form-label">
                Owner Full Name
              </label>
              <div className="input-wrapper">
                <HiOutlineUser className="input-icon" />
                <input
                  type="text"
                  id="vendor-name"
                  name="name"
                  className={`form-input ${formErrors.name ? 'error' : ''}`}
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              {formErrors.name && (
                <span className="form-error">{formErrors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="vendor-business" className="form-label">
                Business Name
              </label>
              <div className="input-wrapper">
                <HiOutlineOfficeBuilding className="input-icon" />
                <input
                  type="text"
                  id="vendor-business"
                  name="businessName"
                  className={`form-input ${formErrors.businessName ? 'error' : ''}`}
                  placeholder="Your business name"
                  value={formData.businessName}
                  onChange={handleChange}
                />
              </div>
              {formErrors.businessName && (
                <span className="form-error">{formErrors.businessName}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="vendor-email" className="form-label">
              Email Address
            </label>
            <div className="input-wrapper">
              <HiOutlineMail className="input-icon" />
              <input
                type="email"
                id="vendor-email"
                name="email"
                className={`form-input ${formErrors.email ? 'error' : ''}`}
                placeholder="business@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            {formErrors.email && (
              <span className="form-error">{formErrors.email}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="vendor-password" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <HiOutlineLockClosed className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="vendor-password"
                  name="password"
                  className={`form-input ${formErrors.password ? 'error' : ''}`}
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={handleChange}
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

            <div className="form-group">
              <label htmlFor="vendor-confirm-password" className="form-label">
                Confirm Password
              </label>
              <div className="input-wrapper">
                <HiOutlineLockClosed className="input-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="vendor-confirm-password"
                  name="confirmPassword"
                  className={`form-input ${formErrors.confirmPassword ? 'error' : ''}`}
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <span className="form-error">{formErrors.confirmPassword}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="vendor-description" className="form-label">
              Business Description{' '}
              <span className="label-optional">(optional)</span>
            </label>
            <div className="input-wrapper">
              <HiOutlineDocumentText className="input-icon input-icon-top" />
              <textarea
                id="vendor-description"
                name="businessDescription"
                className="form-input form-textarea"
                placeholder="Tell us about your business..."
                value={formData.businessDescription}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          <div className="alert alert-info">
            <strong>Note:</strong> Vendor accounts require admin approval.
            You will receive an email once your application is reviewed.
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
            id="vendor-register-submit-btn"
          >
            {isLoading ? (
              <>
                <span className="spinner spinner-sm"></span>
                <span>Submitting application...</span>
              </>
            ) : (
              'Submit Application'
            )}
          </button>
        </form>

        <div className="form-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="form-link">
              Sign In
            </Link>
          </p>
          <p>
            Not a business?{' '}
            <Link to="/register" className="form-link">
              Register as Customer
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorRegister;
