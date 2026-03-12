import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData, type TenantSummary } from '@/types';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { openModal, addToast } = useUiStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [tenantChoices, setTenantChoices] = useState<TenantSummary[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await authApi.login(data);
      login(result.user, result.tokens);

      if (result.user.role === 'SUPER_ADMIN') {
        navigate('/super-admin/tenants');
        return;
      }

      const tenants = result.user.tenants;
      if (tenants.length === 1) {
        navigate(`/${tenants[0].slug}/dashboard`);
      } else if (tenants.length > 1) {
        setTenantChoices(tenants);
        openModal('tenant-selector');
      } else {
        setServerError('No organisations associated with this account.');
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid credentials. Please try again.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTenantSelect = (tenant: TenantSummary) => {
    addToast({ type: 'success', message: `Signed in to ${tenant.name}` });
    navigate(`/${tenant.slug}/dashboard`);
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--bg-secondary)] relative overflow-hidden items-center justify-center">
        {/* Diagonal gold stripe */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background:
              'linear-gradient(135deg, transparent 30%, var(--accent) 30%, var(--accent) 32%, transparent 32%)',
          }}
        />
        {/* Crosshatch texture */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: [
              'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(201,169,97,0.1) 10px, rgba(201,169,97,0.1) 11px)',
              'repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(201,169,97,0.1) 10px, rgba(201,169,97,0.1) 11px)',
            ].join(', '),
          }}
        />

        <div className="relative z-10 text-center px-12">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-16 w-16 border-2 border-[var(--accent)] flex items-center justify-center">
              <span className="font-display text-2xl font-semibold text-[var(--accent)]">S</span>
            </div>
          </div>
          <h1 className="font-display text-4xl font-light tracking-[4px] text-[var(--text-primary)] uppercase mb-3">
            S · O · N · E
          </h1>
          <p className="font-display text-lg font-light tracking-[6px] text-[var(--accent-dim)] uppercase mb-8">
            Studios
          </p>
          <p className="font-body text-sm font-light text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
            Engineering Project Management Platform.
            <br />
            Precision. Authority. Confidence.
          </p>
        </div>
      </div>

      {/* Right auth form */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-12">
            <h1 className="font-display text-2xl font-light tracking-[4px] text-[var(--text-primary)] uppercase">
              S · O · N · E
            </h1>
            <p className="text-[0.6rem] tracking-[4px] text-[var(--accent-dim)] uppercase mt-1">
              Studios
            </p>
          </div>

          <div className="mb-10">
            <h2 className="text-h2 mb-2">Sign In</h2>
            <p className="text-body">Enter your credentials to access the platform.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <FormInput
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <FormInput
              label="Password"
              isPassword
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password')}
            />

            {serverError && (
              <p className="text-[0.75rem] text-[var(--status-danger)]">{serverError}</p>
            )}

            <div className="flex flex-col gap-4 mt-4">
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Sign In
              </Button>

              <div className="flex items-center justify-between">
                <Button type="button" variant="ghost" className="!text-[0.6rem]">
                  Forgot password?
                </Button>
                <Link
                  to="/register"
                  className="text-button text-[0.6rem] text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors"
                >
                  Register Organisation →
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Tenant selector modal */}
      <Modal modalId="tenant-selector" title="Select Organisation" size="sm">
        <div className="flex flex-col gap-2">
          {tenantChoices.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => handleTenantSelect(tenant)}
              className={[
                'flex items-center gap-4 px-4 py-3 w-full text-left',
                'border border-[var(--border)]',
                'hover:border-[var(--accent)] hover:bg-[var(--accent-glow)]',
                'transition-all duration-300',
              ].join(' ')}
            >
              <Avatar name={tenant.name} src={tenant.logo} size="lg" />
              <div>
                <p className="font-body text-[0.82rem] font-medium text-[var(--text-primary)]">
                  {tenant.name}
                </p>
                <p className="text-[0.6rem] text-[var(--text-muted)] uppercase tracking-wider">
                  {tenant.role.replace('_', ' ')}
                </p>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
