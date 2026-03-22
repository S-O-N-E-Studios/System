import LottieAnimation from '@/components/ui/LottieAnimation';
import successAnimation from '@/animations/success-animation.json';

interface SuccessAnimationProps {
  className?: string;
  ariaLabel?: string;
}

export default function SuccessAnimation({ className, ariaLabel }: SuccessAnimationProps) {
  const sizeClass = className ?? 'w-24 h-24';

  return (
    <div className="inline-flex items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--bg-card)]/95 shadow-[0_0_40px_var(--accent-sand-glow)] p-4">
      <LottieAnimation
        animationData={successAnimation}
        loop={false}
        className={sizeClass}
        ariaLabel={ariaLabel ?? 'Success'}
      />
    </div>
  );
}

