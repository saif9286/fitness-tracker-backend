import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.warning('Please enter your email address');

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('Instructions sent! Check your email or backend console.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Visual Side */}
      <div className="auth-visual">
        <img
          src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&h=1600&fit=crop&q=80"
          alt="Athlete training"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div className="auth-visual-overlay" />
        <div className="auth-visual-content">
          <h1>Reset your password.<br />Get back on track.</h1>
          <p>Don't let a forgotten password stop your momentum. Get back to tracking in seconds.</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-container">
        <div className="auth-form-wrapper">
          <div className="auth-brand">
            <h2>Fuel<span>Track</span></h2>
          </div>

          <h1 className="auth-title">Forgot Password?</h1>
          
          {!submitted ? (
            <>
              <p className="auth-subtitle">Enter your email and we'll send you a link to reset your password.</p>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="forgot-email">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="forgot-email"
                      type="email"
                      className="form-input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      style={{ paddingLeft: '40px' }}
                    />
                    <Mail 
                      size={18} 
                      style={{ 
                        position: 'absolute', 
                        left: '12px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: 'var(--text-tertiary)' 
                      }} 
                    />
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
                    <>Send Reset Link <Send size={18} style={{ marginLeft: '8px' }} /></>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(var(--primary-rgb), 0.1)', 
                color: 'var(--primary-color)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: 'var(--space-3)'
              }}>
                <Send size={32} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>Check Your Email</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: 'var(--space-4)' }}>
                If an account exists for <strong>{email}</strong>, we have sent instructions to reset your password. 
                <br /><br />
                <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                  (During local development, you can find the link directly in your backend terminal console!)
                </span>
              </p>
              <button 
                onClick={() => setSubmitted(false)} 
                className="btn btn-secondary w-full"
                style={{ padding: '12px' }}
              >
                Resend link
              </button>
            </div>
          )}

          <p className="auth-footer" style={{ marginTop: 'var(--space-4)' }}>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
