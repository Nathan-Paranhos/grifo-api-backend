import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { handleSignOut } from '../services/authService';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { currentUser } = useAuth();

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-black p-4">
        <h1 className="text-2xl font-bold text-dourado mb-8">Grifo Vistorias</h1>
        <nav>
          <ul>
            <li className="mb-4"><a href="/dashboard" className="hover:text-dourado">Dashboard</a></li>
            <li className="mb-4"><a href="/inspections" className="hover:text-dourado">Vistorias</a></li>
            <li className="mb-4"><a href="/properties" className="hover:text-dourado">Imóveis</a></li>
            <li className="mb-4"><a href="/reports" className="hover:text-dourado">Relatórios</a></li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-black p-4 flex justify-between items-center border-b border-gray-700">
          <div>
            {/* Can add breadcrumbs or page title here */}
          </div>
          <div className="flex items-center">
            <span className="mr-4">{currentUser?.email}</span>
            <button onClick={handleSignOut} className="bg-dourado text-black px-4 py-2 rounded hover:bg-yellow-500 transition-colors">Logout</button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;