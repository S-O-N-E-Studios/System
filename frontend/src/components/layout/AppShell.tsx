import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ToastContainer from '@/components/ui/Toast';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      {/* Main content: offset by collapsed sidebar (72px) on desktop */}
      <div className="flex flex-col min-h-screen lg:ml-[72px]">
        <TopBar />

        <main className="flex-1 pt-20 px-6 pb-12 lg:px-[5rem] overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
