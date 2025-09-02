import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import StatsCardsWidget from '../components/dashboard/StatsCardsWidget';
import RevenueTrendWidget from '../components/dashboard/RevenueTrendWidget';
import WeeklyOrdersWidget from '../components/dashboard/WeeklyOrdersWidget';
import CategoryDistributionWidget from '../components/dashboard/CategoryDistributionWidget';
import TableStatusWidget from '../components/dashboard/TableStatusWidget';
import UpcomingReservationsWidget from '../components/dashboard/UpcomingReservationsWidget';
import RecentOrdersWidget from '../components/dashboard/RecentOrdersWidget';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);

      if (window.showToast) {
        window.showToast('Dashboard refreshed successfully! 📊', 'success', 2000);
      }
    } catch (error) {
      console.error('Dashboard refresh error:', error);
      setError('Failed to refresh dashboard. Please try again.');

      if (window.showToast) {
        window.showToast('Failed to refresh dashboard', 'error', 4000);
      }
    } finally {
      setLoading(false);
    }
  };

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
                    Dashboard
                  </h1>
                  <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                    Welcome back! Here's what's happening with your restaurant.
                  </p>
                </div>
                <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Refreshing...' : 'Refresh Data'}
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 shadow-lg"
                    onClick={() => router.push('/reports')}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Reports
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            {/* Stats Cards */}
            <StatsCardsWidget />

            {/* Revenue Trend */}
            <RevenueTrendWidget />

            {/* Weekly Orders + Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeeklyOrdersWidget />
              <CategoryDistributionWidget />
            </div>

            {/* Table Status + Upcoming Reservations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TableStatusWidget />
              <UpcomingReservationsWidget />
            </div>

            {/* Recent Orders */}
            <RecentOrdersWidget />
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}