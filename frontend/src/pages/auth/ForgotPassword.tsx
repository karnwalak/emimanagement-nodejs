import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import GuestLayout from '../../components/layout/GuestLayout';
import TextInput from '../../components/ui/TextInput';
import InputLabel from '../../components/ui/InputLabel';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { authApi } from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setStatus(res.data.data?.message || res.data.message || 'Check your email for a reset link.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestLayout>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Forgot password?</h3>
      <p className="text-sm text-gray-600 mb-6">Enter your email and we'll send a reset link.</p>

      {status && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">{status}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <InputLabel htmlFor="email" required>Email</InputLabel>
          <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <PrimaryButton type="submit" loading={loading} className="w-full">Send Reset Link</PrimaryButton>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        <Link to="/login" className="text-indigo-600 hover:underline">Back to login</Link>
      </p>
    </GuestLayout>
  );
}
