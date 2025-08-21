import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Euro, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

export const MonthlyStatsWidget = () => {
  const [monthlyStats, setMonthlyStats] = useState({
    orders: 0,
    revenue: 0,
    customers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMonthlyStats = async () => {
      try {
        setLoading(true);
        
        // Fetch current month orders
        const ordersResponse = await fetch('http://localhost:3003/api/admin/dashboard/current-month-orders');
        if (!ordersResponse.ok) throw new Error('Failed to fetch current month orders');
        const ordersData = await ordersResponse.json();
        
        // Fetch current month revenue
        const revenueResponse = await fetch('http://localhost:3003/api/admin/dashboard/current-month-revenue');
        if (!revenueResponse.ok) throw new Error('Failed to fetch current month revenue');
        const revenueData = await revenueResponse.json();
        
        // Fetch current month customers
        const customersResponse = await fetch('http://localhost:3003/api/admin/dashboard/current-month-customers');
        if (!customersResponse.ok) throw new Error('Failed to fetch current month customers');
        const customersData = await customersResponse.json();
        
        setMonthlyStats({
          orders: ordersData.data || 0,
          revenue: revenueData.data || 0,
          customers: customersData.data || 0
        });
        
      } catch (err) {
        console.error('Error fetching monthly stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyStats();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getCurrentMonthName = () => {
    return new Date().toLocaleString('en-US', { month: 'long' });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
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
        <p className="text-red-800 dark:text-red-200">Error loading monthly stats: {error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Orders Card */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Total Orders {getCurrentMonthName()} {new Date().getFullYear()}
            </CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {monthlyStats.orders}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Orders this month
          </p>
        </CardContent>
      </Card>

      {/* Total Revenue Card */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Total Revenue {getCurrentMonthName()} {new Date().getFullYear()}
            </CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Euro className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(monthlyStats.revenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Revenue this month
          </p>
        </CardContent>
      </Card>

      {/* Total Customers Card */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Total Customers {getCurrentMonthName()} {new Date().getFullYear()}
            </CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {monthlyStats.customers}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            New customers this month
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyStatsWidget;
