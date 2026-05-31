import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GuestLayout from '../../components/layout/GuestLayout';
import TextInput from '../../components/ui/TextInput';
import InputLabel from '../../components/ui/InputLabel';
import InputError from '../../components/ui/InputError';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { authApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { AxiosError } from 'axios';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError('');
    setLoading(true);

    try {
      const res = await authApi.register(form);
      const { token, user } = res.data;
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      const axiosErr = err as AxiosError<any>;
      const data = axiosErr.response?.data;
      if (Array.isArray(data?.errors)) {
        const map: Record<string, string> = {};
        data.errors.forEach((e: string) => {
          if (e.toLowerCase().includes('name')) map.name = e;
          else if (e.toLowerCase().includes('email')) map.email = e;
          else if (e.toLowerCase().includes('password')) map.password = e;
        });
        setErrors(map);
      } else {
        setServerError(data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestLayout>
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Create your account</h3>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{serverError}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <InputLabel htmlFor="name" required>Full Name</InputLabel>
          <TextInput id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <InputError message={errors.name} />
        </div>
        <div>
          <InputLabel htmlFor="email" required>Email</InputLabel>
          <TextInput id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <InputError message={errors.email} />
        </div>
        <div>
          <InputLabel htmlFor="password" required>Password</InputLabel>
          <TextInput id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <InputError message={errors.password} />
          <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
        </div>

        <PrimaryButton type="submit" loading={loading} className="w-full">Create Account</PrimaryButton>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
      </p>
    </GuestLayout>
  );
}
