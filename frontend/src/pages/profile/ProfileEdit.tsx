import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '../../components/layout/AuthenticatedLayout';
import TextInput from '../../components/ui/TextInput';
import InputLabel from '../../components/ui/InputLabel';
import InputError from '../../components/ui/InputError';
import PrimaryButton from '../../components/ui/PrimaryButton';
import DangerButton from '../../components/ui/DangerButton';
import { profileApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileEdit() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileSaving, setProfileSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwSaving, setPwSaving] = useState(false);

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    setProfileSaving(true);
    try {
      const res = await profileApi.update(profileForm);
      const updated = res.data.data;
      updateUser({ ...user!, name: updated.name, email: updated.email });
      Swal.fire({ icon: 'success', title: 'Profile updated!', timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      const data = err.response?.data;
      if (Array.isArray(data?.errors)) {
        const map: Record<string, string> = {};
        data.errors.forEach((e: string) => {
          if (e.toLowerCase().includes('email')) map.email = e;
          else map.name = e;
        });
        setProfileErrors(map);
      } else {
        setProfileErrors({ general: data?.message || 'Update failed.' });
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPwErrors({});
    setPwSaving(true);
    try {
      await profileApi.changePassword(pwForm);
      setPwForm({ currentPassword: '', newPassword: '' });
      Swal.fire({ icon: 'success', title: 'Password changed!', timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      setPwErrors({ general: err.response?.data?.message || 'Password change failed.' });
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: 'Delete Account?',
      text: 'This will permanently delete your account and all your loans, EMIs, and documents. This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes, delete my account',
      input: 'text',
      inputPlaceholder: 'Type DELETE to confirm',
      inputValidator: (v) => v !== 'DELETE' ? 'Please type DELETE to confirm' : null,
    });
    if (!result.isConfirmed) return;

    try {
      await profileApi.deleteAccount();
      logout();
      navigate('/');
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: err.response?.data?.message || 'Deletion failed.' });
    }
  };

  return (
    <AuthenticatedLayout title="Profile Settings">
      <div className="max-w-2xl space-y-6">
        {/* Profile info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Profile Information</h3>
          {profileErrors.general && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{profileErrors.general}</div>}
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <InputLabel required>Full Name</InputLabel>
              <TextInput value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
              <InputError message={profileErrors.name} />
            </div>
            <div>
              <InputLabel required>Email</InputLabel>
              <TextInput type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required />
              <InputError message={profileErrors.email} />
              {!user?.emailVerifiedAt && (
                <p className="text-xs text-yellow-600 mt-1">Your email is not verified.</p>
              )}
            </div>
            <PrimaryButton type="submit" loading={profileSaving}>Save Profile</PrimaryButton>
          </form>
        </div>

        {/* Password */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Change Password</h3>
          {pwErrors.general && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{pwErrors.general}</div>}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <InputLabel required>Current Password</InputLabel>
              <TextInput type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
            </div>
            <div>
              <InputLabel required>New Password</InputLabel>
              <TextInput type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters.</p>
            </div>
            <PrimaryButton type="submit" loading={pwSaving}>Change Password</PrimaryButton>
          </form>
        </div>

        {/* Delete account */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-red-100">
          <h3 className="font-semibold text-red-700 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-600 mb-4">Once you delete your account, all data will be permanently removed. This action cannot be undone.</p>
          <DangerButton onClick={handleDeleteAccount}>Delete Account</DangerButton>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
