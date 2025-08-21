import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import Navigation from '../components/Navigation';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Filter,
  ArrowUpDown,
  Calendar,
  Euro,
  User,
  Package,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add', 'edit', 'view', 'delete'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    total_amount: '',
    status: 'pending',
    items: []
  });
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [displayLimit, setDisplayLimit] = useState(100);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
  }, [displayLimit]);

  useEffect(() => {
    if (window.showToast) {
      window.showToast('Orders page loaded successfully! 📋', 'success');
    }
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/admin/orders');
      const data = await response.json();
      
      if (data.success) {
        setAllOrders(data.data);
        // Show first 100 orders initially
        const ordersToShow = data.data.slice(0, displayLimit);
        setOrders(ordersToShow);
        if (window.showToast) {
          window.showToast(`Loaded ${data.data.length} orders (showing ${ordersToShow.length})`, 'info');
        }
      } else {
        if (window.showToast) {
          window.showToast('Failed to load orders', 'error');
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (window.showToast) {
        window.showToast('Error loading orders', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/admin/customers');
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/admin/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
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

  const sortOrders = (orders, field, direction) => {
    return [...orders].sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      if (field === 'created_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (field === 'total_amount') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      } else if (field === 'customer_name') {
        aVal = `${a.first_name} ${a.last_name}`.toLowerCase();
        bVal = `${b.first_name} ${b.last_name}`.toLowerCase();
      }

      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    
    if (window.showToast) {
      window.showToast(`Sorted by ${field} (${sortDirection === 'asc' ? 'desc' : 'asc'})`, 'info');
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toString().includes(searchLower) ||
      `${order.first_name} ${order.last_name}`.toLowerCase().includes(searchLower) ||
      order.customer_email.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower) ||
      order.total_amount.toString().includes(searchLower)
    );
  });

  const sortedOrders = sortOrders(filteredOrders, sortField, sortDirection);

  const handleAddOrder = () => {
    setModalType('add');
    setFormData({
      user_id: '',
      total_amount: '',
      status: 'pending',
      items: []
    });
    setShowModal(true);
  };

  const handleEditOrder = (order) => {
    setModalType('edit');
    setSelectedOrder(order);
    setFormData({
      user_id: order.user_id,
      total_amount: order.total_amount,
      status: order.status,
      items: []
    });
    setShowModal(true);
  };

  const handleViewOrder = async (order) => {
    setModalType('view');
    setSelectedOrder(order);
    
    try {
      const response = await fetch(`http://localhost:3003/api/admin/orders/${order.id}/items`);
      const data = await response.json();
      if (data.success) {
        setFormData({
          ...formData,
          items: data.data
        });
      }
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
    
    setShowModal(true);
  };

  const handleDeleteOrder = (order) => {
    setModalType('delete');
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleShowMoreOrders = () => {
    const newLimit = Math.min(displayLimit + 50, allOrders.length);
    setDisplayLimit(newLimit);
    const ordersToShow = allOrders.slice(0, newLimit);
    setOrders(ordersToShow);
    if (window.showToast) {
      window.showToast(`Now showing ${ordersToShow.length} orders`, 'info');
    }
  };

  const handleShowLessOrders = () => {
    setDisplayLimit(100);
    const ordersToShow = allOrders.slice(0, 100);
    setOrders(ordersToShow);
    if (window.showToast) {
      window.showToast(`Now showing ${ordersToShow.length} orders`, 'info');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedOrder(null);
    setFormData({
      user_id: '',
      total_amount: '',
      status: 'pending',
      items: []
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    try {
      const url = modalType === 'add' 
        ? 'http://localhost:3003/api/admin/orders'
        : `http://localhost:3003/api/admin/orders/${selectedOrder.id}`;
      
      const method = modalType === 'add' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (window.showToast) {
          window.showToast(
            modalType === 'add' ? 'Order created successfully!' : 'Order updated successfully!',
            'success'
          );
        }
        fetchOrders();
        handleCloseModal();
      } else {
        if (window.showToast) {
          window.showToast(data.error || 'Operation failed', 'error');
        }
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      if (window.showToast) {
        window.showToast('Error submitting order', 'error');
      }
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`http://localhost:3003/api/admin/orders/${selectedOrder.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (window.showToast) {
          window.showToast('Order deleted successfully!', 'success');
        }
        fetchOrders();
        handleCloseModal();
      } else {
        if (window.showToast) {
          window.showToast(data.error || 'Delete failed', 'error');
        }
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      if (window.showToast) {
        window.showToast('Error deleting order', 'error');
      }
    }
  };

  const getCustomerName = (userId) => {
    const customer = customers.find(c => c.id === userId);
    return customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown Customer';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-6 text-xl text-gray-700 dark:text-gray-300">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Orders Management
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
              Manage customer orders, track status, and process payments
            </p>
          </div>
          <div className="mt-6 lg:mt-0">
            <Button 
              onClick={handleAddOrder}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Order
            </Button>
          </div>
        </div>

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
                    {formatCurrency(orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0))}
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
                    {new Set(orders.map(order => order.user_id)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search orders by ID, customer, email, or status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSortField('created_at');
                    setSortDirection('desc');
                  }}
                  className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Reset Sort
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Orders ({sortedOrders.length})
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Manage and track all customer orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 dark:border-slate-700">
                  <TableHead 
                    className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center">
                      Order ID
                      <ArrowUpDown className="w-4 h-4 ml-1" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    onClick={() => handleSort('customer_name')}
                  >
                    <div className="flex items-center">
                      Customer
                      <ArrowUpDown className="w-4 h-4 ml-1" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    onClick={() => handleSort('total_amount')}
                  >
                    <div className="flex items-center">
                      Amount
                      <ArrowUpDown className="w-4 h-4 ml-1" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      <ArrowUpDown className="w-4 h-4 ml-1" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      Date
                      <ArrowUpDown className="w-4 h-4 ml-1" />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.length > 0 ? (
                  sortedOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        #{order.id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {order.first_name} {order.last_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {order.customer_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(order.total_amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(order.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                            className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                            className="border-green-200 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteOrder(order)}
                            className="border-red-200 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {/* Incremental Loading Controls */}
            {allOrders.length > 0 && (
              <div className="mt-6 text-center space-y-3 border-t border-gray-200 dark:border-slate-700 pt-6">
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
                    Show 50 More Orders
                  </Button>
                  {displayLimit > 100 && (
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
      </div>

      {/* Modals */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          {modalType === 'add' && (
            <>
              <DialogHeader>
                <DialogTitle>Add New Order</DialogTitle>
                <DialogDescription>
                  Create a new order for a customer
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user_id">Customer</Label>
                    <Select value={formData.user_id} onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.first_name} {customer.last_name} ({customer.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="total_amount">Total Amount</Label>
                    <Input
                      id="total_amount"
                      name="total_amount"
                      type="number"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Order</Button>
                </DialogFooter>
              </form>
            </>
          )}

          {modalType === 'edit' && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Order #{selectedOrder?.id}</DialogTitle>
                <DialogDescription>
                  Update order details and status
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user_id">Customer</Label>
                    <Select value={formData.user_id} onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.first_name} {customer.last_name} ({customer.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="total_amount">Total Amount</Label>
                    <Input
                      id="total_amount"
                      name="total_amount"
                      type="number"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Order</Button>
                </DialogFooter>
              </form>
            </>
          )}

          {modalType === 'view' && (
            <>
              <DialogHeader>
                <DialogTitle>Order #{selectedOrder?.id} Details</DialogTitle>
                <DialogDescription>
                  View complete order information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Customer</Label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {selectedOrder?.first_name} {selectedOrder?.last_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedOrder?.customer_email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedOrder?.status)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</Label>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(selectedOrder?.total_amount)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</Label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {formatDate(selectedOrder?.created_at)}
                    </p>
                  </div>
                </div>
                {formData.items && formData.items.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Order Items</Label>
                    <div className="mt-2 space-y-2">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700 rounded">
                          <span className="text-gray-900 dark:text-gray-100">{item.product_name}</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {item.quantity} x {formatCurrency(item.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleCloseModal}>Close</Button>
              </DialogFooter>
            </>
          )}

          {modalType === 'delete' && (
            <>
              <DialogHeader>
                <DialogTitle>Delete Order #{selectedOrder?.id}</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this order? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                <span className="text-red-800 dark:text-red-200">
                  This will permanently delete the order and all associated items.
                </span>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleConfirmDelete}>
                  Delete Order
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
