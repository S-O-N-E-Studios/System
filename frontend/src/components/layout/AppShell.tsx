import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ToastContainer from '@/components/ui/Toast';

export default function AppShell() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      <div className="flex flex-col min-h-screen">
        <TopBar />

        <main className="flex-1 pt-20 px-6 pb-12 lg:px-[5rem] overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
