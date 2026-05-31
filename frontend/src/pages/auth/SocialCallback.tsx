import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/api';

export default function SocialCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      navigate('/login?error=oauth_failed');
      return;
    }

    // Temporarily store token, then fetch user info
    localStorage.setItem('emi_token', token);
    authApi.me()
      .then((res) => {
        const user = res.data.data;
        login(token, user);
        navigate('/dashboard');
      })
      .catch(() => {
        localStorage.removeItem('emi_token');
        navigate('/login?error=oauth_failed');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Signing you in with Google...</p>
      </div>
    </div>
  );
}
