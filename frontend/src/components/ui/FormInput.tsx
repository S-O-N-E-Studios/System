import { forwardRef, type InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  error?: string;
  isPassword?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, isPassword, type, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const borderColor = error
      ? 'border-[var(--status-danger)]'
      : 'border-[var(--border)] focus:border-[var(--accent)]';

    const labelColor = error
      ? 'text-[var(--status-danger)]'
      : 'text-[var(--text-muted)] peer-focus:text-[var(--accent)]';

    return (
      <div className="flex flex-col gap-1">
        <label className={`text-eyebrow ${labelColor} transition-colors duration-200`}>
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={[
              'peer w-full bg-transparent border-0 border-b',
              borderColor,
              'py-2 font-body text-[0.82rem] font-light text-[var(--text-primary)]',
              'placeholder:text-[var(--text-muted)] placeholder:font-light',
              'transition-[border-color] duration-200 ease-in-out',
              'outline-none',
              disabled ? 'border-[var(--accent-glow)] text-[var(--text-muted)] opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && (
          <p className="text-[0.62rem] text-[var(--status-danger)] mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
export default FormInput;
