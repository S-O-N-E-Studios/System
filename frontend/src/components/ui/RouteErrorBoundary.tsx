import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import Button from './Button';

export default function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Something went wrong';
  const description =
    error instanceof Error
      ? error.message
      : 'The page could not be loaded. Please try again, or return to the dashboard.';

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--bg-primary)]">
      <div className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border)] p-8 space-y-4">
        <h1 className="text-h1">{title}</h1>
        <p className="text-body text-[var(--text-muted)]">{description}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="button" variant="primary" onClick={() => navigate(0)}>
            Retry
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
