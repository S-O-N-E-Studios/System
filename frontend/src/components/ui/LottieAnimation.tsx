import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { useRef } from 'react';

interface LottieAnimationProps {
  animationData: object;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  ariaLabel?: string;
}

export default function LottieAnimation({
  animationData,
  loop = true,
  autoplay = true,
  className,
  ariaLabel,
}: LottieAnimationProps) {
  const ref = useRef<LottieRefCurrentProps>(null);

  return (
    <Lottie
      lottieRef={ref}
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    />
  );
}

