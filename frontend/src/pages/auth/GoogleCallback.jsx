import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { googleLoginDirect } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const hasProfile = searchParams.get('hasProfile') === 'true';
    const name = searchParams.get('name');
    const error = searchParams.get('error');

    if (error) {
      toast.error(decodeURIComponent(error) || 'Google sign-in failed');
      navigate('/login');
      return;
    }

    if (accessToken && refreshToken) {
      googleLoginDirect(accessToken, refreshToken, hasProfile)
        .then(() => {
          toast.success(`Welcome back, ${decodeURIComponent(name || 'User')}!`);
          navigate(hasProfile ? '/' : '/onboarding');
        })
        .catch((err) => {
          console.error(err);
          toast.error('Failed to establish session. Please try again.');
          navigate('/login');
        });
    } else {
      toast.error('Authentication parameter mismatch');
      navigate('/login');
    }
  }, [searchParams, navigate, googleLoginDirect, toast]);

  return (
    <div className="loading-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
      <div className="spinner spinner-lg"></div>
      <p style={{ marginTop: '20px', color: 'var(--text-secondary)', fontSize: '15px' }}>Completing Google sign-in...</p>
    </div>
  );
}
