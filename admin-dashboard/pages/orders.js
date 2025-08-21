import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Package, 
  Euro, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function Orders() {
  const { isDarkMode } = useTheme();
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [displayLimit, setDisplayLimit] = useState(100);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [displayLimit]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3003/api/admin/orders');
      const data = await response.json();
      
      if (data.success) {
        setAllOrders(data.data || []);
        const ordersToShow = (data.data || []).slice(0, displayLimit);
        setOrders(ordersToShow);
        if (window.showToast) {
          window.showToast(`${ordersToShow.length} orders loaded`, 'success', 2000);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (window.showToast) {
        window.showToast('Failed to load orders', 'error', 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowMoreOrders = () => {
    const newLimit = Math.min(displayLimit + 50, allOrders.length);
    setDisplayLimit(newLimit);
    const ordersToShow = allOrders.slice(0, newLimit);
    setOrders(ordersToShow);
    if (window.showToast) {
      window.showToast(`Now showing ${ordersToShow.length} orders`, 'info', 2000);
    }
  };

  const handleShowLessOrders = () => {
    setDisplayLimit(100);
    const ordersToShow = allOrders.slice(0, 100);
    setOrders(ordersToShow);
    if (window.showToast) {
      window.showToast(`Now showing ${ordersToShow.length} orders`, 'info', 2000);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', text: 'Pending' },
      'confirmed': { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', text: 'Confirmed' },
      'preparing': { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400', text: 'Preparing' },
      'ready': { color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', text: 'Ready' },
      'delivered': { color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400', text: 'Delivered' },
      'cancelled': { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <Badge variant="secondary" className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && orders.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-6 text-xl text-gray-700 dark:text-gray-300 font-medium">Loading orders...</p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Preparing your order data</p>
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
                  Orders
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                  Manage customer orders, track status, and process payments
                </p>
              </div>
              <div className="mt-6 lg:mt-0">
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Order
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{orders.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Euro className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {orders.filter(order => order.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Customers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {new Set(orders.map(order => order.customer_email)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>All Orders</span>
              </CardTitle>
              <CardDescription>
                Showing {orders.length} of {allOrders.length} orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No orders found</h3>
                  <p className="text-gray-500 dark:text-gray-400">Orders will appear here once they are created</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200 dark:border-slate-700">
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Order ID</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Customer</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Amount</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Date</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                            #{order.id}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {order.first_name} {order.last_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {order.customer_email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(order.total_amount)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(order.status)}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {formatDate(order.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Incremental Loading */}
                  {allOrders.length > displayLimit && (
                    <div className="mt-6 flex items-center justify-center space-x-4">
                      <Button
                        variant="outline"
                        onClick={handleShowMoreOrders}
                        className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        Show 50 More Orders
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShowLessOrders}
                        className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                      >
                        Show Less
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
