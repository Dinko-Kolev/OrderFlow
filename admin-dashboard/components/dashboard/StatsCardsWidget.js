import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Users, Euro, Package, ArrowUp, ArrowDown } from 'lucide-react';

const StatsCardsWidget = ({ isDarkMode }) => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: '0.00',
    totalProducts: 0,
    totalCategories: 0,
    totalTables: 0
  });
  const [monthlyStats, setMonthlyStats] = useState({
    ordersChange: 0,
    revenueChange: 0,
    ordersDirection: 'up',
    revenueDirection: 'up'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const calculateMonthlyChange = useCallback((orders) => {
    if (!orders?.length) return {
      ordersChange: 0,
      revenueChange: 0,
      ordersDirection: 'up',
      revenueDirection: 'up'
    };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Current month stats
    const currentMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });
    
    const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => 
      sum + parseFloat(order.total_amount || 0), 0
    );
    const currentMonthCount = currentMonthOrders.length;
    
    // Previous month stats
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const previousMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.getMonth() === previousMonth && orderDate.getFullYear() === previousYear;
    });
    
    const previousMonthRevenue = previousMonthOrders.reduce((sum, order) => 
      sum + parseFloat(order.total_amount || 0), 0
    );
    const previousMonthCount = previousMonthOrders.length;
    
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Log the calculations for debugging
    console.log('📊 Monthly Stats Calculation:', {
      currentMonth: {
        month: currentMonth,
        orders: currentMonthCount,
        revenue: currentMonthRevenue
      },
      previousMonth: {
        month: previousMonth,
        orders: previousMonthCount,
        revenue: previousMonthRevenue
      }
    });
    
    return {
      ordersChange: calculateChange(currentMonthCount, previousMonthCount),
      revenueChange: calculateChange(currentMonthRevenue, previousMonthRevenue),
      ordersDirection: currentMonthCount >= previousMonthCount ? 'up' : 'down',
      revenueDirection: currentMonthRevenue >= previousMonthRevenue ? 'up' : 'down'
    };
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both stats and orders for monthly calculations
      const [statsResponse, ordersResponse] = await Promise.all([
        fetch('http://localhost:3003/api/admin/dashboard'),
        fetch('http://localhost:3003/api/admin/orders')
      ]);

      const statsData = await statsResponse.json();
      const ordersData = await ordersResponse.json();

      if (!statsData.success || !ordersData.success) {
        throw new Error('Failed to fetch dashboard data');
      }

      setStats(statsData.data);
      const monthlyChanges = calculateMonthlyChange(ordersData.data);
      setMonthlyStats(monthlyChanges);

      // Log the processed data
      console.log('📊 Dashboard Stats:', {
        stats: statsData.data,
        monthlyChanges
      });

    } catch (err) {
      console.error('Stats fetch error:', err);
      setError('Failed to load dashboard statistics');
      if (window.showToast) {
        window.showToast('Failed to load statistics', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [calculateMonthlyChange]);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const renderChangeIndicator = (change, direction) => {
    const ArrowIcon = direction === 'up' ? ArrowUp : ArrowDown;
    const colorClass = direction === 'up' ? 'text-green-500' : 'text-red-500';
    const textColorClass = direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    
    return (
      <div className="flex items-center mt-2">
        <ArrowIcon className={`h-4 w-4 ${colorClass} mr-1`} />
        <span className={`text-sm font-medium ${textColorClass}`}>
          {direction === 'up' ? '+' : ''}{change}%
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">from last month</span>
      </div>
    );
  };

  if (loading && !stats.totalOrders) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="pb-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Orders Card */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total Orders</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalOrders}</div>
          {renderChangeIndicator(monthlyStats.ordersChange, monthlyStats.ordersDirection)}
        </CardContent>
      </Card>

      {/* Revenue Card */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total Revenue</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Euro className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalRevenue)}</div>
          {renderChangeIndicator(monthlyStats.revenueChange, monthlyStats.revenueDirection)}
        </CardContent>
      </Card>

      {/* Customers Card */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total Customers</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalCustomers}</div>
          {renderChangeIndicator(15.3, 'up')} {/* Example static value - could be made dynamic */}
        </CardContent>
      </Card>

      {/* Products Card */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">Active Products</CardTitle>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalProducts}</div>
          {renderChangeIndicator(5.2, 'up')} {/* Example static value - could be made dynamic */}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCardsWidget;
