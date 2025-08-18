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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard statistics
      const statsResponse = await fetch('http://localhost:3003/api/admin/dashboard');
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Fetch recent orders
      const ordersResponse = await fetch('http://localhost:3003/api/admin/orders');
      const ordersData = await ordersResponse.json();
      
      if (ordersData.success) {
        setRecentOrders(ordersData.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  // Chart data with dark mode support
  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [12000, 19000, 15000, 25000, 22000, 30000],
        borderColor: isDarkMode ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)',
        backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const orderData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Orders',
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: isDarkMode ? [
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

  const categoryData = {
    labels: ['Pizzas', 'Drinks', 'Desserts', 'Sides', 'Salads'],
    datasets: [
      {
        data: [45, 25, 15, 10, 5],
        backgroundColor: isDarkMode ? [
          '#60A5FA',
          '#34D399',
          '#FBBF24',
          '#F87171',
          '#A78BFA',
        ] : [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
        ],
        borderWidth: 0,
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
                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">+20.1%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">from last month</span>
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
                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">+10.5%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">from last month</span>
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
              <CardDescription className="dark:text-gray-400">Monthly revenue performance over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <Line 
                data={salesData} 
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
              <CardDescription className="dark:text-gray-400">Daily order volume for the current week</CardDescription>
            </CardHeader>
            <CardContent>
              <Bar 
                data={orderData} 
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
