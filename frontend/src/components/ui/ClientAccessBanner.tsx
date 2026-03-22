import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1_000);
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

interface ClientAccessBannerProps {
  expiresAt: string;
}

export default function ClientAccessBanner({ expiresAt }: ClientAccessBannerProps) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [remainingMs, setRemainingMs] = useState(() => new Date(expiresAt).getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setRemainingMs(diff);

      if (diff <= 0) {
        clearInterval(interval);
        logout();
        navigate('/');
      }
    }, 1_000);

    return () => clearInterval(interval);
  }, [expiresAt, logout, navigate]);

  const isExpiringSoon = remainingMs > 0 && remainingMs <= 86_400_000;
  const isExpired = remainingMs <= 0;

  if (isExpired) {
    return (
      <div className="w-full py-2 px-6 text-center bg-[var(--status-danger)] text-[var(--bg-surface)]">
        <span className="text-[0.72rem] font-semibold uppercase tracking-wider">
          Access Expired
        </span>
      </div>
    );
  }

  const expiryDate = new Date(expiresAt).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className={[
        'w-full py-2 px-6 text-center',
        isExpiringSoon
          ? 'bg-[var(--status-warning)]'
          : 'bg-[var(--accent-sand)]',
      ].join(' ')}
      data-testid="client-access-banner"
    >
      {isExpiringSoon ? (
        <span
          className="text-[0.72rem] font-semibold uppercase tracking-wider text-[var(--text-primary)]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Access expires in {formatCountdown(remainingMs)}
        </span>
      ) : (
        <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-[var(--text-primary)]">
          Temporary Access&nbsp;&nbsp;·&nbsp;&nbsp;Expires{' '}
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{expiryDate}</span>
        </span>
      )}
    </div>
  );
}
