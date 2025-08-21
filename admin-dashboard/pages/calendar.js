import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  Grid3X3,
  CalendarDays,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Settings,
  Building2,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

export default function Calendar() {
  const { isDarkMode } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const [restaurantConfig, setRestaurantConfig] = useState({});

  // Get current month/year for display
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate calendar days
  const getCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days = [];
    const currentDateCopy = new Date(startDate);
    
    // Generate 42 days (6 weeks) to ensure we cover the month
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDateCopy));
      currentDateCopy.setDate(currentDateCopy.getDate() + 1);
    }
    
    return days;
  };

  // Get reservations for a specific date
  const getReservationsForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return reservations.filter(reservation => 
      reservation.reservation_date === dateString
    );
  };

  // Get week days for header
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar action functions
  const handleViewReservation = (reservation) => {
    setSelectedReservation(reservation);
    if (window.showToast) {
      window.showToast(`Viewing reservation for ${reservation.customer_name}`, 'info', 2000);
    }
  };

  const handleEditReservation = (reservation) => {
    if (window.showToast) {
      window.showToast(`Edit functionality coming soon for ${reservation.customer_name}`, 'info', 2000);
    }
  };

  const handleDeleteReservation = (reservation) => {
    if (confirm(`Are you sure you want to delete the reservation for ${reservation.customer_name}?`)) {
      if (window.showToast) {
        window.showToast(`Delete functionality coming soon for ${reservation.customer_name}`, 'info', 2000);
      }
    }
  };



  // Fetch restaurant configuration
  const fetchRestaurantConfig = async () => {
    try {
      const configResponse = await fetch('http://localhost:3003/api/admin/restaurant/config');
      const configData = await configResponse.json();
      if (configData.success) {
        setRestaurantConfig(configData.data);
      }
    } catch (error) {
      console.error('Error fetching restaurant config:', error);
    }
  };

  // Fetch reservations for the current month
  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = new Date(currentYear, currentMonth, 1);
      const endDate = new Date(currentYear, currentMonth + 1, 0);
      
      const params = new URLSearchParams({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        limit: '1000' // Get all reservations for the month
      });

      const response = await fetch(`http://localhost:3003/api/admin/reservations?${params}`);
      const data = await response.json();

      if (data.success) {
        setReservations(data.data || []);
        console.log('📅 Calendar reservations loaded:', data.data);
        if (window.showToast) {
          window.showToast(`${data.data.length} reservations loaded for ${monthNames[currentMonth]} ${currentYear}`, 'success', 2000);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch reservations');
      }
    } catch (err) {
      console.error('Calendar reservations fetch error:', err);
      setError('Failed to load reservations');
      if (window.showToast) {
        window.showToast('Failed to load reservations', 'error', 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchRestaurantConfig();
  }, [currentMonth, currentYear]);

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
      <Badge variant="secondary" className={`${config.color} text-xs`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5); // Format HH:MM
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const dateReservations = getReservationsForDate(date);
    if (dateReservations.length > 0) {
      setSelectedReservation(dateReservations[0]);
    } else {
      setSelectedReservation(null);
    }
  };

  const handleReservationClick = (reservation) => {
    setSelectedReservation(reservation);
  };

  const handleStatusUpdate = async (reservationId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3003/api/admin/reservations/${reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        if (window.showToast) {
          window.showToast(`Reservation status updated to ${newStatus}`, 'success', 2000);
        }
        // Refresh the reservations
        fetchReservations();
      } else {
        throw new Error(data.error || 'Failed to update reservation');
      }
    } catch (err) {
      console.error('Status update error:', err);
      if (window.showToast) {
        window.showToast('Failed to update reservation status', 'error', 4000);
      }
    }
  };

  if (loading && reservations.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-6 text-xl text-gray-700 dark:text-gray-300 font-medium">Loading calendar...</p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Preparing your reservation calendar</p>
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
                  Reservation Calendar
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                  Visual calendar view of all restaurant reservations
                </p>
              </div>
              <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={fetchReservations}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={goToToday}
                  className="border-green-200 dark:border-green-600 text-green-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  Today
                </Button>

                <Button 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white shadow-lg"
                  onClick={() => window.location.href = '/reservations'}
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
          {/* Calendar Controls */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Month Navigation */}
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={goToPreviousMonth}
                    className="border-gray-300 dark:border-gray-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {monthNames[currentMonth]} {currentYear}
                    </h2>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={goToNextMonth}
                    className="border-gray-300 dark:border-gray-600"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                    className="flex items-center space-x-2"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span>Month</span>
                  </Button>
                  <Button
                    variant={viewMode === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                    className="flex items-center space-x-2"
                  >
                    <CalendarDays className="h-4 w-4" />
                    <span>Week</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Calendar Grid */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              {/* Week Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays().map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentMonth;
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                  const dateReservations = getReservationsForDate(date);
                  
                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[120px] p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all duration-200
                        ${isCurrentMonth 
                          ? 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700' 
                          : 'bg-gray-50 dark:bg-slate-900 text-gray-400 dark:text-gray-500'
                        }
                        ${isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                        ${isSelected ? 'ring-2 ring-green-500 dark:ring-green-400 bg-green-50 dark:bg-green-900/20' : ''}
                      `}
                      onClick={() => handleDateClick(date)}
                    >
                      {/* Date Number */}
                      <div className={`
                        text-sm font-medium mb-1
                        ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}
                        ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-500' : ''}
                      `}>
                        {date.getDate()}
                      </div>

                      {/* Reservations */}
                      <div className="space-y-1">
                        {dateReservations.slice(0, 3).map((reservation) => (
                          <div
                            key={reservation.id}
                            className={`
                              p-1 rounded text-xs cursor-pointer transition-all duration-200 hover:scale-105
                              ${reservation.status === 'confirmed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' : ''}
                              ${reservation.status === 'seated' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : ''}
                              ${reservation.status === 'completed' ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300' : ''}
                              ${reservation.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : ''}
                              ${reservation.status === 'no_show' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' : ''}
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReservationClick(reservation);
                            }}
                          >
                            <div className="font-medium truncate">{reservation.customer_name}</div>
                            <div className="text-xs opacity-75">
                              {formatTime(reservation.reservation_time)} • {reservation.number_of_guests} guests
                            </div>
                          </div>
                        ))}
                        
                        {dateReservations.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            +{dateReservations.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Date/Reservation Details */}
          {(selectedDate || selectedReservation) && (
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5" />
                  <span>
                    {selectedDate && (
                      <>
                        {selectedDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </>
                    )}
                    {selectedReservation && (
                      <>
                        Reservation Details
                      </>
                    )}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate && !selectedReservation && (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {selectedDate.toDateString() === new Date().toDateString() ? 'Today' : 'Selected Date'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {getReservationsForDate(selectedDate).length === 0 
                        ? 'No reservations for this date'
                        : `${getReservationsForDate(selectedDate).length} reservation(s)`
                      }
                    </p>
                  </div>
                )}

                {selectedReservation && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Customer Information</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">{selectedReservation.customer_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">{selectedReservation.customer_email}</span>
                          </div>
                          {selectedReservation.customer_phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700 dark:text-gray-300">{selectedReservation.customer_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Reservation Details</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {formatTime(selectedReservation.reservation_time)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {selectedReservation.number_of_guests} guests
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              Table {selectedReservation.table_number} ({selectedReservation.table_name})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Status</h4>
                          {getStatusBadge(selectedReservation.status)}
                        </div>
                        <div className="space-x-2">
                          <Select 
                            value={selectedReservation.status} 
                            onValueChange={(value) => handleStatusUpdate(selectedReservation.id, value)}
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
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Actions</h4>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReservation(selectedReservation)}
                            className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditReservation(selectedReservation)}
                            className="border-green-200 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteReservation(selectedReservation)}
                            className="border-red-200 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
