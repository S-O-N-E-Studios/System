import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'sahara-btn--primary',
  secondary: 'sahara-btn--secondary',
  ghost: 'sahara-btn--ghost',
  danger: 'sahara-btn--danger',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', isLoading = false, disabled, children, className = '', type = 'button', ...props },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        className={['sahara-btn', variantClass[variant], className].filter(Boolean).join(' ')}
        {...props}
        disabled={isDisabled}
      >
        <span className="inline-flex items-center justify-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-current opacity-90" aria-hidden />}
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
