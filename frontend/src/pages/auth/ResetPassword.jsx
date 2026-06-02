import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error('Reset token is missing from the URL.');
    if (!password || !confirmPassword) return toast.warning('Please fill in all fields.');
    if (password.length < 6) return toast.warning('Password must be at least 6 characters.');
    if (password !== confirmPassword) return toast.error('Passwords do not match.');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password });
      toast.success(data.message || 'Password reset successful!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-layout">
        <div className="auth-form-container" style={{ width: '100%', maxWidth: '480px', margin: 'auto' }}>
          <div className="auth-form-wrapper" style={{ textAlign: 'center' }}>
            <h1 className="auth-title">Invalid Reset Link</h1>
            <p className="auth-subtitle">No reset token was found in the link you followed. Please request a new link.</p>
            <Link to="/forgot-password" className="btn btn-primary w-full" style={{ marginTop: 'var(--space-2)' }}>
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-layout">
      {/* Visual Side */}
      <div className="auth-visual">
        <img
          src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1200&h=1600&fit=crop&q=80"
          alt="Fitness focus"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div className="auth-visual-overlay" />
        <div className="auth-visual-content">
          <h1>Securing your account.<br />Powering your workouts.</h1>
          <p>Create a strong password to keep your profile, workouts, and nutrition logs secure.</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-container">
        <div className="auth-form-wrapper">
          <div className="auth-brand">
            <h2>Fuel<span>Track</span></h2>
          </div>

          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Please enter your new password below.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-new-password">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reset-new-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '40px', paddingRight: '48px' }}
                />
                <Lock 
                  size={18} 
                  style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--text-tertiary)' 
                  }} 
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-tertiary)',
                  }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-confirm-password">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reset-confirm-password"
                  type={showConfirmPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '40px', paddingRight: '48px' }}
                />
                <Lock 
                  size={18} 
                  style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--text-tertiary)' 
                  }} 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-tertiary)',
                  }}
                >
                  {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ marginTop: 'var(--space-2)', padding: '14px' }}
            >
              {loading ? (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              ) : (
                <>Reset Password <ArrowRight size={18} style={{ marginLeft: '8px' }} /></>
              )}
            </button>
          </form>

          <p className="auth-footer" style={{ marginTop: 'var(--space-4)' }}>
            Remembered your password? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
