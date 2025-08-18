import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { useTheme } from '../contexts/ThemeContext';
import ToastContainer from './ToastContainer';
import { 
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  Sun,
  Moon
} from 'lucide-react';

export default function Navigation() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href) => router.pathname === href;

  return (
    <>
      <nav className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                OrderFlow Admin
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.name}
                    variant={isActive(item.href) ? "default" : "ghost"}
                    onClick={() => router.push(item.href)}
                    className={`${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    } transition-all duration-200`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Button>
                );
              })}
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center space-x-3">
              <Button
                onClick={toggleTheme}
                variant="outline"
                size="sm"
                className="border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 mr-2" />
                    Light
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 mr-2" />
                    Dark
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Toast Container for notifications */}
      <ToastContainer />
    </>
  );
}
