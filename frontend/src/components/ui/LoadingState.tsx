import LottieAnimation from '@/components/ui/LottieAnimation';
import loadingAnimation from '@/animations/sandy-loading.json';

interface LoadingStateProps {
  /** Short heading shown under the animation */
  title?: string;
  /** Optional helper text */
  description?: string;
  /** Optional extra class for the container */
  className?: string;
  /** Optional class for the Lottie container (size) */
  animationClassName?: string;
}

export default function LoadingState({
  title = 'Loading',
  description,
  className = '',
  animationClassName = 'w-24 h-24',
}: LoadingStateProps) {
  return (
    <div
      className={
        'flex flex-col items-center justify-center gap-3 py-10 text-center ' + className
      }
    >
      <div className="rounded-full border border-[var(--accent)] bg-[var(--bg-card)]/95 shadow-[0_0_32px_var(--accent-sand-glow)] p-4 flex items-center justify-center">
        <LottieAnimation
          animationData={loadingAnimation}
          className={animationClassName}
          ariaLabel="Loading"
        />
      </div>
      {title && <p className="text-body text-[var(--text-primary)]">{title}</p>}
      {description && (
        <p className="text-sm text-[var(--text-muted)] max-w-sm">{description}</p>
      )}
    </div>
  );
}

