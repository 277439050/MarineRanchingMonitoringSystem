import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-[var(--ocean-deep)] text-[var(--ocean-blue)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
