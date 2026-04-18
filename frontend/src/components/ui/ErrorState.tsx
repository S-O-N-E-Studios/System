import LottieAnimation from '@/components/ui/LottieAnimation';
import failedAnimation from '@/animations/Failed.json';

interface ErrorStateProps {
  /** Short heading shown under the animation */
  title?: string;
  /** Optional helper text */
  description?: string;
  /** Optional extra class for the container */
  className?: string;
  /** Optional class for the Lottie container (size) */
  animationClassName?: string;
  /** Optional action (e.g. Retry button) */
  action?: React.ReactNode;
}

export default function ErrorState({
  title = 'Something went wrong',
  description,
  className = '',
  animationClassName = 'w-24 h-24',
  action,
}: ErrorStateProps) {
  return (
    <div
      className={
        'flex flex-col items-center justify-center gap-3 py-10 text-center ' + className
      }
    >
      <div className="rounded-full border border-[var(--status-danger)] bg-[var(--bg-card)]/95 shadow-[0_0_32px_var(--status-danger)] p-4 flex items-center justify-center">
        <LottieAnimation
          animationData={failedAnimation}
          loop={false}
          className={animationClassName}
          ariaLabel="Error"
        />
      </div>
      {title && <p className="text-body text-[var(--text-primary)]">{title}</p>}
      {description && (
        <p className="text-sm text-[var(--text-muted)] max-w-sm">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

