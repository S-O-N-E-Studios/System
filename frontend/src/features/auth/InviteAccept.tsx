import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';

const inviteSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { addToast } = useUiStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  });

  const onSubmit = async (data: InviteFormData) => {
    if (!token) return;
    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await authApi.acceptInvite(token, data.password);
      login(result.user, result.tokens);
      addToast({ type: 'success', message: 'Welcome! Your account has been activated.' });

      const tenants = result.user.tenants;
      if (tenants.length > 0) {
        navigate(`/${tenants[0].slug}/dashboard`);
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to accept invitation. The link may have expired.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-h2 tracking-[4px] uppercase mb-6">
            Project 360
          </h1>
          <h2 className="text-h2 mb-2">Accept Invitation</h2>
          <p className="text-body">Set your password to activate your account.</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <FormInput
              label="Password"
              isPassword
              placeholder="At least 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />

            <FormInput
              label="Confirm Password"
              isPassword
              placeholder="Re-enter password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {serverError && (
              <p className="text-[0.75rem] text-[var(--status-danger)]">{serverError}</p>
            )}

            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Activate Account
            </Button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-button text-[0.6rem] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
