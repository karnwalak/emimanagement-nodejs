import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { contactApi } from '../services/api';
import TextInput from '../components/ui/TextInput';
import InputLabel from '../components/ui/InputLabel';
import PrimaryButton from '../components/ui/PrimaryButton';

export default function Support() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', subject: '', message: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('');
    setError('');
    setLoading(true);
    try {
      const res = await contactApi.submit(form);
      setStatus(res.data.data?.message || res.data.message || 'Message sent!');
      setForm({ ...form, subject: '', message: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">EM</div>
          <span className="font-semibold text-gray-800">EMI Management</span>
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Contact Support</h1>
        <p className="text-gray-600 mb-8">We'll get back to you within 24 hours.</p>

        {status && <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{status}</div>}
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <InputLabel required>Name</InputLabel>
              <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <InputLabel required>Email</InputLabel>
              <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div>
            <InputLabel required>Subject</InputLabel>
            <TextInput value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          </div>
          <div>
            <InputLabel required>Message</InputLabel>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={6}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <PrimaryButton type="submit" loading={loading}>Send Message</PrimaryButton>
        </form>
      </div>
    </div>
  );
}
