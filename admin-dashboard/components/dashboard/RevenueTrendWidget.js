import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Line } from 'react-chartjs-2';

const RevenueTrendWidget = ({ isDarkMode }) => {
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const buildRevenueChartData = useCallback((orders) => {
    if (!orders?.length) return null;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Initialize last 6 months with correct month/year pairs
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      let monthIndex = currentMonth - (5 - i); // This gives us correct chronological order
      let year = currentYear;

      // Adjust for year boundary
      if (monthIndex < 0) {
        monthIndex += 12;
        year--;
      }

      return {
        month: monthIndex,
        monthName: months[monthIndex],
        year,
        revenue: 0
      };
    });

    // Process orders
    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const orderMonth = orderDate.getMonth();
      const orderYear = orderDate.getFullYear();
      const orderAmount = parseFloat(order.total_amount || 0);

      // Find matching month in our tracking array
      const monthData = last6Months.find(m => 
        m.month === orderMonth && m.year === orderYear
      );

      if (monthData) {
        monthData.revenue += orderAmount;
      }
    });

    // Format data for Chart.js
    return {
      labels: last6Months.map(m => m.monthName),
      datasets: [{
        label: 'Revenue',
        data: last6Months.map(m => m.revenue),
        borderColor: isDarkMode ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)',
        backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      }]
    };
  }, [isDarkMode]);

  const fetchRevenueData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3003/api/admin/orders');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch orders');
      }

      const chartData = buildRevenueChartData(data.data);
      setRevenueData(chartData);

      // Log the processed data for verification
      console.log('📊 Revenue Data Processed:', {
        monthlyData: chartData.labels.map((month, i) => ({
          month,
          revenue: formatCurrency(chartData.datasets[0].data[i])
        }))
      });

    } catch (err) {
      console.error('Revenue data fetch error:', err);
      setError('Failed to load revenue data');
      if (window.showToast) {
        window.showToast('Failed to load revenue data', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [buildRevenueChartData]);

  useEffect(() => {
    fetchRevenueData();
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchRevenueData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRevenueData]);

  if (loading) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Revenue Trend</CardTitle>
          <CardDescription className="dark:text-gray-400">Loading revenue data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Revenue Trend</CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
            Failed to load revenue data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Revenue Trend</CardTitle>
        <CardDescription className="dark:text-gray-400">Monthly revenue performance over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        {revenueData ? (
          <Line 
            data={revenueData} 
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context) => `Revenue: ${formatCurrency(context.parsed.y)}`
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                  ticks: {
                    color: isDarkMode ? '#94a3b8' : '#374151',
                    callback: (value) => formatCurrency(value)
                  },
                },
                x: {
                  grid: { display: false },
                  ticks: {
                    color: isDarkMode ? '#94a3b8' : '#374151',
                  },
                },
              },
            }}
          />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
            No revenue data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueTrendWidget;
