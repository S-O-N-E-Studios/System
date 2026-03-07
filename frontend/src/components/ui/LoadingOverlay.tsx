import LottieAnimation from '@/components/ui/LottieAnimation';
import sandyLoading from '@/animations/sandy-loading.json';

interface LoadingOverlayProps {
  fullscreen?: boolean;
}

export default function LoadingOverlay({ fullscreen = true }: LoadingOverlayProps) {
  const containerClasses = fullscreen
    ? 'fixed inset-0 z-40 flex items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-md'
    : 'flex items-center justify-center';

  return (
    <div className={containerClasses}>
      <div className="rounded-full border border-[var(--accent)] bg-[var(--bg-card)]/95 shadow-[0_0_60px_rgba(201,169,97,0.35)] p-6 md:p-8 flex items-center justify-center">
        <LottieAnimation
          animationData={sandyLoading}
          className="w-32 h-32 md:w-44 md:h-44"
          ariaLabel="Loading"
        />
      </div>
    </div>
  );
}

