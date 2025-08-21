import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

const UpcomingReservationsWidget = ({ isDarkMode }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTodayReservations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3003/api/admin/reservations/today');
      const data = await response.json();

      if (data.success) {
        setReservations(data.data);
        console.log('📅 Today\'s Reservations:', data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch today\'s reservations');
      }
    } catch (err) {
      console.error('Today\'s reservations fetch error:', err);
      setError('Failed to load today\'s reservations');
      if (window.showToast) {
        window.showToast('Failed to load today\'s reservations', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayReservations();
    const interval = setInterval(fetchTodayReservations, 60 * 1000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'confirmed': { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', text: 'Confirmed' },
      'seated': { color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', text: 'Seated' },
      'completed': { color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400', text: 'Completed' },
      'cancelled': { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', text: 'Cancelled' },
      'no_show': { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400', text: 'No Show' }
    };
    
    const config = statusConfig[status] || statusConfig['confirmed'];
    return (
      <Badge variant="secondary" className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5); // Format HH:MM
  };

  if (loading) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Today's Reservations
            </CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3"></div>
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
              Today's Reservations
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
              onClick={fetchTodayReservations}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Today's Reservations
            </CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {reservations.length} reservation{reservations.length !== 1 ? 's' : ''} today
            </p>
          </div>
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No reservations today</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">All tables are available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.slice(0, 3).map((reservation) => (
              <div key={reservation.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {formatTime(reservation.reservation_time)}
                    </span>
                  </div>
                  {getStatusBadge(reservation.status)}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {reservation.number_of_guests} guest{reservation.number_of_guests !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {reservation.table_name} (Table {reservation.table_number})
                    </span>
                  </div>
                  
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {reservation.customer_name}
                  </div>
                </div>
              </div>
            ))}
            
            {reservations.length > 3 && (
              <div className="text-center pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  View All {reservations.length} Reservations
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="pt-3 border-t border-gray-200 dark:border-slate-700 mt-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingReservationsWidget;
