import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup, googleLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const passwordChecks = [
    { label: 'At least 6 characters', valid: password.length >= 6 },
    { label: 'Contains a number', valid: /\d/.test(password) },
    { label: 'Contains a letter', valid: /[a-zA-Z]/.test(password) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.warning('Please fill in all fields');
    if (password.length < 6) return toast.warning('Password must be at least 6 characters');

    setLoading(true);
    try {
      const result = await signup(name, email, password);
      if (result.autoLoggedIn) {
        toast.success('Account created successfully! Welcome aboard!');
        navigate('/onboarding');
      } else {
        toast.success('Account created! Please check your email to verify your account.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleResponse = useCallback(async (response) => {
    setLoading(true);
    try {
      const result = await googleLogin(response.credential);
      toast.success(`Welcome, ${result.user.name}!`);
      navigate(result.hasProfile ? '/' : '/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-up failed');
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

    const btnContainer = document.getElementById('google-signup-btn');
    if (btnContainer) {
      window.google.accounts.id.renderButton(btnContainer, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signup_with',
        shape: 'rectangular',
      });
    }
  }, [handleGoogleResponse]);

  return (
    <div className="auth-layout">
      {/* Visual Side */}
      <div className="auth-visual">
        <img
          src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=1600&fit=crop&q=80"
          alt="Person working out"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div className="auth-visual-overlay" />
        <div className="auth-visual-content">
          <h1>Your fitness<br />journey starts here</h1>
          <p>Set your protein goals, track meals, and watch your progress unfold.</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-container">
        <div className="auth-form-wrapper">
          <div className="auth-brand">
            <h2>Fuel<span>Track</span></h2>
          </div>

          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Start tracking in under 2 minutes</p>

          {/* Google Sign-Up Button */}
          {GOOGLE_CLIENT_ID && (
            <>
              <div id="google-signup-btn" style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'center' }} />
              <div className="auth-divider">
                <span>or sign up with email</span>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                type="text"
                className="form-input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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

              {/* Password strength */}
              {password && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  {passwordChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                      <Check size={14} style={{
                        color: check.valid ? 'var(--accent-cool)' : 'var(--text-tertiary)',
                      }} />
                      <span style={{
                        fontSize: 'var(--text-xs)',
                        color: check.valid ? 'var(--accent-cool)' : 'var(--text-tertiary)',
                      }}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ marginTop: 'var(--space-2)', padding: '14px' }}
            >
              {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : (
                <>Get Started <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
