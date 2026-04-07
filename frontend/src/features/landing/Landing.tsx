import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <header className="border-b border-[var(--border-default)] px-6 py-4 flex items-center justify-between">
        <span className="text-h3 font-display tracking-[0.2em] uppercase text-[var(--text-primary)]">
          Project 360
        </span>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-[0.72rem] font-body uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            Sign in
          </Link>
          <Link to="/register">
            <Button variant="primary" className="!py-2 !px-4 !text-[0.65rem]">
              Register organisation
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-2xl mx-auto">
        <p className="text-eyebrow text-[var(--accent)] mb-4">Atlas Sahara · Engineering intelligence</p>
        <h1 className="text-h1 font-display text-[var(--text-primary)] mb-6">
          Provincial projects, stages, and delivery in one workspace
        </h1>
        <p className="text-body text-[var(--text-secondary)] mb-10 leading-relaxed">
          Plan portfolios, track six-stage lifecycles, and collaborate with teams and temporary client access — built
          for South African public-sector engineering programmes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link to="/login" className="sm:flex-1">
            <Button variant="primary" className="w-full !py-3">
              Sign in to your tenant
            </Button>
          </Link>
          <Link to="/register" className="sm:flex-1">
            <Button variant="secondary" className="w-full !py-3">
              Create an organisation
            </Button>
          </Link>
        </div>
        <p className="text-[0.68rem] text-[var(--text-muted)] mt-12">
          Demo mode uses mock data until your API is connected (set <span className="font-mono">VITE_USE_MOCK_AUTH=false</span>{' '}
          when ready).
        </p>
      </main>
    </div>
  );
}
