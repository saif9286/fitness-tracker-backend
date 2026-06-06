import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.warning('Please fill in all fields');

    setLoading(true);
    try {
      const result = await login(email, password);
      toast.success(`Welcome back, ${result.user.name}!`);
      navigate(result.hasProfile ? '/' : '/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleResponse = useCallback(async (response) => {
    setLoading(true);
    try {
      const result = await googleLogin(response.credential);
      toast.success(`Welcome back, ${result.user.name}!`);
      navigate(result.hasProfile ? '/' : '/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  }, [googleLogin, toast, navigate]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      itp_support: true,
    });

    const btnContainer = document.getElementById('google-login-btn');
    if (btnContainer) {
      window.google.accounts.id.renderButton(btnContainer, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        shape: 'rectangular',
      });
    }
  }, [handleGoogleResponse]);

  return (
    <div className="auth-layout">
      {/* Visual Side */}
      <div className="auth-visual">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=1600&fit=crop&q=80"
          alt="Gym equipment"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div className="auth-visual-overlay" />
        <div className="auth-visual-content">
          <h1>Track your fuel.<br />Own your gains.</h1>
          <p>The smart way to track protein, plan meals, and crush your fitness goals.</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-container">
        <div className="auth-form-wrapper">
          <div className="auth-brand">
            <h2>Fuel<span>Track</span></h2>
          </div>

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue tracking your progress</p>

          {/* Google Sign-In Button */}
          {GOOGLE_CLIENT_ID && (
            <>
              <div id="google-login-btn" style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'center' }} />
              <div className="auth-divider">
                <span>or sign in with email</span>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" htmlFor="login-password" style={{ marginBottom: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '14px', color: 'var(--accent-cool)', fontWeight: '500' }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: '48px' }}
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

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ marginTop: 'var(--space-2)', padding: '14px' }}
            >
              {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
