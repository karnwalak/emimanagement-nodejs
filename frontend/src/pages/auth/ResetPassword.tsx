import { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GuestLayout from '../../components/layout/GuestLayout';
import TextInput from '../../components/ui/TextInput';
import InputLabel from '../../components/ui/InputLabel';
import InputError from '../../components/ui/InputError';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { authApi } from '../../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      navigate('/login?reset=1');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed. The link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestLayout>
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Set new password</h3>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <InputLabel htmlFor="password" required>New Password</InputLabel>
          <TextInput id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <InputError message={password.length > 0 && password.length < 8 ? 'Minimum 8 characters' : ''} />
        </div>
        <PrimaryButton type="submit" loading={loading} className="w-full">Reset Password</PrimaryButton>
      </form>
    </GuestLayout>
  );
}
