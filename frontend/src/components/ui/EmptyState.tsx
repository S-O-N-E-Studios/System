import LottieAnimation from '@/components/ui/LottieAnimation';
import noDataAnimation from '@/animations/no-data.json';

interface EmptyStateProps {
  /** Short heading shown under the animation */
  title: string;
  /** Optional helper text */
  description?: string;
  /** Optional extra class for the container */
  className?: string;
  /** Optional class for the Lottie container (size) */
  animationClassName?: string;
}

export default function EmptyState({
  title,
  description,
  className = '',
  animationClassName = 'w-32 h-32',
}: EmptyStateProps) {
  return (
    <div
      className={
        'flex flex-col items-center justify-center gap-3 py-10 text-center ' + className
      }
    >
      <div className="rounded-full border border-[var(--accent)] bg-[var(--bg-card)]/95 shadow-[0_0_36px_var(--accent-sand-glow)] p-4 flex items-center justify-center">
        <LottieAnimation
          animationData={noDataAnimation}
          className={animationClassName}
          ariaLabel="No data"
        />
      </div>
      <p className="text-body text-[var(--text-primary)]">{title}</p>
      {description && (
        <p className="text-sm text-[var(--text-muted)] max-w-sm">{description}</p>
      )}
    </div>
  );
}
