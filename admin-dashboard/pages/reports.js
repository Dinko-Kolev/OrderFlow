import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import apiClient from '../lib/api';
import { 
  BarChart3,
  TrendingUp,
  Users,
  Package,
  Calendar,
  Download,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Clock,
  MapPin
} from 'lucide-react';

export default function Reports() {
  const { isDarkMode } = useTheme();
  const { isAuthenticated, loading: authLoading, isInitialized } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [reportData, setReportData] = useState({
    revenue: null,
    orders: null,
    customers: null,
    products: null,
    reservations: null
  });

  useEffect(() => {
    if (isInitialized && !authLoading && isAuthenticated()) {
      fetchReportData();
    }
  }, [isInitialized, authLoading, isAuthenticated, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      // Fetch data from multiple sources
      const [ordersResult, customersResult, productsResult, reservationsResult] = await Promise.allSettled([
        apiClient.orders.getAll(),
        apiClient.customers.getAll(),
        apiClient.products.getAll(),
        apiClient.reservations.getAll()
      ]);

      const orders = ordersResult.status === 'fulfilled' ? ordersResult.value.data || [] : [];
      const customers = customersResult.status === 'fulfilled' ? customersResult.value.data || [] : [];
      const products = productsResult.status === 'fulfilled' ? productsResult.value.data || [] : [];
      const reservations = reservationsResult.status === 'fulfilled' ? reservationsResult.value.data || [] : [];

      // Filter data by date range
      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= startDate && orderDate <= endDate;
      });

      const filteredReservations = reservations.filter(reservation => {
        const reservationDate = new Date(reservation.reservation_date);
        return reservationDate >= startDate && reservationDate <= endDate;
      });

      // Process data for reports
      setReportData({
        revenue: processRevenueData(filteredOrders),
        orders: processOrderData(filteredOrders),
        customers: processCustomerData(customers),
        products: processProductData(products, filteredOrders),
        reservations: processReservationData(filteredReservations)
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processRevenueData = (orders) => {
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    
    // Group by day for trend
    const dailyRevenue = {};
    orders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + parseFloat(order.total_amount || 0);
    });

    return {
      total: totalRevenue,
      average: averageOrderValue,
      daily: dailyRevenue,
      count: orders.length
    };
  };

  const processOrderData = (orders) => {
    const statusCounts = {};
    const hourlyCounts = {};
    
    orders.forEach(order => {
      // Status counts
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      
      // Hourly distribution
      const hour = new Date(order.created_at).getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });

    return {
      total: orders.length,
      statusCounts,
      hourlyCounts
    };
  };

  const processCustomerData = (customers) => {
    const newCustomers = customers.filter(customer => {
      const customerDate = new Date(customer.created_at);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      return customerDate >= startDate;
    });

    return {
      total: customers.length,
      new: newCustomers.length,
      withEmail: customers.filter(c => c.email).length,
      withPhone: customers.filter(c => c.phone).length
    };
  };

  const processProductData = (products, orders) => {
    // This would need order items data - simplified for now
    return {
      total: products.length,
      categories: [...new Set(products.map(p => p.category))].length
    };
  };

  const processReservationData = (reservations) => {
    const statusCounts = {};
    const tableCounts = {};
    
    reservations.forEach(reservation => {
      statusCounts[reservation.status] = (statusCounts[reservation.status] || 0) + 1;
      tableCounts[reservation.table_id] = (tableCounts[reservation.table_id] || 0) + 1;
    });

    return {
      total: reservations.length,
      statusCounts,
      tableCounts
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !reportData.revenue) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 dark:border-blue-400 mx-auto"></div>
              <p className="mt-6 text-xl text-gray-700 dark:text-gray-300 font-medium">Loading reports...</p>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Preparing your analytics data</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-b border-gray-200 dark:border-slate-700 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  📊 Restaurant Analytics
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                  Comprehensive reports and business insights
                </p>
              </div>
              <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
                <Select 
                  value={dateRange} 
                  onValueChange={setDateRange}
                  name="dateRange"
                  id="dateRange"
                >
                  <SelectTrigger className="w-48 border-gray-200 dark:border-slate-600">
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={fetchReportData}
                  className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Revenue Card */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(reportData.revenue?.total)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {reportData.revenue?.count} orders
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders Card */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {reportData.orders?.total || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Avg: {formatCurrency(reportData.revenue?.average)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customers Card */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Customers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {reportData.customers?.total || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {reportData.customers?.new || 0} new
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reservations Card */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reservations</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {reportData.reservations?.total || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Table bookings
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status Distribution */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Order Status Distribution</span>
                </CardTitle>
                <CardDescription>
                  Breakdown of orders by status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.orders?.statusCounts ? (
                  <div className="space-y-3">
                    {Object.entries(reportData.orders.statusCounts).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {status.replace('_', ' ')}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${(count / reportData.orders.total) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No order data available</p>
                )}
              </CardContent>
            </Card>

            {/* Customer Insights */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Customer Insights</span>
                </CardTitle>
                <CardDescription>
                  Customer engagement metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Customers</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {reportData.customers?.total || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Customers</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {reportData.customers?.new || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">With Email</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {reportData.customers?.withEmail || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">With Phone</span>
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {reportData.customers?.withPhone || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reservation Status */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Reservation Status</span>
                </CardTitle>
                <CardDescription>
                  Current reservation breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.reservations?.statusCounts ? (
                  <div className="space-y-3">
                    {Object.entries(reportData.reservations.statusCounts).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No reservation data available</p>
                )}
              </CardContent>
            </Card>

            {/* Product Overview */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Product Overview</span>
                </CardTitle>
                <CardDescription>
                  Menu and category statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Products</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {reportData.products?.total || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Categories</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {reportData.products?.categories || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}