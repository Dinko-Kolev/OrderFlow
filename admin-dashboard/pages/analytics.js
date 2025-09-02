import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import apiClient from '../lib/api';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react';

export default function Analytics() {
  const { isDarkMode } = useTheme();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // Use the correct endpoint that exists
      const response = await fetch('http://localhost:3003/api/admin/dashboard/sales');
      const data = await response.json();
      
      if (data.success) {
        setAnalyticsData(data.data);
        if (window.showToast) {
          window.showToast('Analytics data loaded successfully', 'success', 2000);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (window.showToast) {
        window.showToast('Failed to load analytics data', 'error', 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '€0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    if (!value) return '0%';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading && !analyticsData) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 dark:border-blue-400 mx-auto"></div>
              <p className="mt-6 text-xl text-gray-700 dark:text-gray-300 font-medium">Loading analytics...</p>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Preparing your business insights</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
      <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
        
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-b border-gray-200 dark:border-slate-700 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Analytics
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                  Comprehensive business insights and performance metrics
                </p>
              </div>
              <div className="mt-6 lg:mt-0 flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => fetchAnalyticsData()}
                  className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                >
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analyticsData && analyticsData.length > 0 
                        ? formatCurrency(analyticsData.reduce((sum, item) => sum + parseFloat(item.daily_revenue || 0), 0))
                        : '€0.00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analyticsData && analyticsData.length > 0 
                        ? analyticsData.reduce((sum, item) => sum + parseInt(item.order_count || 0), 0)
                        : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Order Value</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analyticsData && analyticsData.length > 0 
                        ? formatCurrency(analyticsData.reduce((sum, item) => sum + parseFloat(item.average_order_value || 0), 0) / analyticsData.length)
                        : '€0.00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Days Tracked</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analyticsData ? analyticsData.length : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <span>Sales Analytics</span>
                </CardTitle>
                <CardDescription>Daily sales performance over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData && analyticsData.length > 0 ? (
                  <div className="space-y-4">
                    {analyticsData.slice(0, 7).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {item.order_count} orders
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(item.daily_revenue)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Avg: {formatCurrency(item.average_order_value)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No sales data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>Performance Summary</span>
                </CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue (30 days)</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {analyticsData && analyticsData.length > 0 
                        ? formatCurrency(analyticsData.reduce((sum, item) => sum + parseFloat(item.daily_revenue || 0), 0))
                        : '€0.00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Orders (30 days)</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {analyticsData && analyticsData.length > 0 
                        ? analyticsData.reduce((sum, item) => sum + parseInt(item.order_count || 0), 0)
                        : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Average Daily Revenue</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {analyticsData && analyticsData.length > 0 
                        ? formatCurrency(analyticsData.reduce((sum, item) => sum + parseFloat(item.daily_revenue || 0), 0) / analyticsData.length)
                        : '€0.00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
    </ProtectedRoute>
  );
}
