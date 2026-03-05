import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'relative overflow-hidden',
    'border border-[var(--accent)] text-[var(--accent)]',
    'before:absolute before:inset-0 before:-translate-x-full',
    'before:bg-[var(--accent)] before:transition-transform before:duration-500 before:ease-in-out',
    'hover:before:translate-x-0 hover:text-[var(--bg-primary)]',
    '[&>span]:relative [&>span]:z-10',
  ].join(' '),
  secondary: [
    'border border-[var(--accent-dim)] text-[var(--text-secondary)]',
    'hover:border-[var(--accent)] hover:text-[var(--accent)]',
    'transition-colors duration-300',
  ].join(' '),
  ghost: [
    'border-0 text-[var(--text-muted)]',
    'hover:text-[var(--accent)]',
    'transition-colors duration-300',
    'px-0 min-w-0',
  ].join(' '),
  danger: [
    'relative overflow-hidden',
    'border border-[var(--status-danger)] text-[var(--status-danger)]',
    'before:absolute before:inset-0 before:-translate-x-full',
    'before:bg-[var(--status-danger)] before:transition-transform before:duration-500 before:ease-in-out',
    'hover:before:translate-x-0 hover:text-white',
    '[&>span]:relative [&>span]:z-10',
  ].join(' '),
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', isLoading = false, disabled, children, className = '', ...props }, ref) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'text-button inline-flex items-center justify-center gap-2',
          'px-8 py-3 min-w-[120px]',
          'transition-all duration-300',
          isDisabled ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer active:opacity-80 active:scale-[0.99]',
          variantStyles[variant],
          className,
        ].join(' ')}
        {...props}
      >
        <span className="inline-flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />}
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
