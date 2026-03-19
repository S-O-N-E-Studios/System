import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientActivateSchema, type ClientActivateFormData } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';

export default function ClientActivate() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  useAuthStore();
  const { addToast } = useUiStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientActivateFormData>({
    resolver: zodResolver(clientActivateSchema),
  });

  const onSubmit = async (data: ClientActivateFormData) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      // TODO: Wire to POST /auth/client-activate/:token
      void data;
      addToast({ type: 'success', message: 'Account activated successfully!' });
      navigate('/');
    } catch {
      addToast({ type: 'error', message: 'Activation failed. The link may have expired.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-h1 mb-2">Activate Access</h1>
          <p className="text-body">
            Set your password to activate your temporary project access.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-8 flex flex-col gap-5">
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
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Activate Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
