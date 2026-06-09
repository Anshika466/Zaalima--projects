import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff,
  HiOutlineCheckCircle, HiOutlineKey,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../utils/axios';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return toast.error('Enter a valid email');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        toast.success('OTP sent to your email!');
        setStep(2);
        setResendTimer(60);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return toast.error('Enter 6-digit OTP');
    setLoading(true);
    try {
      const res = await api.post('/otp/verify', { email, otp, purpose: 'forgot-password' });
      if (res.data.success) {
        toast.success('OTP verified!');
        setStep(3);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { email, otp, newPassword });
      if (res.data.success) {
        setDone(true);
        toast.success('Password reset successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP resent!');
      setResendTimer(60);
    } catch (err) {
      toast.error('Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  // ── SUCCESS ──
  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card fade-in">
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <HiOutlineCheckCircle style={{ fontSize: '3.5rem', color: 'var(--success)', marginBottom: '1rem' }} />
            <h2 className="auth-title">Password Reset!</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
              Your password has been changed. You can now log in with your new password.
            </p>
            <button className="btn btn-primary btn-block" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <HiOutlineKey style={{ fontSize: '2rem', color: 'var(--primary)' }} />
          </div>
          <h2 className="auth-title">
            {step === 1 ? 'Forgot Password' : step === 2 ? 'Enter OTP' : 'New Password'}
          </h2>
          <p className="auth-subtitle">
            {step === 1
              ? 'Enter your email to receive a reset code'
              : step === 2
              ? 'Check your email for the verification code'
              : 'Choose a strong new password'}
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: '1.5rem' }}>
          {[1, 2, 3].map((s, idx) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: step >= s ? 'var(--primary)' : 'var(--gray-200)',
                color: step >= s ? '#fff' : 'var(--gray-400)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700,
              }}>
                {step > s ? '✓' : s}
              </div>
              {idx < 2 && <div style={{ width: '40px', height: '2px', background: step > s ? 'var(--primary)' : 'var(--gray-200)' }} />}
            </div>
          ))}
        </div>

        {/* STEP 1 — Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <HiOutlineMail className="input-icon" />
                <input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <><span className="spinner spinner-sm" /> Sending...</> : 'Send Reset Code'}
            </button>
          </form>
        )}

        {/* STEP 2 — OTP */}
        {step === 2 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'var(--primary-bg)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Code sent to</p>
              <p style={{ fontWeight: 700, color: 'var(--secondary)' }}>{email}</p>
            </div>

            <div className="form-group">
              <input
                type="text" className="form-input" placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 700 }}
                autoFocus
              />
            </div>

            <button className="btn btn-primary btn-block" onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} style={{ marginTop: '0.5rem' }}>
              {loading ? <><span className="spinner spinner-sm" /> Verifying...</> : 'Verify Code'}
            </button>

            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={handleResend}
                disabled={resendTimer > 0 || loading}
                style={{ background: 'none', border: 'none', cursor: resendTimer > 0 ? 'default' : 'pointer', color: resendTimer > 0 ? 'var(--gray-400)' : 'var(--primary)', fontSize: '0.85rem' }}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="input-wrapper">
                <HiOutlineLockClosed className="input-icon" />
                <input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Minimum 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div className="input-wrapper">
                <HiOutlineLockClosed className="input-icon" />
                <input type="password" className="form-input" placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <><span className="spinner spinner-sm" /> Resetting...</> : <><HiOutlineCheckCircle /> Reset Password</>}
            </button>
          </form>
        )}

        <div className="form-footer" style={{ marginTop: '1.5rem' }}>
          <p><Link to="/login" className="form-link">← Back to Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
