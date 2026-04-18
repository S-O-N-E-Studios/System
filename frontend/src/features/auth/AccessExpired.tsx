import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

export default function AccessExpired() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-h1 mb-2">Access Expired</h1>
          <p className="text-body">
            Your temporary access has lapsed. Please contact your organisation admin to request an
            extension.
          </p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
          <p className="text-[0.8rem] text-[var(--text-muted)] mb-5">
            If you believe this is an error, request help from the EVIDENTIARY support contact
            provided in your access email.
          </p>

          <div className="flex items-center justify-center">
            <Button
              variant="primary"
              onClick={() => {
                logout();
                navigate('/');
              }}
              data-testid="access-expired-return-btn"
            >
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

