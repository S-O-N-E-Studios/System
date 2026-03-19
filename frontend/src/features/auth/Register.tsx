import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerOrgSchema, type RegisterOrgFormData } from '@/types';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import { generateSlug } from '@/utils/formatters';
import { ArrowLeft, ArrowRight, Check, Building2, UserPlus, ClipboardCheck } from 'lucide-react';

type Step = 1 | 2 | 3;

const stepConfig = [
  { num: 1, label: 'Organisation', icon: Building2 },
  { num: 2, label: 'Admin User', icon: UserPlus },
  { num: 3, label: 'Review', icon: ClipboardCheck },
] as const;

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { addToast } = useUiStore();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<RegisterOrgFormData>({
    resolver: zodResolver(registerOrgSchema),
    defaultValues: {
      orgName: '',
      slug: '',
      orgType: undefined,
      industryType: '',
      primaryContactName: '',
      primaryContactEmail: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      adminPassword: '',
      adminPasswordConfirm: '',
      agreeToTerms: false,
    },
  });

  const orgName = watch('orgName');
  const slug = watch('slug');
  const adminPassword = watch('adminPassword');

  // Auto-generate slug from org name
  useEffect(() => {
    if (orgName && step === 1) {
      const generated = generateSlug(orgName);
      setValue('slug', generated);
    }
  }, [orgName, step, setValue]);

  // Check slug availability (debounced)
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSlugChecking(true);
      try {
        const result = await authApi.checkSlug(slug);
        setSlugAvailable(result.available);
      } catch {
        setSlugAvailable(null);
      } finally {
        setSlugChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug]);

  const step1Fields = ['orgName', 'slug', 'orgType', 'industryType', 'primaryContactName', 'primaryContactEmail'] as const;
  const step2Fields = ['adminFirstName', 'adminLastName', 'adminEmail', 'adminPassword', 'adminPasswordConfirm'] as const;

  const goNext = async () => {
    const fieldsToValidate = step === 1 ? step1Fields : step2Fields;
    const valid = await trigger(fieldsToValidate as unknown as (keyof RegisterOrgFormData)[]);
    if (valid) setStep((s) => Math.min(s + 1, 3) as Step);
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const onSubmit = async (data: RegisterOrgFormData) => {
    setIsSubmitting(true);
    try {
      const result = await authApi.registerOrg({
        orgName: data.orgName,
        slug: data.slug,
        orgType: data.orgType,
        industryType: data.industryType,
        primaryContactName: data.primaryContactName,
        primaryContactEmail: data.primaryContactEmail,
        adminFirstName: data.adminFirstName,
        adminLastName: data.adminLastName,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
      });
      login(result.user, result.tokens);
      addToast({ type: 'success', message: 'Organisation created successfully!' });
      navigate(`/${data.slug}/dashboard`);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string }; status?: number } };
      const message =
        ax?.response?.data?.message ??
        (ax?.response?.status === 404 || ax?.response?.status === 502
          ? 'Server not reachable. Is the backend running on port 5000?'
          : 'Registration failed. Please try again.');
      addToast({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = () => {
    addToast({
      type: 'error',
      message: errors.agreeToTerms
        ? 'Please agree to the Terms of Service and Privacy Policy.'
        : 'Please fix the errors below before continuing.',
    });
  };

  // Password strength indicator
  const getPasswordStrength = (pw: string): { label: string; width: string; color: string } => {
    if (!pw) return { label: '', width: '0%', color: 'transparent' };
    if (pw.length < 8) return { label: 'Weak', width: '25%', color: 'var(--status-danger)' };
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasNum = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    const score = [hasUpper, hasLower, hasNum, hasSpecial].filter(Boolean).length;
    if (score <= 2) return { label: 'Fair', width: '50%', color: 'var(--status-review)' };
    if (score === 3) return { label: 'Good', width: '75%', color: 'var(--status-planning)' };
    return { label: 'Strong', width: '100%', color: 'var(--status-active)' };
  };

  const strength = getPasswordStrength(adminPassword || '');
  const values = getValues();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-6 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-block mb-6">
            <h1 className="text-h2 tracking-[4px] uppercase">
              Project 360
            </h1>
          </Link>
          <h2 className="text-h2 mb-2">Register Your Organisation</h2>
          <p className="text-body">Set up your engineering project management workspace.</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-8 mb-12">
          {stepConfig.map(({ num, label, icon: Icon }) => {
            const isActive = step === num;
            const isComplete = step > num;
            return (
              <div key={num} className="flex items-center gap-3">
                <div
                  className={[
                    'h-10 w-10 flex items-center justify-center border transition-all duration-300',
                    isComplete
                      ? 'bg-[var(--accent)] border-[var(--accent)]'
                      : isActive
                        ? 'border-[var(--accent)] text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--text-muted)]',
                  ].join(' ')}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4 text-[var(--bg-primary)]" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={[
                    'text-[0.68rem] font-body font-medium uppercase tracking-wider hidden sm:block',
                    isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
                  ].join(' ')}
                >
                  {label}
                </span>
                {num < 3 && (
                  <div className="w-12 h-px bg-[var(--border)] hidden sm:block ml-3" />
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          {/* Step 1: Organisation */}
          <div className={step === 1 ? 'animate-fade-in' : 'hidden'}>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8">
              <h3 className="text-h3 mb-6">Organisation Details</h3>
              <div className="flex flex-col gap-5">
                <FormInput
                  label="Organisation Name"
                  placeholder="e.g. Limpopo Civil Engineering"
                  error={errors.orgName?.message}
                  {...register('orgName')}
                />

                <div>
                  <FormInput
                    label="Subdomain Slug"
                    placeholder="e.g. limpopo-civil"
                    error={errors.slug?.message}
                    {...register('slug')}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[0.65rem] text-[var(--text-muted)]">
                      app.project360.com/
                    </span>
                    <span className="text-[0.65rem] font-mono text-[var(--accent)]">
                      {slug || '...'}
                    </span>
                    {slugChecking && (
                      <span className="text-[0.6rem] text-[var(--text-muted)]">Checking…</span>
                    )}
                    {slugAvailable === true && (
                      <span className="text-[0.6rem] text-[var(--status-active)]">✓ Available</span>
                    )}
                    {slugAvailable === false && (
                      <span className="text-[0.6rem] text-[var(--status-danger)]">✗ Taken</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-eyebrow text-[var(--text-muted)]">Organisation Type</label>
                  <select
                    className={[
                      'w-full bg-transparent border-0 border-b border-[var(--border-default)]',
                      'py-2 text-[0.82rem] text-[var(--text-primary)]',
                      'focus:border-[var(--accent-sand)] focus:outline-none',
                      'transition-[border-color] duration-200',
                    ].join(' ')}
                    {...register('orgType')}
                  >
                    <option value="" className="bg-[var(--bg-surface)]">Select type…</option>
                    <option value="provincial_gov" className="bg-[var(--bg-surface)]">Provincial Government</option>
                    <option value="private_firm" className="bg-[var(--bg-surface)]">Private Engineering Firm</option>
                  </select>
                  {errors.orgType && (
                    <p className="text-[0.62rem] text-[var(--status-danger)] mt-0.5">
                      {errors.orgType.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-eyebrow text-[var(--text-muted)]">Industry Type</label>
                  <select
                    className={[
                      'w-full bg-transparent border-0 border-b border-[var(--border-default)]',
                      'py-2 text-[0.82rem] text-[var(--text-primary)]',
                      'focus:border-[var(--accent-sand)] focus:outline-none',
                      'transition-[border-color] duration-200',
                    ].join(' ')}
                    {...register('industryType')}
                  >
                    <option value="" className="bg-[var(--bg-surface)]">Select industry…</option>
                    <option value="civil" className="bg-[var(--bg-surface)]">Civil Engineering</option>
                    <option value="structural" className="bg-[var(--bg-surface)]">Structural Engineering</option>
                    <option value="electrical" className="bg-[var(--bg-surface)]">Electrical Engineering</option>
                    <option value="mechanical" className="bg-[var(--bg-surface)]">Mechanical Engineering</option>
                    <option value="environmental" className="bg-[var(--bg-surface)]">Environmental Engineering</option>
                    <option value="consulting" className="bg-[var(--bg-surface)]">Engineering Consulting</option>
                    <option value="other" className="bg-[var(--bg-surface)]">Other</option>
                  </select>
                  {errors.industryType && (
                    <p className="text-[0.62rem] text-[var(--status-danger)] mt-0.5">
                      {errors.industryType.message}
                    </p>
                  )}
                </div>

                <FormInput
                  label="Primary Contact Name"
                  placeholder="Full name"
                  error={errors.primaryContactName?.message}
                  {...register('primaryContactName')}
                />

                <FormInput
                  label="Primary Contact Email"
                  type="email"
                  placeholder="contact@company.com"
                  error={errors.primaryContactEmail?.message}
                  {...register('primaryContactEmail')}
                />
              </div>
            </div>
          </div>

          {/* Step 2: Admin User */}
          <div className={step === 2 ? 'animate-fade-in' : 'hidden'}>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8">
              <h3 className="text-h3 mb-6">Admin User Account</h3>
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="First Name"
                    placeholder="Fortune"
                    error={errors.adminFirstName?.message}
                    {...register('adminFirstName')}
                  />
                  <FormInput
                    label="Last Name"
                    placeholder="Mabona"
                    error={errors.adminLastName?.message}
                    {...register('adminLastName')}
                  />
                </div>

                <FormInput
                  label="Admin Email"
                  type="email"
                  placeholder="admin@company.com"
                  error={errors.adminEmail?.message}
                  {...register('adminEmail')}
                />

                <div>
                  <FormInput
                    label="Password"
                    isPassword
                    placeholder="At least 8 characters"
                    error={errors.adminPassword?.message}
                    {...register('adminPassword')}
                  />
                  {adminPassword && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-[var(--bg-secondary)] overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{ width: strength.width, backgroundColor: strength.color }}
                        />
                      </div>
                      <span className="text-[0.6rem]" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                <FormInput
                  label="Confirm Password"
                  isPassword
                  placeholder="Re-enter password"
                  error={errors.adminPasswordConfirm?.message}
                  {...register('adminPasswordConfirm')}
                />
              </div>
            </div>
          </div>

          {/* Step 3: Review */}
          <div className={step === 3 ? 'animate-fade-in' : 'hidden'}>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8">
              <h3 className="text-h3 mb-6">Review & Confirm</h3>

              {Object.keys(errors).length > 0 && (
                <div className="mb-6 p-4 border border-[var(--status-review)] bg-[var(--accent-sand-glow)] text-[var(--text-primary)] text-[0.82rem]">
                  Please fix the errors below. You must agree to the terms to continue.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex flex-col gap-4">
                  <p className="text-eyebrow">Organisation</p>
                  <div className="flex flex-col gap-2">
                    <ReviewRow label="Name" value={values.orgName} />
                    <ReviewRow label="Slug" value={values.slug} mono />
                    <ReviewRow label="Industry" value={values.industryType} />
                    <ReviewRow label="Contact" value={values.primaryContactName} />
                    <ReviewRow label="Contact Email" value={values.primaryContactEmail} />
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <p className="text-eyebrow">Admin User</p>
                  <div className="flex flex-col gap-2">
                    <ReviewRow label="Name" value={`${values.adminFirstName} ${values.adminLastName}`} />
                    <ReviewRow label="Email" value={values.adminEmail} />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--accent)]"
                  {...register('agreeToTerms')}
                />
                <span className="text-[0.78rem] text-[var(--text-secondary)]">
                  I agree to the Terms of Service and Privacy Policy
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="text-[0.62rem] text-[var(--status-danger)] mt-1">
                  {errors.agreeToTerms.message}
                </p>
              )}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <Button type="button" variant="secondary" onClick={goBack}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            ) : (
              <Link
                to="/"
                className="text-button text-[0.65rem] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                ← Back to Sign In
              </Link>
            )}

            {step < 3 ? (
              <Button type="button" variant="primary" onClick={goNext}>
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Create Organisation
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[0.65rem] text-[var(--text-muted)] min-w-[100px]">{label}</span>
      <span
        className={`text-[0.82rem] text-[var(--text-primary)] ${mono ? 'font-mono text-[var(--accent)]' : 'font-body'}`}
      >
        {value || 'N/A'}
      </span>
    </div>
  );
}
