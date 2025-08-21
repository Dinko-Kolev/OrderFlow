import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 lg:flex">
      {/* Sidebar (fixed) */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Spacer to reserve sidebar width on large screens */}
      <div className="hidden lg:block lg:w-64" aria-hidden="true" />
      
      {/* Main Content Area */}
      <div className="flex-1">
        {/* Top Bar */}
        <TopBar onSidebarToggle={toggleSidebar} />
        
        {/* Page Content */}
        <main className="p-0">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
