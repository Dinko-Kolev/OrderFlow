import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock } from 'lucide-react';

const RecentOrdersWidget = ({ isDarkMode }) => {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(10);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { variant: 'secondary', text: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      'processing': { variant: 'default', text: 'Processing', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      'completed': { variant: 'default', text: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      'cancelled': { variant: 'destructive', text: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', text: status, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3003/api/admin/orders');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch orders');
      }

      // Store all orders and show based on current display limit
      setAllOrders(data.data);
      const ordersToShow = data.data.slice(0, displayLimit);

      // Log the processed data
      console.log('📦 Recent Orders:', {
        total: data.data.length,
        showing: ordersToShow.length,
        latest: ordersToShow[0]
      });

      setOrders(ordersToShow);

    } catch (err) {
      console.error('Recent orders fetch error:', err);
      setError('Failed to load recent orders');
      if (window.showToast) {
        window.showToast('Failed to load recent orders', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleShowMoreOrders = () => {
    const newLimit = Math.min(displayLimit + 10, allOrders.length);
    setDisplayLimit(newLimit);
    setOrders(allOrders.slice(0, newLimit));
  };

  const handleShowLessOrders = () => {
    setDisplayLimit(10);
    setOrders(allOrders.slice(0, 10));
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchOrders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  if (loading && !orders.length) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Recent Orders</CardTitle>
          <CardDescription className="dark:text-gray-400">Loading recent orders...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Recent Orders</CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Failed to load recent orders
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Recent Orders</CardTitle>
        <CardDescription className="dark:text-gray-400">Latest orders from your customers</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 dark:border-slate-700">
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Order ID</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Customer</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Amount</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">#{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{order.first_name} {order.last_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{order.customer_email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(order.total_amount)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(order.created_at)}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {orders.length > 0 && (
          <div className="mt-6 text-center space-y-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {orders.length} of {allOrders.length} orders
            </div>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={handleShowMoreOrders}
                disabled={displayLimit >= allOrders.length}
              >
                Show 10 More Orders
              </Button>
              {displayLimit > 10 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                  onClick={handleShowLessOrders}
                >
                  Show Less
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentOrdersWidget;
