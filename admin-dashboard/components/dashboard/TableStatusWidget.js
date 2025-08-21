import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Table as TableIcon, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle
} from 'lucide-react';

const TableStatusWidget = ({ isDarkMode }) => {
  const [tableStatus, setTableStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTableStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3003/api/admin/tables/status');
      const data = await response.json();

      if (data.success) {
        setTableStatus(data.data);
        console.log('📊 Table Status:', data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch table status');
      }
    } catch (err) {
      console.error('Table status fetch error:', err);
      setError('Failed to load table status');
      if (window.showToast) {
        window.showToast('Failed to load table status', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableStatus();
    const interval = setInterval(fetchTableStatus, 30 * 1000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Table Status
            </CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TableIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Table Status
            </CardTitle>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button 
              onClick={fetchTableStatus}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tableStatus) {
    return null;
  }

  const { total_tables, active_tables, reserved_tables, available_tables } = tableStatus;
  const utilizationRate = total_tables > 0 ? Math.round((reserved_tables / total_tables) * 100) : 0;

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Table Status
            </CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Current restaurant capacity
            </p>
          </div>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <TableIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {total_tables}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total Tables
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {utilizationRate}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Utilization
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-gray-600 dark:text-gray-300">Available</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                {available_tables}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-gray-600 dark:text-gray-300">Reserved</span>
              </div>
              <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                {reserved_tables}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-600 dark:text-gray-300">Active</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {active_tables}
              </Badge>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TableStatusWidget;
