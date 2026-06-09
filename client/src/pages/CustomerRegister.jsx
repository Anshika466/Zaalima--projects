import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerCustomer, clearError, clearMessage } from '../store/slices/authSlice';
import {
  HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff,
  HiOutlineUser, HiOutlineCheckCircle,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../utils/axios';

const CustomerRegister = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // OTP state
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      toast.success('Registration successful!');
      navigate('/shop');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    else if (formData.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Please enter a valid email';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) setFormErrors({ ...formErrors, [e.target.name]: '' });
  };

  const handleSendOtp = async () => {
    if (!validateForm()) return;
    setOtpSending(true);
    try {
      const res = await api.post('/otp/send', { email: formData.email, purpose: 'register' });
      if (res.data.success) {
        toast.success('OTP sent to your email!');
        setOtpStep(true);
        setResendTimer(60);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return toast.error('Enter 6-digit OTP');
    setOtpVerifying(true);
    try {
      const res = await api.post('/otp/verify', { email: formData.email, otp, purpose: 'register' });
      if (res.data.success) {
        setOtpVerified(true);
        toast.success('Email verified! Creating account...');
        // Now register
        const { confirmPassword, ...submitData } = formData;
        dispatch(registerCustomer(submitData));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setOtpSending(true);
    try {
      await api.post('/otp/send', { email: formData.email, purpose: 'register' });
      toast.success('OTP resent!');
      setResendTimer(60);
    } catch (err) {
      toast.error('Failed to resend OTP');
    } finally {
      setOtpSending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon logo-icon-lg">O</span>
          </div>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">
            {otpStep ? 'Verify your email to complete registration' : 'Join OnShop to start shopping'}
          </p>
        </div>

        {/* OTP STEP */}
        {otpStep ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'var(--primary-bg)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.5rem' }}>
              <HiOutlineMail style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                We sent a 6-digit code to
              </p>
              <p style={{ fontWeight: 700, color: 'var(--secondary)' }}>{formData.email}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Enter OTP Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 700 }}
                autoFocus
              />
            </div>

            <button
              className="btn btn-primary btn-block"
              onClick={handleVerifyOtp}
              disabled={otpVerifying || otp.length !== 6}
              style={{ marginTop: '1rem' }}
            >
              {otpVerifying ? <><span className="spinner spinner-sm" /> Verifying...</> : <><HiOutlineCheckCircle /> Verify & Register</>}
            </button>

            <div style={{ marginTop: '1rem' }}>
              <button
                className="form-link"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || otpSending}
                style={{ background: 'none', border: 'none', cursor: resendTimer > 0 ? 'default' : 'pointer', color: resendTimer > 0 ? 'var(--gray-400)' : 'var(--primary)' }}
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>

            <button
              className="form-link"
              onClick={() => { setOtpStep(false); setOtp(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.5rem', color: 'var(--gray-500)', fontSize: '0.85rem' }}
            >
              ← Back to form
            </button>
          </div>
        ) : (
          /* REGISTRATION FORM */
          <>
            <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} id="customer-register-form">
              <div className="form-group">
                <label htmlFor="register-name" className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <HiOutlineUser className="input-icon" />
                  <input type="text" id="register-name" name="name" className={`form-input ${formErrors.name ? 'error' : ''}`} placeholder="John Doe" value={formData.name} onChange={handleChange} autoComplete="name" />
                </div>
                {formErrors.name && <span className="form-error">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="register-email" className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <HiOutlineMail className="input-icon" />
                  <input type="email" id="register-email" name="email" className={`form-input ${formErrors.email ? 'error' : ''}`} placeholder="you@example.com" value={formData.email} onChange={handleChange} autoComplete="email" />
                </div>
                {formErrors.email && <span className="form-error">{formErrors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="register-password" className="form-label">Password</label>
                <div className="input-wrapper">
                  <HiOutlineLockClosed className="input-icon" />
                  <input type={showPassword ? 'text' : 'password'} id="register-password" name="password" className={`form-input ${formErrors.password ? 'error' : ''}`} placeholder="Minimum 8 characters" value={formData.password} onChange={handleChange} autoComplete="new-password" />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
                {formErrors.password && <span className="form-error">{formErrors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="register-confirm-password" className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <HiOutlineLockClosed className="input-icon" />
                  <input type={showConfirmPassword ? 'text' : 'password'} id="register-confirm-password" name="confirmPassword" className={`form-input ${formErrors.confirmPassword ? 'error' : ''}`} placeholder="Re-enter your password" value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                    {showConfirmPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
                {formErrors.confirmPassword && <span className="form-error">{formErrors.confirmPassword}</span>}
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={otpSending || isLoading} id="customer-register-submit-btn">
                {otpSending ? <><span className="spinner spinner-sm" /> Sending OTP...</> : 'Verify Email & Register'}
              </button>
            </form>

            <div className="form-footer">
              <p>Already have an account? <Link to="/login" className="form-link">Sign In</Link></p>
              <p>Are you a business? <Link to="/vendor/register" className="form-link">Register as Vendor</Link></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerRegister;
