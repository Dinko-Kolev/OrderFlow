import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '../contexts/ThemeContext';
import { 
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Users,
  Table,
  Calendar,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Home,
  Building2,
  UtensilsCrossed
} from 'lucide-react';

export default function Sidebar({ isOpen, onToggle }) {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [expandedGroups, setExpandedGroups] = useState({
    operations: true,
    venue: true
  });

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const isActive = (path) => router.pathname === path;

  const navigationGroups = [
    {
      name: 'Main',
      items: [
        {
          name: 'Dashboard',
          href: '/',
          icon: LayoutDashboard,
          badge: null
        }
      ]
    },
    {
      name: 'Operations',
      key: 'operations',
      items: [
        {
          name: 'Products',
          href: '/products',
          icon: Package,
          badge: null
        },
        {
          name: 'Categories',
          href: '/categories',
          icon: Tag,
          badge: null
        },
        {
          name: 'Orders',
          href: '/orders',
          icon: ShoppingCart,
          badge: null
        },
        {
          name: 'Customers',
          href: '/customers',
          icon: Users,
          badge: null
        }
      ]
    },
    {
      name: 'Venue Management',
      key: 'venue',
      items: [
        {
          name: 'Tables',
          href: '/tables',
          icon: Table,
          badge: null
        },
        {
          name: 'Reservations',
          href: '/reservations',
          icon: Calendar,
          badge: null
        },
        {
          name: 'Calendar',
          href: '/calendar',
          icon: Calendar,
          badge: null
        }
      ]
    },
    {
      name: 'Analytics',
      items: [
        {
          name: 'Analytics',
          href: '/analytics',
          icon: BarChart3,
          badge: null
        }
      ]
    },
    {
      name: 'System',
      items: [
        {
          name: 'Settings',
          href: '/settings',
          icon: Settings,
          badge: null
        },
        {
          name: 'Restaurant Settings',
          href: '/restaurant-settings',
          icon: Building2,
          badge: null
        }
      ]
    }
  ];

  return (
    <div className={`
      fixed left-0 top-0 z-40 h-screen w-64 transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0 lg:fixed lg:inset-0
      bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700
      shadow-xl lg:shadow-none
    `}>
      {/* Logo/Brand */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            OrderFlow
          </span>
        </div>
        
        {/* Mobile close button */}
        <button
          onClick={onToggle}
          className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-4 py-6 space-y-2">
        {navigationGroups.map((group) => (
          <div key={group.name} className="space-y-1">
            {/* Group Header */}
            {group.key ? (
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-md transition-colors duration-200"
              >
                <span className="flex items-center space-x-2">
                  <span>{group.name}</span>
                </span>
                {expandedGroups[group.key] ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {group.name}
              </div>
            )}

            {/* Group Items */}
            {(!group.key || expandedGroups[group.key]) && (
              <div className="space-y-1">
                {group.items.map((item) => {
                  const IconComponent = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                        ${active 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600 dark:border-blue-400' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200'
                        }
                      `}
                    >
                      <IconComponent className={`w-5 h-5 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-slate-700 z-40">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <p>OrderFlow Admin</p>
          <p className="mt-1">v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
