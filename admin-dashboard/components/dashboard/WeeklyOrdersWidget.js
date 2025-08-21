import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar } from 'react-chartjs-2';
import { Calendar, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

export const WeeklyOrdersWidget = ({ isDarkMode = false }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeeklyOrders = async () => {
      try {
        setLoading(true);
        
        // Fetch orders from the API
        const response = await fetch('http://localhost:3003/api/admin/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        
        if (data.success) {
          const weeklyStats = buildWeeklyOrdersData(data.data);
          setWeeklyData(weeklyStats);
        }
        
      } catch (err) {
        console.error('Error fetching weekly orders:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyOrders();
  }, []);

  const buildWeeklyOrdersData = (orders) => {
    const now = new Date();
    
    // Calculate the start of the current week (Monday)
    // Get the current date and set it to the most recent Monday
    const weekStart = new Date(now);
    const currentDay = weekStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate days to subtract to get to Monday
    // If today is Monday (1), subtract 0 days
    // If today is Tuesday (2), subtract 1 day
    // If today is Sunday (0), subtract 6 days
    const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
    weekStart.setDate(weekStart.getDate() - daysToSubtract);
    
    // Set time to start of day (00:00:00)
    weekStart.setHours(0, 0, 0, 0);
    
    const weekDays = [];
    const weekData = [];
    const weekDates = [];
    
    // Generate Monday to Sunday (7 days)
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      weekDays.push(dayName);
      weekDates.push(date);
      
      // Count orders for this day
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        // Compare dates only (ignore time)
        return orderDate.getFullYear() === date.getFullYear() &&
               orderDate.getMonth() === date.getMonth() &&
               orderDate.getDate() === date.getDate();
      }).length;
      
      weekData.push(dayOrders);
    }
    
    return {
      labels: weekDays,
      data: weekData,
      weekStart: weekStart,
      weekEnd: new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000))
    };
  };

  const chartData = {
    labels: weeklyData.labels || [],
    datasets: [
      {
        label: 'Orders',
        data: weeklyData.data || [],
        backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.8)' : 'rgba(59, 130, 246, 0.8)',
        borderColor: isDarkMode ? 'rgba(96, 165, 250, 1)' : 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: isDarkMode ? 'rgba(96, 165, 250, 1)' : 'rgba(59, 130, 246, 1)',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(0, 0, 0, 0.9)',
        titleColor: isDarkMode ? '#f8fafc' : '#ffffff',
        bodyColor: isDarkMode ? '#e2e8f0' : '#ffffff',
        borderColor: isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(255, 255, 255, 0.2)',
        borderWidth: 2,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `Orders: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          borderDash: [5, 5]
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12
          },
          stepSize: 1
        }
      }
    },
    elements: {
      bar: {
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
      }
    }
  };

  const getTotalWeeklyOrders = () => {
    return weeklyData.data ? weeklyData.data.reduce((sum, count) => sum + count, 0) : 0;
  };

  const getAverageDailyOrders = () => {
    if (!weeklyData.data || weeklyData.data.length === 0) return 0;
    return Math.round(getTotalWeeklyOrders() / weeklyData.data.length);
  };

  if (loading) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Weekly Orders
            </CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Weekly Orders
            </CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">Error loading weekly orders: {error}</p>
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
              Weekly Orders
            </CardTitle>
            {weeklyData.weekStart && weeklyData.weekEnd && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {weeklyData.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weeklyData.weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <div className="h-64 mb-4">
          <Bar data={chartData} options={chartOptions} />
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {getTotalWeeklyOrders()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total This Week
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {getAverageDailyOrders()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Daily Average
            </div>
          </div>
        </div>
        
        {/* Current Week Info */}
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span>Current week: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyOrdersWidget;
