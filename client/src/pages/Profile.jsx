import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineUser, HiOutlinePencil, HiOutlineCheckCircle,
  HiOutlineLockClosed, HiOutlineMail, HiOutlineEye, HiOutlineEyeOff,
} from 'react-icons/hi';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Edit profile
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [saving, setSaving] = useState(false);

  // Change password
  const [showPassSection, setShowPassSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurPass, setShowCurPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // Change email
  const [showEmailSection, setShowEmailSection] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name cannot be empty');
    setSaving(true);
    try {
      const res = await api.patch('/auth/profile', {
        name,
        ...(user?.role === 'vendor' && { businessName }),
      });
      if (res.data.success) {
        dispatch(setUser(res.data.user));
        toast.success('Profile updated!');
        setEditMode(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setChangingPass(true);
    try {
      const res = await api.patch('/auth/change-password', { currentPassword, newPassword });
      if (res.data.success) {
        toast.success('Password changed successfully!');
        setShowPassSection(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setChangingPass(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail)) return toast.error('Enter a valid email');
    setSendingEmailOtp(true);
    try {
      const res = await api.post('/auth/change-email/request', { newEmail });
      if (res.data.success) {
        toast.success('OTP sent to your current email!');
        setEmailOtpSent(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleConfirmEmailChange = async () => {
    if (emailOtp.length !== 6) return toast.error('Enter 6-digit OTP');
    setChangingEmail(true);
    try {
      const res = await api.post('/auth/change-email/confirm', { otp: emailOtp, newEmail });
      if (res.data.success) {
        dispatch(setUser(res.data.user));
        toast.success('Email updated successfully!');
        setShowEmailSection(false);
        setNewEmail('');
        setEmailOtp('');
        setEmailOtpSent(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email change failed');
    } finally {
      setChangingEmail(false);
    }
  };

  const getRoleColor = (role) => {
    if (role === 'superadmin') return { bg: '#FEF3C7', color: '#92400E' };
    if (role === 'vendor') return { bg: '#DBEAFE', color: '#1E40AF' };
    return { bg: '#D1FAE5', color: '#065F46' };
  };

  const roleStyle = getRoleColor(user?.role);

  return (
    <div className="dashboard-page">
      <div className="page-container" style={{ maxWidth: '680px', margin: '2rem auto' }}>
        <div className="dashboard-header">
          <h1 className="dashboard-title">My Profile</h1>
          {!editMode && (
            <button className="btn btn-outline btn-sm" onClick={() => setEditMode(true)}>
              <HiOutlinePencil /> Edit Profile
            </button>
          )}
        </div>

        {/* ─── Profile Card ─── */}
        <div className="stat-card fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.75rem', color: 'var(--primary)', flexShrink: 0,
            }}>
              <HiOutlineUser />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary)' }}>{user?.name}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{user?.email}</p>
              <span style={{
                display: 'inline-block', marginTop: '0.35rem',
                background: roleStyle.bg, color: roleStyle.color,
                padding: '0.15rem 0.65rem', borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize',
              }}>
                {user?.role}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', flex: 1, minWidth: '140px' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', textTransform: 'uppercase', fontWeight: 600 }}>Account Status</p>
              <p style={{ fontWeight: 700, marginTop: '0.25rem', color: user?.status === 'active' ? 'var(--success)' : 'var(--danger)', textTransform: 'capitalize' }}>
                {user?.status === 'active' ? '✓ Active' : user?.status}
              </p>
            </div>
            {user?.businessName && (
              <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', flex: 1, minWidth: '140px' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', textTransform: 'uppercase', fontWeight: 600 }}>Business Name</p>
                <p style={{ fontWeight: 700, marginTop: '0.25rem' }}>{user?.businessName}</p>
              </div>
            )}
          </div>

          {/* Edit Name */}
          {editMode ? (
            <form onSubmit={handleSave} style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              {user?.role === 'vendor' && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Business Name</label>
                  <input type="text" className="form-input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setEditMode(false); setName(user?.name); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? <><span className="spinner spinner-sm" /> Saving...</> : <><HiOutlineCheckCircle /> Save</>}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                ℹ️ Click <strong>Edit Profile</strong> to update your name{user?.role === 'vendor' ? ' or business name' : ''}.
              </p>
            </div>
          )}
        </div>

        {/* ─── Change Password ─── */}
        <div className="stat-card fade-in" style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HiOutlineLockClosed style={{ color: 'var(--primary)' }} /> Change Password
            </h3>
            {!showPassSection && (
              <button className="btn btn-outline btn-sm" onClick={() => setShowPassSection(true)}>Change</button>
            )}
          </div>

          {showPassSection && (
            <form onSubmit={handleChangePassword} style={{ marginTop: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Current Password *</label>
                <div className="input-wrapper">
                  <HiOutlineLockClosed className="input-icon" />
                  <input type={showCurPass ? 'text' : 'password'} className="form-input" placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                  <button type="button" className="password-toggle" onClick={() => setShowCurPass(!showCurPass)} tabIndex={-1}>
                    {showCurPass ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label className="form-label">New Password *</label>
                <div className="input-wrapper">
                  <HiOutlineLockClosed className="input-icon" />
                  <input type={showNewPass ? 'text' : 'password'} className="form-input" placeholder="Min 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
                  <button type="button" className="password-toggle" onClick={() => setShowNewPass(!showNewPass)} tabIndex={-1}>
                    {showNewPass ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label className="form-label">Confirm New Password *</label>
                <div className="input-wrapper">
                  <HiOutlineLockClosed className="input-icon" />
                  <input type="password" className="form-input" placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setShowPassSection(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={changingPass}>
                  {changingPass ? <><span className="spinner spinner-sm" /> Changing...</> : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ─── Change Email ─── */}
        <div className="stat-card fade-in" style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HiOutlineMail style={{ color: 'var(--primary)' }} /> Change Email
            </h3>
            {!showEmailSection && (
              <button className="btn btn-outline btn-sm" onClick={() => setShowEmailSection(true)}>Change</button>
            )}
          </div>

          {showEmailSection && (
            <div style={{ marginTop: '1.25rem' }}>
              {!emailOtpSent ? (
                // Step 1: Enter new email
                <>
                  <div className="form-group">
                    <label className="form-label">Current Email</label>
                    <input type="email" className="form-input" value={user?.email} disabled style={{ background: 'var(--gray-50)', color: 'var(--gray-400)' }} />
                  </div>
                  <div className="form-group" style={{ marginTop: '0.75rem' }}>
                    <label className="form-label">New Email *</label>
                    <div className="input-wrapper">
                      <HiOutlineMail className="input-icon" />
                      <input type="email" className="form-input" placeholder="new@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="alert alert-info" style={{ marginTop: '0.75rem' }}>
                    An OTP will be sent to your <strong>current email</strong> ({user?.email}) for verification.
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setShowEmailSection(false); setNewEmail(''); }}>Cancel</button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSendEmailOtp} disabled={sendingEmailOtp}>
                      {sendingEmailOtp ? <><span className="spinner spinner-sm" /> Sending...</> : 'Send OTP'}
                    </button>
                  </div>
                </>
              ) : (
                // Step 2: Verify OTP
                <div style={{ textAlign: 'center' }}>
                  <div style={{ background: 'var(--primary-bg)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>OTP sent to your current email</p>
                    <p style={{ fontWeight: 700, color: 'var(--secondary)' }}>{user?.email}</p>
                  </div>
                  <div className="form-group">
                    <input
                      type="text" className="form-input" placeholder="Enter 6-digit OTP"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 700 }}
                      autoFocus
                    />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', margin: '0.5rem 0' }}>
                    New email: <strong>{newEmail}</strong>
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setEmailOtpSent(false); setEmailOtp(''); }}>Back</button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConfirmEmailChange} disabled={changingEmail || emailOtp.length !== 6}>
                      {changingEmail ? <><span className="spinner spinner-sm" /> Updating...</> : <><HiOutlineCheckCircle /> Confirm</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
