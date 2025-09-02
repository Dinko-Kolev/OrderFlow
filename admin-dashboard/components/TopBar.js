import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { 
  Menu,
  Sun,
  Moon,
  Bell,
  User,
  Search,
  LogOut,
  Package,
  Users,
  Calendar,
  MapPin,
  ArrowRight
} from 'lucide-react';
import apiClient from '../lib/api';

export default function TopBar({ onSidebarToggle }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout, loading, isInitialized } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Ensure component is mounted before showing user data
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Global search functionality
  const performGlobalSearch = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Search across multiple entities in parallel
      const [ordersResult, customersResult, productsResult, reservationsResult] = await Promise.allSettled([
        apiClient.orders.getAll({ search: query, limit: 5 }).catch(() => ({ data: [] })),
        apiClient.customers.getAll({ search: query, limit: 5 }).catch(() => ({ data: [] })),
        apiClient.products.getAll({ search: query, limit: 5 }).catch(() => ({ data: [] })),
        apiClient.reservations.getAll({ search: query, limit: 5 }).catch(() => ({ data: [] }))
      ]);

      const results = [];

      // Process orders
      if (ordersResult.status === 'fulfilled' && ordersResult.value?.data) {
        ordersResult.value.data.forEach(order => {
          results.push({
            type: 'order',
            id: order.id,
            title: `Order #${order.id}`,
            subtitle: `${order.first_name} ${order.last_name} - $${order.total_amount}`,
            url: `/orders`,
            icon: Package
          });
        });
      }

      // Process customers
      if (customersResult.status === 'fulfilled' && customersResult.value?.data) {
        customersResult.value.data.forEach(customer => {
          results.push({
            type: 'customer',
            id: customer.id,
            title: `${customer.first_name} ${customer.last_name}`,
            subtitle: customer.email || customer.phone || 'No contact info',
            url: `/customers`,
            icon: Users
          });
        });
      }

      // Process products
      if (productsResult.status === 'fulfilled' && productsResult.value?.data) {
        productsResult.value.data.forEach(product => {
          results.push({
            type: 'product',
            id: product.id,
            title: product.name,
            subtitle: product.category || 'No category',
            url: `/products`,
            icon: Package
          });
        });
      }

      // Process reservations
      if (reservationsResult.status === 'fulfilled' && reservationsResult.value?.data) {
        reservationsResult.value.data.forEach(reservation => {
          results.push({
            type: 'reservation',
            id: reservation.id,
            title: `Reservation #${reservation.id}`,
            subtitle: `${reservation.customer_name} - Table ${reservation.table_id}`,
            url: `/reservations`,
            icon: Calendar
          });
        });
      }

      setSearchResults(results);
      setShowSearchResults(results.length > 0);
      setSelectedResultIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performGlobalSearch(query);
    }, 300);
  };

  // Handle search result click
  const handleSearchResultClick = (result) => {
    setShowSearchResults(false);
    setSearchQuery('');
    setSelectedResultIndex(-1);
    // Navigate to the result (you might want to use Next.js router here)
    window.location.href = result.url;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSearchResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedResultIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedResultIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedResultIndex >= 0 && selectedResultIndex < searchResults.length) {
          handleSearchResultClick(searchResults[selectedResultIndex]);
        }
        break;
      case 'Escape':
        setShowSearchResults(false);
        setSelectedResultIndex(-1);
        break;
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search Bar */}
          <div className="hidden md:flex relative" ref={searchRef}>
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-2 w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80">
              <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search orders, customers, products..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 w-full"
              />
              {isSearching && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
                    Search Results ({searchResults.length})
                  </div>
                  {searchResults.map((result, index) => {
                    const IconComponent = result.icon;
                    const isSelected = index === selectedResultIndex;
                    return (
                      <div
                        key={`${result.type}-${result.id}-${index}`}
                        onClick={() => handleSearchResultClick(result)}
                        className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-blue-100 dark:bg-blue-900/30' 
                            : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <IconComponent className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {result.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {result.subtitle}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Results */}
            {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-50">
                <div className="p-4 text-center">
                  <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Try searching for orders, customers, products, or reservations
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {/* User Info */}
          <div className="flex items-center space-x-2">
            {!isMounted || loading ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">{user?.username || 'Guest'}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    ({user?.role || 'guest'})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
