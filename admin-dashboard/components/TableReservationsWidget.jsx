import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useTheme } from '../contexts/ThemeContext';
import { reservations as reservationsApi, tables as tablesApi } from '../lib/api';
import { 
  Calendar, 
  Clock, 
  Users, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Settings,
  Info
} from 'lucide-react';

const TableReservationsWidget = () => {
  const { isDarkMode } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [businessHours, setBusinessHours] = useState({
    lunch: { start: '12:00', end: '15:00' },
    dinner: { start: '19:00', end: '22:30' }
  });
  const [reservationSettings, setReservationSettings] = useState({
    duration_minutes: 105,
    grace_period_minutes: 15,
    max_sitting_minutes: 120
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generate time slots based on business hours
  const generateTimeSlots = useCallback(() => {
    const slots = [];
    // Cover a wider range to ensure all reservations are visible
    const startHour = 10; // Start at 10:00 AM
    const endHour = 23;   // End at 11:00 PM

    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push({
        hour,
        display: hour.toString().padStart(2, '0'),
        isBusinessHour: isBusinessHour(hour)
      });
    }
    
    console.log('🔍 Generated time slots:', slots);
    return slots;
  }, [businessHours]);

  // Check if hour is within business hours
  const isBusinessHour = (hour) => {
    const lunchStart = parseInt(businessHours.lunch.start.split(':')[0]);
    const lunchEnd = parseInt(businessHours.lunch.end.split(':')[0]);
    const dinnerStart = parseInt(businessHours.dinner.start.split(':')[0]);
    const dinnerEnd = parseInt(businessHours.dinner.end.split(':')[0]);
    
    return (hour >= lunchStart && hour < lunchEnd) || (hour >= dinnerStart && hour < dinnerEnd);
  };

  // Fetch reservations for selected date
  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        start_date: selectedDate,
        end_date: selectedDate,
        limit: '1000'
      };

      console.log('🔍 Fetching reservations with params:', params);
      console.log('🔍 Selected date:', selectedDate);
      console.log('🔍 Date type:', typeof selectedDate);
      
      const data = await reservationsApi.getAll(params);
      console.log('🔍 API response:', data);

      if (data.success) {
        setReservations(data.data || []);
        console.log('📅 Table Reservations loaded:', data.data?.length || 0, 'reservations for', selectedDate);
        console.log('📅 Reservations data:', data.data);
        if (data.data && data.data.length > 0) {
          console.log('📅 Sample reservation structure:', data.data[0]);
          console.log('📅 Sample reservation date:', data.data[0].reservation_date);
          console.log('📅 Sample reservation table info:', {
            table_id: data.data[0].table_id,
            table_number: data.data[0].table_number,
            table_name: data.data[0].table_name
          });
        }
      } else {
        throw new Error(data.error || 'Failed to fetch reservations');
      }
    } catch (err) {
      console.error('Reservations fetch error:', err);
      setError('Failed to load reservations');
      if (window.showToast) {
        window.showToast('Failed to load reservations', 'error', 3000);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Fetch tables
  const fetchTables = useCallback(async () => {
    try {
      const data = await tablesApi.getAll();
      if (data.success) {
        // Only show active tables
        const activeTables = (data.data || []).filter(table => table.is_active);
        setTables(activeTables.sort((a, b) => a.table_number - b.table_number));
        console.log('🪑 Tables loaded:', activeTables.length, 'active tables');
        console.log('🪑 Tables data:', activeTables);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  }, []);

  // Fetch business settings (simulated for now)
  const fetchBusinessSettings = useCallback(async () => {
    try {
      // TODO: Replace with actual API call when business settings endpoint is available
      // const response = await fetch('http://localhost:3003/api/admin/business-settings');
      // const data = await response.json();
      // if (data.success) {
      //   setBusinessHours(data.data.businessHours);
      //   setReservationSettings(data.data.reservationSettings);
      // }
      
      // For now, use default settings
      console.log('📊 Using default business settings');
    } catch (error) {
      console.error('Error fetching business settings:', error);
    }
  }, []);

  // Calculate reservation block position and size
  const calculateBlockStyle = (reservation) => {
    const timeSlots = generateTimeSlots();
    const startTime = reservation.reservation_time; // e.g., "14:30:00"
    const endTime = reservation.reservation_end_time; // e.g., "16:15:00"
    
    if (!startTime || !endTime) return { display: 'none' };

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDecimal = startHour + startMinute / 60;
    const endDecimal = endHour + endMinute / 60;
    
    const firstSlotHour = timeSlots[0]?.hour || 0;
    const totalSlots = timeSlots.length;
    const slotWidth = 100 / totalSlots; // Percentage width per slot
    
    const startPosition = (startDecimal - firstSlotHour) * slotWidth;
    const blockWidth = (endDecimal - startDecimal) * slotWidth;
    
    // Force explicit height in pixels instead of percentage
    const containerHeight = 96; // h-24 = 96px
    
    return {
      left: `${Math.max(0, startPosition)}%`,
      width: `${Math.max(1, blockWidth)}%`,
      minWidth: '80px', // Ensure minimum visibility for text
      height: `${containerHeight - 8}px`, // Slightly reduce height for better appearance
      top: '4px', // Small top margin
      bottom: '4px' // Small bottom margin
    };
  };

  // Get reservation status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500 border-blue-600 text-white';
      case 'seated':
        return 'bg-green-500 border-green-600 text-white';
      case 'completed':
        return 'bg-gray-500 border-gray-600 text-white';
      case 'cancelled':
        return 'bg-red-500 border-red-600 text-white';
      case 'no_show':
        return 'bg-orange-500 border-orange-600 text-white';
      default:
        return 'bg-blue-500 border-blue-600 text-white';
    }
  };

  // Get reservations for a specific table
  const getTableReservations = (tableId) => {
    // Find the table by ID and get its table_number, then filter reservations
    const table = tables.find(t => t.id === tableId);
    if (!table) {
      console.log(`🔍 Table not found for ID: ${tableId}`);
      return [];
    }
    
    console.log(`🔍 Looking for reservations for table:`, {
      tableId,
      tableName: table.name,
      tableNumber: table.table_number,
      tableCapacity: table.capacity
    });
    
    // Try multiple matching strategies
    let tableReservations = reservations.filter(res => res.table_number === table.table_number);
    console.log(`🔍 Matches by table_number (${table.table_number}):`, tableReservations);
    
    // If no matches by table_number, try by table_id
    if (tableReservations.length === 0) {
      tableReservations = reservations.filter(res => res.table_id === table.id);
      console.log(`🔍 Matches by table_id (${table.id}):`, tableReservations);
    }
    
    // If still no matches, try by table name
    if (tableReservations.length === 0) {
      tableReservations = reservations.filter(res => res.table_name === table.name);
      console.log(`🔍 Matches by table_name (${table.name}):`, tableReservations);
    }
    
    // Debug: Show all reservations and their table-related fields
    console.log(`🔍 All reservations with table info:`, reservations.map(res => ({
      id: res.id,
      customer_name: res.customer_name,
      table_id: res.table_id,
      table_number: res.table_number,
      table_name: res.table_name,
      reservation_time: res.reservation_time,
      status: res.status
    })));
    
    console.log(`🔍 Final result: Table ${table.name} (ID: ${tableId}, number: ${table.table_number}) has ${tableReservations.length} reservations:`, tableReservations);
    return tableReservations;
  };

  // Handle date change
  const handleDateChange = (direction) => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM format
  };

  // Initial data load
  useEffect(() => {
    fetchTables();
    fetchBusinessSettings();
  }, [fetchTables, fetchBusinessSettings]);

  // Fetch reservations when date changes
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReservations();
      fetchTables(); // Also refresh tables in case of status changes
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchReservations, fetchTables]);

  const timeSlots = generateTimeSlots();

  if (loading && reservations.length === 0) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Table Reservations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message when no reservations for selected date
  if (!loading && reservations.length === 0) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Table Reservations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Info className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Reservations for {selectedDate}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              There are no reservations scheduled for this date.
            </p>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateChange(-1)}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous Day
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateChange(1)}
                className="flex items-center gap-2"
              >
                Next Day
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              Tip: Use the date picker above to navigate to dates with reservations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Table Reservations
              </CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Real-time reservation timeline
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Date Navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateChange(-1)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-sm font-medium min-w-[120px] text-center">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateChange(1)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Today Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="h-8 px-3 text-xs"
            >
              Today
            </Button>
            
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReservations}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* Show notification if there are reservations on other dates */}
        {reservations.length === 0 && !loading && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mx-4">
            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
              <Info className="h-4 w-4" />
              <span>
                <strong>Tip:</strong> The "TestFront" reservation was created for August 25th, 2025. 
                Use the date navigation buttons above to view it.
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {error ? (
          <div className="p-6 text-center">
            <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReservations}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Time Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
              <div className="flex">
                {/* Table Header Space */}
                <div className="w-32 flex-shrink-0 p-3 border-r border-gray-200 dark:border-slate-700">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Tables
                  </div>
                </div>
                
                {/* Time Slots */}
                <ScrollArea className="flex-1">
                  <div className="flex min-w-[800px]">
                    {timeSlots.map(({ hour, display, isBusinessHour }) => (
                      <div
                        key={hour}
                        className={`flex-1 p-2 text-center border-r border-gray-200 dark:border-slate-700 ${
                          isBusinessHour 
                            ? 'bg-blue-50 dark:bg-blue-900/20' 
                            : 'bg-gray-50 dark:bg-slate-900/50'
                        }`}
                        style={{ minWidth: `${100 / timeSlots.length}%` }}
                      >
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {display}:00
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          <div className="flex justify-between px-1">
                            <span className="font-mono">15</span>
                            <span className="font-mono">30</span>
                            <span className="font-mono">45</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </div>

            {/* Table Rows */}
            <div className="max-h-96 overflow-y-auto">
              {tables.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No active tables available</p>
                </div>
              ) : (
                tables.map((table) => {
                  const tableReservations = getTableReservations(table.id);
                  
                  return (
                    <div key={table.id} className="flex border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      {/* Table Name */}
                      <div className="w-32 flex-shrink-0 p-3 border-r border-gray-200 dark:border-slate-700">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {table.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {table.capacity} seats
                        </div>
                      </div>
                      
                      {/* Reservation Timeline */}
                      <div className="flex-1 relative h-24 group">
                        <ScrollArea className="h-full">
                          <div className="relative h-full min-w-[800px]" style={{ width: '100%' }}>
                            {/* Time Grid Background */}
                            <div className="absolute inset-0 flex">
                              {timeSlots.map(({ hour, isBusinessHour }) => (
                                <div
                                  key={hour}
                                  className={`flex-1 border-r border-gray-100 dark:border-slate-700 ${
                                    isBusinessHour 
                                      ? 'bg-blue-50 dark:bg-blue-900/10' 
                                      : 'bg-gray-50 dark:bg-slate-900/25'
                                  }`}
                                  style={{ minWidth: `${100 / timeSlots.length}%` }}
                                >
                                </div>
                              ))}
                            </div>
                            
                            {/* 15-minute interval vertical lines - positioned over the entire timeline */}
                            <div className="absolute inset-0 pointer-events-none z-10">
                              {timeSlots.map(({ hour }, index) => {
                                const slotWidth = 100 / timeSlots.length;
                                const leftPosition = index * slotWidth;
                                
                                return (
                                  <div key={`lines-${hour}`} className="absolute top-0 h-full" style={{ left: `${leftPosition}%`, width: `${slotWidth}%` }}>
                                    {/* 15-minute interval lines - make them more visible */}
                                    <div className="absolute top-0 left-1/4 w-1 h-full bg-yellow-500 opacity-80"></div>
                                    <div className="absolute top-0 left-1/2 w-1 h-full bg-yellow-500 opacity-80"></div>
                                    <div className="absolute top-0 left-3/4 w-1 h-full bg-yellow-500 opacity-80"></div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Reservation Blocks */}
                            {tableReservations.map((reservation) => {
                              const blockStyle = calculateBlockStyle(reservation);
                              
                              return (
                                <TooltipProvider key={reservation.id}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={`absolute rounded px-2 py-1 cursor-pointer transition-all hover:scale-105 z-10 hover:z-20 border shadow-sm ${getStatusColor(reservation.status)}`}
                                        style={blockStyle}
                                      >
                                        <div className="h-full flex flex-col justify-center overflow-hidden">
                                          <div className="text-xs font-medium truncate leading-tight text-white">
                                            {reservation.customer_name}
                                          </div>
                                          <div className="text-xs opacity-90 truncate leading-tight mt-1 text-white">
                                            {formatTime(reservation.reservation_time)} - {formatTime(reservation.reservation_end_time)}
                                          </div>
                                          <div className="text-xs opacity-75 truncate leading-tight mt-1 text-white">
                                            {reservation.number_of_guests} guests
                                          </div>
                                        </div>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <div className="text-sm">
                                        <div className="font-medium">{reservation.customer_name}</div>
                                        <div className="text-xs opacity-75">
                                          {formatTime(reservation.reservation_time)} - {formatTime(reservation.reservation_end_time)}
                                        </div>
                                        <div className="text-xs opacity-75">
                                          {reservation.number_of_guests} guests • {reservation.status}
                                        </div>
                                        {reservation.special_requests && (
                                          <div className="text-xs opacity-75 mt-1">
                                            Note: {reservation.special_requests}
                                          </div>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })}
                          </div>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Status Legend */}
      <div className="px-6 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Confirmed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Seated</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Cancelled</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {reservations.length} reservation{reservations.length !== 1 ? 's' : ''} • 
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TableReservationsWidget;
