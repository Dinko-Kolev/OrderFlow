import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import { 
  Table as TableIcon,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Eye,
  Edit,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function Tables() {
  const { isDarkMode } = useTheme();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3003/api/admin/tables');
      const data = await response.json();

      if (data.success) {
        setTables(data.data);
        console.log('🍽️ Tables loaded:', data.data);
        if (window.showToast) {
          window.showToast(`${data.data.length} tables loaded successfully`, 'success', 2000);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch tables');
      }
    } catch (err) {
      console.error('Tables fetch error:', err);
      setError('Failed to load tables');
      if (window.showToast) {
        window.showToast('Failed to load tables', 'error', 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 30 * 1000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'available': { 
        color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        icon: CheckCircle,
        text: 'Available'
      },
      'reserved': { 
        color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
        icon: Clock,
        text: 'Reserved'
      }
    };
    
    const config = statusConfig[status] || statusConfig['available'];
    const IconComponent = config.icon;
    
    return (
      <Badge variant="secondary" className={config.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getTableTypeBadge = (type) => {
    const typeConfig = {
      'standard': { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
      'window': { color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
      'outdoor': { color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
      'private': { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' }
    };
    
    const config = typeConfig[type] || typeConfig['standard'];
    
    return (
      <Badge variant="secondary" className={config.color}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5); // Format HH:MM
  };

  if (loading && tables.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-6 text-xl text-gray-700 dark:text-gray-300 font-medium">Loading tables...</p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Preparing your table data</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
        
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-b border-gray-200 dark:border-slate-700 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Tables
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                  Manage restaurant tables and monitor their current status
                </p>
              </div>
              <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={fetchTables}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white shadow-lg">
                  <TableIcon className="w-4 h-4 mr-2" />
                  Add Table
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
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TableIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Tables</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tables.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {tables.filter(t => t.current_status === 'available').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reserved</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {tables.filter(t => t.current_status === 'reserved').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Capacity</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {tables.reduce((sum, t) => sum + t.capacity, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tables Grid */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TableIcon className="h-5 w-5" />
                <span>Restaurant Tables</span>
              </CardTitle>
              <CardDescription>
                Current status and details for all {tables.length} tables
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tables.length === 0 ? (
                <div className="text-center py-12">
                  <TableIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No tables found</h3>
                  <p className="text-gray-500 dark:text-gray-400">Contact your administrator to set up tables</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {tables.map((table) => (
                    <div 
                      key={table.id} 
                      className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
                        table.current_status === 'available' 
                          ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' 
                          : 'border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {table.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Table {table.table_number}
                          </p>
                        </div>
                        {getStatusBadge(table.current_status)}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {table.capacity} guest{table.capacity !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {table.location_description}
                          </span>
                        </div>

                        {getTableTypeBadge(table.table_type)}

                        {table.today_reservation && (
                          <div className="mt-3 p-2 bg-white dark:bg-slate-700 rounded border">
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">
                              Current Reservation:
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {table.today_reservation.customer_name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {formatTime(table.today_reservation.reservation_time)} - {table.today_reservation.number_of_guests} guests
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
