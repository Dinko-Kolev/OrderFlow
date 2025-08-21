import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import NewReservationModal from '../components/NewReservationModal';
import EditReservationModal from '../components/EditReservationModal';
import { 
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
  Building2,
  Save,
  RotateCcw
} from 'lucide-react';

export default function Reservations() {
  const { isDarkMode } = useTheme();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReservations, setTotalReservations] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [restaurantConfig, setRestaurantConfig] = useState({});
  const [workingHours, setWorkingHours] = useState([]);
  const [savingConfig, setSavingConfig] = useState(false);
  const [showNewReservationModal, setShowNewReservationModal] = useState(false);
  const [showEditReservationModal, setShowEditReservationModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [tables, setTables] = useState([]);

  const fetchReservations = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      });

      if (searchTerm) params.append('customer_name', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);

      const response = await fetch(`http://localhost:3003/api/admin/reservations?${params}`);
      const data = await response.json();

      if (data.success) {
        setReservations(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalReservations(data.pagination.total);
        setCurrentPage(data.pagination.page);
        console.log('📅 Reservations loaded:', data.data);
        if (window.showToast) {
          window.showToast(`${data.data.length} reservations loaded`, 'success', 2000);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch reservations');
      }
    } catch (err) {
      console.error('Reservations fetch error:', err);
      setError('Failed to load reservations');
      if (window.showToast) {
        window.showToast('Failed to load reservations', 'error', 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations(1);
    fetchRestaurantConfig();
    fetchTables();
  }, [searchTerm, statusFilter, dateFilter]);

  const fetchTables = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/admin/tables');
      const data = await response.json();
      if (data.success) {
        setTables(data.data);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const fetchRestaurantConfig = async () => {
    try {
      // Fetch restaurant configuration
      const configResponse = await fetch('http://localhost:3003/api/admin/restaurant/config');
      const configData = await configResponse.json();
      if (configData.success) {
        setRestaurantConfig(configData.data);
      }

      // Fetch working hours
      const hoursResponse = await fetch('http://localhost:3003/api/admin/restaurant/working-hours');
      const hoursData = await hoursResponse.json();
      if (hoursData.success) {
        setWorkingHours(hoursData.data);
      }
    } catch (error) {
      console.error('Error fetching restaurant config:', error);
    }
  };



  const handleCreateReservation = async (reservationData) => {
    try {
      const response = await fetch('http://localhost:3003/api/admin/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData)
      });

      const data = await response.json();
      if (data.success) {
        if (window.showToast) {
          window.showToast('Reservation created successfully', 'success', 2000);
        }
        setShowNewReservationModal(false);
        fetchReservations(currentPage);
      } else {
        throw new Error(data.error || 'Failed to create reservation');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      if (window.showToast) {
        window.showToast('Failed to create reservation', 'error', 4000);
      }
    }
  };

  const handleUpdateReservation = async (reservationId, updates) => {
    try {
      const response = await fetch(`http://localhost:3003/api/admin/reservations/${reservationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      if (data.success) {
        if (window.showToast) {
          window.showToast('Reservation updated successfully', 'success', 2000);
        }
        setShowEditReservationModal(false);
        setEditingReservation(null);
        fetchReservations(currentPage);
      } else {
        throw new Error(data.error || 'Failed to update reservation');
      }
    } catch (error) {
      console.error('Error updating reservation:', error);
      if (window.showToast) {
        window.showToast('Failed to update reservation', 'error', 4000);
      }
    }
  };







  const updateRestaurantConfig = async (key, value) => {
    try {
      const response = await fetch('http://localhost:3003/api/admin/restaurant/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config_key: key, config_value: value })
      });
      
      if (response.ok) {
        if (window.showToast) {
          window.showToast('Configuration updated successfully', 'success', 2000);
        }
        fetchRestaurantConfig(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating configuration:', error);
      if (window.showToast) {
        window.showToast('Failed to update configuration', 'error', 4000);
      }
    }
  };

  const resetToDefaults = async () => {
    try {
      setSavingConfig(true);
      const response = await fetch('http://localhost:3003/api/admin/restaurant/reset-defaults', {
        method: 'POST'
      });
      
      if (response.ok) {
        if (window.showToast) {
          window.showToast('Configuration reset to defaults', 'success', 3000);
        }
        fetchRestaurantConfig(); // Refresh data
      }
    } catch (error) {
      console.error('Error resetting configuration:', error);
      if (window.showToast) {
        window.showToast('Failed to reset configuration', 'error', 4000);
      }
    } finally {
      setSavingConfig(false);
    }
  };

  const handleStatusUpdate = async (reservationId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3003/api/admin/reservations/${reservationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        if (window.showToast) {
          window.showToast(`Reservation status updated to ${newStatus}`, 'success', 2000);
        }
        fetchReservations(currentPage); // Refresh the list
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating reservation status:', error);
      if (window.showToast) {
        window.showToast('Failed to update reservation status', 'error', 4000);
      }
    }
  };

  const handleDeleteReservation = async (reservationId) => {
    if (!confirm('Are you sure you want to delete this reservation? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3003/api/admin/reservations/${reservationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (window.showToast) {
          window.showToast('Reservation deleted successfully', 'success', 2000);
        }
        fetchReservations(currentPage); // Refresh the list
      } else {
        throw new Error('Failed to delete reservation');
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      if (window.showToast) {
        window.showToast('Failed to delete reservation', 'error', 4000);
      }
    }
  };

  const handleViewReservation = (reservation) => {
    // For now, just show details in console. Could be expanded to a modal
    console.log('Viewing reservation:', reservation);
    if (window.showToast) {
      window.showToast(`Viewing reservation for ${reservation.customer_name}`, 'info', 2000);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReservations(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchReservations(page);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'confirmed': { 
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        icon: CheckCircle,
        text: 'Confirmed'
      },
      'seated': { 
        color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        icon: CheckCircle,
        text: 'Seated'
      },
      'completed': { 
        color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400',
        icon: CheckCircle,
        text: 'Completed'
      },
      'cancelled': { 
        color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        icon: XCircle,
        text: 'Cancelled'
      },
      'no_show': { 
        color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
        icon: AlertCircle,
        text: 'No Show'
      }
    };
    
    const config = statusConfig[status] || statusConfig['confirmed'];
    const IconComponent = config.icon;
    
    return (
      <Badge variant="secondary" className={config.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5); // Format HH:MM
  };





  if (loading && reservations.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-6 text-xl text-gray-700 dark:text-gray-300 font-medium">Loading reservations...</p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Preparing your reservation data</p>
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
                  Reservations
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                  Manage all restaurant reservations and customer bookings
                </p>
              </div>
              <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => fetchReservations(currentPage)}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white shadow-lg"
                  onClick={() => setShowNewReservationModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Reservation
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
                    <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Reservations</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalReservations}</p>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">Confirmed</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {reservations.filter(r => r.status === 'confirmed').length}
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {reservations.filter(r => {
                        const today = new Date().toISOString().split('T')[0];
                        return r.reservation_date === today;
                      }).length}
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Guests</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {reservations.reduce((sum, r) => sum + r.number_of_guests, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters & Search</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Customer
                  </label>
                  <Input
                    type="text"
                    placeholder="Name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="seated">Seated</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="flex items-end">
                  <Button type="submit" className="w-full">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Reservation Settings Section */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <CardTitle>Reservation Settings</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    {showSettings ? 'Hide Settings' : 'Show Settings'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetToDefaults}
                    disabled={savingConfig}
                    className="border-orange-200 dark:border-orange-600 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </div>
              </div>
              <CardDescription>
                Configure reservation duration, time slots, and operational settings
              </CardDescription>
            </CardHeader>
            {showSettings && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Duration Settings */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Duration Settings
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Reservation Duration (minutes)
                      </label>
                      <Input
                        type="number"
                        value={restaurantConfig.reservation_duration_minutes || ''}
                        onChange={(e) => updateRestaurantConfig('reservation_duration_minutes', e.target.value)}
                        placeholder="105"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Total time including dining and buffer
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Grace Period (minutes)
                      </label>
                      <Input
                        type="number"
                        value={restaurantConfig.grace_period_minutes || ''}
                        onChange={(e) => updateRestaurantConfig('grace_period_minutes', e.target.value)}
                        placeholder="15"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Late arrival tolerance
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Sitting Time (minutes)
                      </label>
                      <Input
                        type="number"
                        value={restaurantConfig.max_sitting_minutes || ''}
                        onChange={(e) => updateRestaurantConfig('max_sitting_minutes', e.target.value)}
                        placeholder="120"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum time at table
                      </p>
                    </div>
                  </div>

                  {/* Time Slot Settings */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      Time Slot Settings
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Time Slot Interval (minutes)
                      </label>
                      <Input
                        type="number"
                        value={restaurantConfig.time_slot_interval_minutes || ''}
                        onChange={(e) => updateRestaurantConfig('time_slot_interval_minutes', e.target.value)}
                        placeholder="30"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Interval between available times
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Lunch Buffer (minutes)
                      </label>
                      <Input
                        type="number"
                        value={restaurantConfig.lunch_buffer_minutes || ''}
                        onChange={(e) => updateRestaurantConfig('lunch_buffer_minutes', e.target.value)}
                        placeholder="15"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Buffer between lunch reservations
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Dinner Buffer (minutes)
                      </label>
                      <Input
                        type="number"
                        value={restaurantConfig.dinner_buffer_minutes || ''}
                        onChange={(e) => updateRestaurantConfig('dinner_buffer_minutes', e.target.value)}
                        placeholder="15"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Buffer between dinner reservations
                      </p>
                    </div>
                  </div>

                  {/* Booking Settings */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-purple-600" />
                      Booking Settings
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Advance Booking (days)
                      </label>
                      <Input
                        type="number"
                        value={restaurantConfig.advance_booking_days || ''}
                        onChange={(e) => updateRestaurantConfig('advance_booking_days', e.target.value)}
                        placeholder="30"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Days in advance customers can book
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Same Day Booking (hours)
                      </label>
                      <Input
                        type="number"
                        value={restaurantConfig.same_day_booking_hours || ''}
                        onChange={(e) => updateRestaurantConfig('same_day_booking_hours', e.target.value)}
                        placeholder="2"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Hours before service for same-day bookings
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Party Size
                      </label>
                      <Input
                        type="number"
                        value={restaurantConfig.max_party_size || ''}
                        onChange={(e) => updateRestaurantConfig('max_party_size', e.target.value)}
                        placeholder="12"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum guests per reservation
                      </p>
                    </div>
                  </div>
                </div>

                {/* Working Hours Summary */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    Current Working Hours
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {workingHours.map((day) => (
                      <div key={day.day_of_week} className="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {day.day_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {day.is_open ? (
                            <>
                              <div>Open: {day.open_time?.slice(0, 5)} - {day.close_time?.slice(0, 5)}</div>
                              {day.is_lunch_service && (
                                <div>Lunch: {day.lunch_start?.slice(0, 5)} - {day.lunch_end?.slice(0, 5)}</div>
                              )}
                              {day.is_dinner_service && (
                                <div>Dinner: {day.dinner_start?.slice(0, 5)} - {day.dinner_end?.slice(0, 5)}</div>
                              )}
                            </>
                          ) : (
                            <span className="text-red-500">Closed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = '/restaurant-settings'}
                      className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Working Hours
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>



          {/* Reservations Table */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>All Reservations</span>
              </CardTitle>
              <CardDescription>
                Showing {reservations.length} of {totalReservations} reservations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No reservations found</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm || statusFilter !== 'all' || dateFilter 
                      ? 'Try adjusting your search or filters'
                      : 'No reservations have been made yet'
                    }
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200 dark:border-slate-700">
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Customer</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Date & Time</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Table</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Guests</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reservations.map((reservation) => (
                        <TableRow key={reservation.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {reservation.customer_name}
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                <Mail className="h-3 w-3" />
                                <span>{reservation.customer_email}</span>
                              </div>
                              {reservation.customer_phone && (
                                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                  <Phone className="h-3 w-3" />
                                  <span>{reservation.customer_phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {formatDate(reservation.reservation_date)}
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                <Clock className="h-3 w-3" />
                                <span>{formatTime(reservation.reservation_time)}</span>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {reservation.table_name}
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                <MapPin className="h-3 w-3" />
                                <span>Table {reservation.table_number}</span>
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                Capacity: {reservation.table_capacity}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {reservation.number_of_guests}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {getStatusBadge(reservation.status)}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewReservation(reservation)}
                                className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditReservation(reservation)}
                                className="border-green-200 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              
                              <Select 
                                value={reservation.status} 
                                onValueChange={(value) => handleStatusUpdate(reservation.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="seated">Seated</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                  <SelectItem value="no_show">No Show</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-red-200 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteReservation(reservation.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Page {currentPage} of {totalPages} ({totalReservations} total reservations)
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* New Reservation Modal */}
        {showNewReservationModal && (
          <NewReservationModal
            isOpen={showNewReservationModal}
            onClose={() => setShowNewReservationModal(false)}
            onSubmit={handleCreateReservation}
            tables={tables}
          />
        )}

        {/* Edit Reservation Modal */}
        {showEditReservationModal && editingReservation && (
          <EditReservationModal
            isOpen={showEditReservationModal}
            onClose={() => {
              setShowEditReservationModal(false);
              setEditingReservation(null);
            }}
            onSubmit={(updates) => handleUpdateReservation(editingReservation.id, updates)}
            reservation={editingReservation}
            tables={tables}
          />
        )}


      </div>
    </Layout>
  );
}
