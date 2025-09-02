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
  AlertCircle,
  Info
} from 'lucide-react';
import { tables } from '@/lib/api';

const TableStatusWidget = ({ isDarkMode }) => {
  const [tableStatus, setTableStatus] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTableStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll create a mock table status since the endpoint might not exist
      // This should be replaced with actual API call when the endpoint is available
      const mockTableStatus = {
        total_tables: 12,
        active_tables: 3,
        reserved_tables: 4,
        available_tables: 5
      };
      
      setTableStatus(mockTableStatus);
      console.log('📊 Table Status:', mockTableStatus);
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

  const fetchTables = async () => {
    try {
      const data = await tables.getAll();
      setTables(data.data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  // Calculate availability for different party sizes
  const getAvailabilityForPartySize = (partySize) => {
    const availableTables = tables.filter(table => 
      table.is_active && table.capacity >= partySize
    );
    return availableTables.length;
  };

  // Get common party sizes and their availability
  const getCommonPartySizes = () => {
    const commonSizes = [2, 4, 6, 8, 10];
    return commonSizes.map(size => ({
      size,
      available: getAvailabilityForPartySize(size)
    }));
  };

  // Check if there are any critical availability issues
  const getAvailabilityWarnings = () => {
    const warnings = [];
    const commonSizes = getCommonPartySizes();
    
    // Check for sizes with no available tables
    commonSizes.forEach(({ size, available }) => {
      if (available === 0) {
        warnings.push(`No tables available for ${size} guests`);
      } else if (available <= 1) {
        warnings.push(`Limited availability for ${size} guests (${available} table)`);
      }
    });
    
    return warnings;
  };

  useEffect(() => {
    fetchTableStatus();
    fetchTables(); // Fetch tables when the widget loads
    const interval = setInterval(() => {
      fetchTableStatus();
      fetchTables(); // Refresh tables every 30 seconds
    }, 30 * 1000);
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
  const availabilityWarnings = getAvailabilityWarnings();
  const hasWarnings = availabilityWarnings.length > 0;

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

          {/* Availability Warnings */}
          {hasWarnings && (
            <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                  Availability Warnings
                </span>
              </div>
              <div className="space-y-1">
                {availabilityWarnings.map((warning, index) => (
                  <div key={index} className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Party Size Breakdown */}
          <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                Party Size Availability
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {getCommonPartySizes().map(({ size, available }) => (
                <div key={size} className="text-center">
                  <div className={`text-sm font-bold ${
                    available === 0 ? 'text-red-600 dark:text-red-400' : 
                    available <= 1 ? 'text-orange-600 dark:text-orange-400' : 
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {available}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {size} guests
                  </div>
                </div>
              ))}
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
