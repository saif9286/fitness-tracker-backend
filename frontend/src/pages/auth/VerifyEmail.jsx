import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  // Use a ref to ensure we only attempt verification once (React StrictMode runs effects twice)
  const hasVerified = useRef(false);

  useEffect(() => {
    const doVerification = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Invalid verification link.');
        return;
      }

      if (hasVerified.current) return;
      hasVerified.current = true;

      try {
        await verifyEmail(token);
        setStatus('success');
        toast.success('Email verified successfully!');
        
        // Redirect to onboarding after a short delay
        setTimeout(() => {
          navigate('/onboarding');
        }, 3000);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
      }
    };

    doVerification();
  }, [token, verifyEmail, navigate, toast]);

  return (
    <div className="auth-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="auth-form-container" style={{ padding: 'var(--space-8)', maxWidth: '500px', width: '100%', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)' }}>
        
        <div className="auth-brand" style={{ justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
          <h2>Fuel<span>Track</span></h2>
        </div>

        {status === 'loading' && (
          <div>
            <div className="spinner spinner-lg" style={{ margin: '0 auto var(--space-4)' }}></div>
            <h3>Verifying your email...</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>Please wait a moment.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <CheckCircle size={64} style={{ color: 'var(--accent-cool)', margin: '0 auto var(--space-4)' }} />
            <h3>Email Verified!</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>Your account is now fully active.</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 'var(--space-4)' }}>Redirecting you to setup your profile...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <XCircle size={64} style={{ color: 'var(--accent-warm)', margin: '0 auto var(--space-4)' }} />
            <h3>Verification Failed</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>{errorMessage}</p>
            <div style={{ marginTop: 'var(--space-6)' }}>
              <Link to="/login" className="btn btn-primary">Go to Login</Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
