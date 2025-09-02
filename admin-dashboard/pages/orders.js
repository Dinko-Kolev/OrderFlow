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
import ProtectedRoute from '../components/ProtectedRoute';
import apiClient from '../lib/api';
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
  const [editForm, setEditForm] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [displayLimit]);

  // Filter orders based on search term and status
  useEffect(() => {
    let filtered = allOrders;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id?.toString().includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply display limit
    filtered = filtered.slice(0, displayLimit);

    setOrders(filtered);
  }, [allOrders, searchTerm, statusFilter, displayLimit]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await apiClient.orders.getAll();
      
      setAllOrders(data.data || []);
      // Orders will be filtered by the useEffect
    } catch (error) {
      console.error('Error fetching orders:', error);
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

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setModalType('view');
    setShowModal(true);
  };

  const canEditOrder = (order) => {
    // Only allow editing of pending or confirmed orders
    return order.status === 'pending' || order.status === 'confirmed';
  };

  const handleEditOrder = (order) => {
    if (!canEditOrder(order)) return;
    
    setSelectedOrder(order);
    setEditForm({
      first_name: order.first_name || '',
      last_name: order.last_name || '',
      customer_email: order.customer_email || '',
      phone: order.phone || '',
      status: order.status || 'pending',
      delivery_address: order.delivery_address || '',
      delivery_notes: order.delivery_notes || '',
      notes: order.notes || ''
    });
    setModalType('edit');
    setShowModal(true);
  };

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;

    setIsSubmitting(true);
    try {
      // Prepare the update data
      const updateData = {
        ...editForm,
        // Don't allow changing critical fields like total_amount, items, etc.
        // Only allow updating customer info, status, and notes
      };

      // Call the API to update the order
      await apiClient.orders.update(selectedOrder.id, updateData);
      
      // Update the local state
      setAllOrders(prev => prev.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, ...updateData }
          : order
      ));

      setShowModal(false);
      setEditForm({});
      
      if (window.showToast) {
        window.showToast('Order updated successfully', 'success', 3000);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      if (window.showToast) {
        window.showToast('Failed to update order', 'error', 4000);
      }
    } finally {
      setIsSubmitting(false);
    }
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
    <ProtectedRoute>
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
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by customer name, email, or order ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 dark:border-slate-600"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="w-full sm:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-gray-200 dark:border-slate-600">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div className="w-full sm:w-48">
                  <Select value={displayLimit.toString()} onValueChange={(value) => setDisplayLimit(parseInt(value))}>
                    <SelectTrigger className="border-gray-200 dark:border-slate-600">
                      <SelectValue placeholder="Show orders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">Last 50 orders</SelectItem>
                      <SelectItem value="100">Last 100 orders</SelectItem>
                      <SelectItem value="200">Last 200 orders</SelectItem>
                      <SelectItem value="500">Last 500 orders</SelectItem>
                      <SelectItem value="1000">All orders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                {(searchTerm || statusFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="border-gray-200 dark:border-slate-600"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

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
                                onClick={() => handleViewOrder(order)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                                onClick={() => handleEditOrder(order)}
                                disabled={!canEditOrder(order)}
                                title={!canEditOrder(order) ? 'Cannot edit delivered or cancelled orders' : 'Edit order'}
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

      {/* Order Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>
                {modalType === 'edit' ? 'Edit Order' : 'Order Details'} - #{selectedOrder?.id}
              </span>
            </DialogTitle>
            <DialogDescription>
              {modalType === 'edit' 
                ? 'Update order information and customer details' 
                : 'Complete order information and customer details'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Order Status</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current status of the order</p>
                </div>
                {getStatusBadge(selectedOrder.status)}
              </div>

              {/* Edit Warning */}
              {modalType === 'edit' && !canEditOrder(selectedOrder) && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                      This order cannot be edited because it has been delivered or cancelled.
                    </p>
                  </div>
                </div>
              )}

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Customer Information</h3>
                  <div className="space-y-3">
                    {modalType === 'edit' ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="first_name" className="text-sm font-medium text-gray-600 dark:text-gray-400">First Name</Label>
                            <Input
                              id="first_name"
                              value={editForm.first_name}
                              onChange={(e) => handleFormChange('first_name', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="last_name" className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Name</Label>
                            <Input
                              id="last_name"
                              value={editForm.last_name}
                              onChange={(e) => handleFormChange('last_name', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="customer_email" className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</Label>
                          <Input
                            id="customer_email"
                            type="email"
                            value={editForm.customer_email}
                            onChange={(e) => handleFormChange('customer_email', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</Label>
                          <Input
                            id="phone"
                            value={editForm.phone}
                            onChange={(e) => handleFormChange('phone', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</Label>
                          <p className="text-gray-900 dark:text-gray-100">
                            {selectedOrder.first_name} {selectedOrder.last_name}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</Label>
                          <p className="text-gray-900 dark:text-gray-100">{selectedOrder.customer_email}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</Label>
                          <p className="text-gray-900 dark:text-gray-100">{selectedOrder.phone || 'N/A'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Order Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Order ID</Label>
                      <p className="text-gray-900 dark:text-gray-100">#{selectedOrder.id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</Label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(selectedOrder.total_amount)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Order Date</Label>
                      <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                    {modalType === 'edit' && (
                      <div>
                        <Label htmlFor="status" className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</Label>
                        <Select value={editForm.status} onValueChange={(value) => handleFormChange('status', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Delivery Information</h3>
                <div className="space-y-3">
                  {modalType === 'edit' ? (
                    <>
                      <div>
                        <Label htmlFor="delivery_address" className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</Label>
                        <Input
                          id="delivery_address"
                          value={editForm.delivery_address}
                          onChange={(e) => handleFormChange('delivery_address', e.target.value)}
                          className="mt-1"
                          placeholder="Enter delivery address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="delivery_notes" className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivery Notes</Label>
                        <Input
                          id="delivery_notes"
                          value={editForm.delivery_notes}
                          onChange={(e) => handleFormChange('delivery_notes', e.target.value)}
                          className="mt-1"
                          placeholder="Enter delivery notes"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {selectedOrder.delivery_address && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</Label>
                          <p className="text-gray-900 dark:text-gray-100">{selectedOrder.delivery_address}</p>
                        </div>
                      )}
                      {selectedOrder.delivery_notes && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes</Label>
                          <p className="text-gray-900 dark:text-gray-100">{selectedOrder.delivery_notes}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Order Items</h3>
                  <div className="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatCurrency(item.price)}</TableCell>
                            <TableCell>{formatCurrency(item.price * item.quantity)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Order Notes */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Order Notes</h3>
                {modalType === 'edit' ? (
                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes</Label>
                    <Input
                      id="notes"
                      value={editForm.notes}
                      onChange={(e) => handleFormChange('notes', e.target.value)}
                      className="mt-1"
                      placeholder="Enter order notes or special instructions"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-gray-900 dark:text-gray-100">{selectedOrder.notes || 'No notes'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {modalType === 'edit' ? (
              <>
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveOrder}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
    </ProtectedRoute>
  );
}
