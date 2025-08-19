import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTheme } from '../contexts/ThemeContext';
import Navigation from '../components/Navigation';
import { 
  ShoppingCart, 
  Users, 
  DollarSign, 
  Package, 
  TrendingUp,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  Activity,
  Target,
  Zap,
  Sun,
  Moon
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  console.log('🎯 Dashboard component rendered!');
  
  const { isDarkMode, toggleTheme } = useTheme();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: '0.00',
    totalProducts: 0,
    totalCategories: 0,
    totalTables: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // New: data for category distribution
  const [categoryChartData, setCategoryChartData] = useState(null);
  const [categoryList, setCategoryList] = useState([]);
  const [productList, setProductList] = useState([]);
  // New: real order data for charts
  const [weeklyOrdersData, setWeeklyOrdersData] = useState(null);
  const [revenueTrendData, setRevenueTrendData] = useState(null);

  useEffect(() => {
    console.log('🔄 useEffect triggered - calling fetchDashboardData');
    fetchDashboardData();
  }, []);

  // Rebuild chart colors when theme changes
  useEffect(() => {
    if (categoryList.length > 0) {
      setCategoryChartData(buildCategoryChartData(categoryList, productList, isDarkMode));
    }
  }, [isDarkMode]);

  // Rebuild order charts when theme changes
  useEffect(() => {
    if (recentOrders.length > 0) {
      setWeeklyOrdersData(buildWeeklyOrdersData(recentOrders, isDarkMode));
      setRevenueTrendData(buildRevenueTrendData(recentOrders, isDarkMode));
    }
  }, [isDarkMode, recentOrders]);

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Starting to fetch dashboard data...');
      alert('🔄 fetchDashboardData called! Check console for more logs.');
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Fetch dashboard statistics
      const statsPromise = fetch('http://localhost:3003/api/admin/dashboard')
        .then(r => {
          if (!r.ok) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          }
          return r.json();
        });
      
      // Fetch recent orders
      const ordersPromise = fetch('http://localhost:3003/api/admin/orders')
        .then(r => {
          if (!r.ok) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          }
          return r.json();
        });
      
      // Fetch categories and products for the doughnut chart
      const categoriesPromise = fetch('http://localhost:3003/api/admin/categories')
        .then(r => {
          if (!r.ok) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          }
          return r.json();
        });
      
      const productsPromise = fetch('http://localhost:3003/api/admin/products')
        .then(r => {
          if (!r.ok) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          }
          return r.json();
        });

      const [statsData, ordersData, categoriesData, productsData] = await Promise.all([
        statsPromise, ordersPromise, categoriesPromise, productsPromise
      ]);

      if (statsData?.success) {
        setStats(statsData.data);
      }
      if (ordersData?.success) {
        const orders = ordersData.data || [];
        setRecentOrders(orders.slice(0, 5));
        
        console.log('🔄 Building charts with orders:', orders.length);
        
        // Build real chart data from orders
        setWeeklyOrdersData(buildWeeklyOrdersData(orders, isDarkMode));
        setRevenueTrendData(buildRevenueTrendData(orders, isDarkMode));
      }
      if (categoriesData?.success) {
        setCategoryList(categoriesData.data || []);
      }
      if (productsData?.success) {
        setProductList(productsData.data || []);
      }

      // Build chart data from live categories/products
      const chartData = buildCategoryChartData(categoriesData?.data || [], productsData?.data || [], isDarkMode);
      setCategoryChartData(chartData);
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      
      // If it's a rate limit error, retry after a delay
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.log('🔄 Rate limited, retrying in 2 seconds...');
        setTimeout(() => {
          fetchDashboardData();
        }, 2000);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate month-over-month change percentage
  const calculateMonthOverMonthChange = (currentValue, previousValue) => {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return Math.round(((currentValue - previousValue) / previousValue) * 100);
  };

  // Get month-over-month stats for display
  const getMonthOverMonthStats = (orders = []) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Current month orders and revenue
    const currentMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at || order.order_date);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });
    
    const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    const currentMonthCount = currentMonthOrders.length;
    
    // Previous month orders and revenue
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const previousMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at || order.order_date);
      return orderDate.getMonth() === previousMonth && orderDate.getFullYear() === previousYear;
    });
    
    const previousMonthRevenue = previousMonthOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    const previousMonthCount = previousMonthOrders.length;
    
    return {
      ordersChange: calculateMonthOverMonthChange(currentMonthCount, previousMonthCount),
      revenueChange: calculateMonthOverMonthChange(currentMonthRevenue, previousMonthRevenue),
      ordersDirection: currentMonthCount >= previousMonthCount ? 'up' : 'down',
      revenueDirection: currentMonthRevenue >= previousMonthRevenue ? 'up' : 'down'
    };
  };

  // Build category chart data from API lists
  const buildCategoryChartData = (categories = [], products = [], darkMode = false) => {
    // Count products per category name; include Uncategorized if any missing
    const nameToCount = new Map();
    categories.forEach(c => nameToCount.set(c.name || 'Uncategorized', 0));
    let uncategorizedCount = 0;

    products.forEach(p => {
      const name = p.category_name || 'Uncategorized';
      if (nameToCount.has(name)) {
        nameToCount.set(name, (nameToCount.get(name) || 0) + 1);
      } else {
        // If the product has a category not in categories list, count it too
        nameToCount.set(name, 1);
      }
      if (!p.category_name) uncategorizedCount += 1;
    });

    const labels = Array.from(nameToCount.keys());
    const data = Array.from(nameToCount.values());

    // Color palettes
    const lightColors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#14B8A6','#F472B6','#22C55E','#F97316','#06B6D4','#A855F7','#84CC16'];
    const darkColors  = ['#60A5FA','#34D399','#FBBF24','#F87171','#A78BFA','#2DD4BF','#F472B6','#4ADE80','#FB923C','#22D3EE','#C084FC','#A3E635'];
    const palette = darkMode ? darkColors : lightColors;

    const backgroundColor = labels.map((_, idx) => palette[idx % palette.length]);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 0,
        },
      ],
    };
  };

  // Build weekly orders data from real order data
  const buildWeeklyOrdersData = (orders = [], darkMode = false) => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    // Get start of current week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0); // Start at beginning of day
    
    // Get end of current week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999); // End at end of day
    
    const dailyCounts = new Array(7).fill(0);
    
    orders.forEach(order => {
      const orderDate = new Date(order.created_at || order.order_date);
      // Check if order is within current week
      if (orderDate >= startOfWeek && orderDate <= endOfWeek) {
        const dayIndex = orderDate.getDay();
        dailyCounts[dayIndex]++;
      }
    });
    
    return {
      labels: daysOfWeek,
      datasets: [
        {
          label: 'Orders',
          data: dailyCounts,
          backgroundColor: darkMode ? [
            'rgba(96, 165, 250, 0.8)',
            'rgba(52, 211, 153, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(248, 113, 113, 0.8)',
            'rgba(167, 139, 250, 0.8)',
            'rgba(244, 114, 182, 0.8)',
            'rgba(56, 189, 248, 0.8)',
          ] : [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(14, 165, 233, 0.8)',
          ],
          borderRadius: 8,
        },
      ],
    };
  };

  // Build revenue trend data from real order data
  const buildRevenueTrendData = (orders = [], darkMode = false) => {
    console.log('🚀 buildRevenueTrendData called with', orders.length, 'orders');
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get current month and 5 months before it (6 months total)
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      let monthIndex = currentMonth - i;
      let monthYear = currentYear;
      
      // Handle year boundary (e.g., if current month is Jan, we need Dec from previous year)
      if (monthIndex < 0) {
        monthIndex += 12;
        monthYear -= 1;
      }
      
      last6Months.push({
        month: monthIndex,
        monthName: months[monthIndex],
        year: monthYear,
        revenue: 0
      });
    }
    
    // Debug: Let's see what we're actually getting
    console.log('Debug - Current month:', currentMonth, '(', months[currentMonth], ')');
    console.log('Debug - 6 months array:', last6Months.map(m => `${m.monthName} (${m.month})`));
    console.log('Debug - Date now:', now.toDateString());
    console.log('Debug - Month calculation:', `currentMonth(${currentMonth}) - i(5,4,3,2,1,0) = [${[5,4,3,2,1,0].map(i => currentMonth - i).join(', ')}]`);
    
    // Expected: If current month is Aug (7), we should get: Mar(2), Apr(3), May(4), Jun(5), Jul(6), Aug(7)
    // But if we're getting Jun as last, something is wrong with the calculation
    
    // Calculate revenue for each month
    console.log('🔍 Processing orders for revenue calculation...');
    let processedOrders = 0;
    
    orders.forEach(order => {
      const orderDate = new Date(order.created_at || order.order_date);
      const orderMonth = orderDate.getMonth();
      const orderYear = orderDate.getFullYear();
      
      // Debug: Log some sample order dates
      if (processedOrders < 5) {
        console.log(`  Order ${order.id}: date=${orderDate.toDateString()}, month=${orderMonth} (${months[orderMonth]}), year=${orderYear}, amount=${order.total_amount}`);
      }
      
      // Find matching month and year
      const monthData = last6Months.find(m => m.month === orderMonth && m.year === orderYear);
      if (monthData) {
        monthData.revenue += parseFloat(order.total_amount || 0);
        processedOrders++;
      } else {
        console.log(`  ⚠️ Order ${order.id} date ${orderDate.toDateString()} didn't match any month in range`);
      }
    });
    
    console.log(`✅ Processed ${processedOrders} orders for revenue calculation`);
    
    return {
      labels: last6Months.map(m => m.monthName),
      datasets: [
        {
          label: 'Revenue',
          data: last6Months.map(m => m.revenue),
          borderColor: darkMode ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)',
          backgroundColor: darkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { variant: 'secondary', text: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      'processing': { variant: 'default', text: 'Processing', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      'completed': { variant: 'default', text: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      'cancelled': { variant: 'destructive', text: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', text: status, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  // Use dynamic chart data or minimal fallbacks
  const categoryData = categoryChartData || {
    labels: ['No data'],
    datasets: [
      {
        data: [1],
        backgroundColor: [isDarkMode ? '#334155' : '#e5e7eb'],
        borderWidth: 0,
      },
    ],
  };

  const weeklyData = weeklyOrdersData || {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        label: 'Orders',
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.8)' : 'rgba(59, 130, 246, 0.8)',
        borderRadius: 8,
      },
    ],
  };

  const revenueData = revenueTrendData || {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [0, 0, 0, 0, 0, 0],
        borderColor: isDarkMode ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)',
        backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-6 text-xl text-gray-700 dark:text-gray-300 font-medium">Loading your dashboard...</p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Preparing beautiful charts and insights</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-b border-gray-200 dark:border-slate-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Welcome back! Here's what's happening with your restaurant.</p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
              <Button variant="outline" className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                <Calendar className="w-4 h-4 mr-2" />
                Today
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 shadow-lg">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Reports
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <div className="flex items-center mt-2">
                {(() => {
                  const monthStats = getMonthOverMonthStats(recentOrders);
                  const ArrowIcon = monthStats.ordersDirection === 'up' ? ArrowUp : ArrowDown;
                  const colorClass = monthStats.ordersDirection === 'up' ? 'text-green-500' : 'text-red-500';
                  const textColorClass = monthStats.ordersDirection === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                  
                  return (
                    <>
                      <ArrowIcon className={`h-4 w-4 ${colorClass} mr-1`} />
                      <span className={`text-sm font-medium ${textColorClass}`}>
                        {monthStats.ordersDirection === 'up' ? '+' : ''}{monthStats.ordersChange}%
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">from last month</span>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total Revenue</CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalRevenue)}</div>
              <div className="flex items-center mt-2">
                {(() => {
                  const monthStats = getMonthOverMonthStats(recentOrders);
                  const ArrowIcon = monthStats.revenueDirection === 'up' ? ArrowUp : ArrowDown;
                  const colorClass = monthStats.revenueDirection === 'up' ? 'text-green-500' : 'text-red-500';
                  const textColorClass = monthStats.revenueDirection === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                  
                  return (
                    <>
                      <ArrowIcon className={`h-4 w-4 ${colorClass} mr-1`} />
                      <span className={`text-sm font-medium ${textColorClass}`}>
                        {monthStats.revenueDirection === 'up' ? '+' : ''}{monthStats.revenueChange}%
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">from last month</span>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

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
              <div className="flex items-center mt-2">
                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">+15.3%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

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
              <div className="flex items-center mt-2">
                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">+5.2%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Revenue Trend</CardTitle>
              <CardDescription className="dark:text-gray-400">Monthly revenue performance based on your actual order data</CardDescription>
            </CardHeader>
            <CardContent>
              <Line 
                data={revenueData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      },
                      ticks: {
                        color: isDarkMode ? '#94a3b8' : '#374151',
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        color: isDarkMode ? '#94a3b8' : '#374151',
                      },
                    },
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Orders Chart */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Weekly Orders</CardTitle>
              <CardDescription className="dark:text-gray-400">Daily order volume for the current week based on your actual orders</CardDescription>
            </CardHeader>
            <CardContent>
              <Bar 
                data={weeklyData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      },
                      ticks: {
                        color: isDarkMode ? '#94a3b8' : '#374151',
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        color: isDarkMode ? '#94a3b8' : '#374151',
                      },
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Category Distribution and Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Category Distribution */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Category Distribution</CardTitle>
              <CardDescription className="dark:text-gray-400">Product distribution across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <Doughnut 
                  data={categoryData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: isDarkMode ? '#94a3b8' : '#374151',
                        },
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Recent Orders</CardTitle>
                <CardDescription className="dark:text-gray-400">Latest orders from your customers</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 dark:border-slate-700">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Order ID</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Customer</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Amount</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">#{order.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">{order.first_name} {order.last_name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{order.customer_email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(order.total_amount)}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDate(order.created_at)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 dark:text-gray-400 py-8">
                          No orders found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {recentOrders.length > 0 && (
                  <div className="mt-6 text-center">
                    <Button variant="outline" size="sm" className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      View All Orders
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions and System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Quick Actions */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Quick Actions</CardTitle>
              <CardDescription className="dark:text-gray-400">Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white shadow-lg">
                <Package className="w-4 h-4 mr-2" />
                Add New Product
              </Button>
              <Button className="w-full justify-start bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white shadow-lg">
                <Users className="w-4 h-4 mr-2" />
                View Customers
              </Button>
              <Button className="w-full justify-start bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-600 dark:hover:to-pink-600 text-white shadow-lg">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Process Orders
              </Button>
              <Button className="w-full justify-start bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 dark:hover:from-orange-600 dark:hover:to-red-600 text-white shadow-lg">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Reports
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">System Status</CardTitle>
              <CardDescription className="dark:text-gray-400">Current system health and performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Database Connection</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">API Backend</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin Dashboard</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Running</Badge>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">System Load</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Low</span>
                </div>
                <Progress value={25} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
