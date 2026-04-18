import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordFormData } from '@/types';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '@/api/users';

export default function Profile() {
  const { user, logout, setUser } = useAuthStore();
  const { addToast } = useUiStore();
  const navigate = useNavigate();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  if (!user) return null;

  const onChangePassword = async (data: ChangePasswordFormData) => {
    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      addToast({ type: 'success', message: 'Password changed successfully.' });
      reset();
    } catch {
      addToast({ type: 'error', message: 'Failed to change password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const onLogout = () => {
    setIsLoggingOut(true);
    logout();
    setIsLoggingOut(false);
    navigate('/', { replace: true });
  };

  const onAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarUploading(true);
    try {
      await usersApi.uploadAvatar(file);
      const me = await authApi.getMe();
      setUser(me);
      addToast({ type: 'success', message: 'Profile photo updated.' });
    } catch {
      addToast({ type: 'error', message: 'Could not upload photo. Use JPEG, PNG, WebP, or GIF (max 2MB).' });
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="text-h1">Profile</h1>
        <Button variant="danger" onClick={onLogout} isLoading={isLoggingOut}>
          Log out
        </Button>
      </div>

      {/* Profile info */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 mb-8">
        <div className="flex flex-wrap items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="xl" />
            <div className="flex flex-col gap-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(ev) => void onAvatarFile(ev)}
              />
              <Button
                variant="secondary"
                type="button"
                isLoading={avatarUploading}
                disabled={avatarUploading}
                onClick={() => avatarInputRef.current?.click()}
              >
                Change photo
              </Button>
            </div>
          </div>
          <div>
            <h2 className="text-h3">{user.firstName} {user.lastName}</h2>
            <p className="text-body">{user.email}</p>
            <p className="text-[0.6rem] text-[var(--text-muted)] uppercase tracking-wider mt-1">
              {user.role.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput label="First Name" value={user.firstName} disabled />
          <FormInput label="Last Name" value={user.lastName} disabled />
          <FormInput label="Email" value={user.email} disabled />
          <FormInput label="Role" value={user.role.replace('_', ' ')} disabled />
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 mb-8">
        <h3 className="text-h3 mb-6">Change Password</h3>
        <form onSubmit={handleSubmit(onChangePassword)} className="flex flex-col gap-5 max-w-md">
          <FormInput
            label="Current Password"
            isPassword
            placeholder="Enter current password"
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <FormInput
            label="New Password"
            isPassword
            placeholder="At least 8 characters"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <FormInput
            label="Confirm New Password"
            isPassword
            placeholder="Re-enter new password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <div className="mt-2">
            <Button type="submit" variant="primary" isLoading={isChangingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* 2FA Placeholder */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 mb-8">
        <h3 className="text-h3 mb-4">Two-Factor Authentication</h3>
        <div className="flex items-center justify-center py-8 border border-dashed border-[var(--border)]">
          <p className="text-[var(--text-muted)] text-sm">2FA setup will be available soon.</p>
        </div>
      </div>

      {/* Active Sessions Placeholder */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-h3">Active Sessions</h3>
          <Button variant="ghost">Log out other sessions</Button>
        </div>
        <div className="flex items-center justify-center py-8 border border-dashed border-[var(--border)]">
          <p className="text-[var(--text-muted)] text-sm">Session management will be available soon.</p>
        </div>
      </div>
    </div>
  );
}
