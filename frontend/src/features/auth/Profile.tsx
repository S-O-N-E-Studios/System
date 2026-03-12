import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordFormData } from '@/types';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { useState } from 'react';

export default function Profile() {
  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  return (
    <div className="animate-fade-in max-w-3xl">
      <h1 className="text-h1 mb-8">Profile</h1>

      {/* Profile info */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 mb-8">
        <div className="flex items-center gap-6 mb-8">
          <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="xl" />
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
