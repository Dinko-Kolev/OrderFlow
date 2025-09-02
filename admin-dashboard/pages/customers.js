import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Users, 
  Mail, 
  Phone, 
  Calendar,
  MapPin
} from 'lucide-react';

export default function Customers() {
  const { isDarkMode } = useTheme();
  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(100);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [displayLimit]);

  // Filter customers based on search term
  useEffect(() => {
    let filtered = allCustomers;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply display limit
    filtered = filtered.slice(0, displayLimit);

    setCustomers(filtered);
  }, [allCustomers, searchTerm, displayLimit]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.customers.getAll();
      
      setAllCustomers(data.data || []);
      // Customers will be filtered by the useEffect
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowMoreCustomers = () => {
    const newLimit = Math.min(displayLimit + 100, allCustomers.length);
    setDisplayLimit(newLimit);
    const customersToShow = allCustomers.slice(0, newLimit);
    setCustomers(customersToShow);
    if (window.showToast) {
      window.showToast(`Now showing ${customersToShow.length} customers`, 'info', 2000);
    }
  };

  const handleShowLessCustomers = () => {
    setDisplayLimit(100);
    const customersToShow = allCustomers.slice(0, 100);
    setCustomers(customersToShow);
    if (window.showToast) {
      window.showToast(`Now showing ${customersToShow.length} customers`, 'info', 2000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setModalType('view');
    setShowModal(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || ''
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

  const handleSaveCustomer = async () => {
    if (!selectedCustomer) return;

    setIsSubmitting(true);
    try {
      // Call the API to update the customer
      await apiClient.customers.update(selectedCustomer.id, editForm);
      
      // Update the local state
      setAllCustomers(prev => prev.map(customer => 
        customer.id === selectedCustomer.id 
          ? { ...customer, ...editForm }
          : customer
      ));

      setShowModal(false);
      setEditForm({});
      
      if (window.showToast) {
        window.showToast('Customer updated successfully', 'success', 3000);
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      if (window.showToast) {
        window.showToast('Failed to update customer', 'error', 4000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && customers.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-6 text-xl text-gray-700 dark:text-gray-300 font-medium">Loading customers...</p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Preparing your customer data</p>
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
                  Customers
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                  Manage customer information and track their orders
                </p>
              </div>
              
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{customers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">With Email</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {customers.filter(c => c.email).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Phone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">With Phone</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {customers.filter(c => c.phone).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl mb-6">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search customers by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customers Table */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>All Customers</span>
              </CardTitle>
              <CardDescription>
                Showing {customers.length} of {allCustomers.length} customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No customers found</h3>
                  <p className="text-gray-500 dark:text-gray-400">Customers will appear here once they are created</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200 dark:border-slate-700">
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Name</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Contact</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Location</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Joined</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {customer.first_name} {customer.last_name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {customer.email && (
                                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                  <Mail className="h-3 w-3" />
                                  <span>{customer.email}</span>
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                  <Phone className="h-3 w-3" />
                                  <span>{customer.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {customer.address && (
                              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                <MapPin className="h-3 w-3" />
                                <span>{customer.address}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {formatDate(customer.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                onClick={() => handleViewCustomer(customer)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                                onClick={() => handleEditCustomer(customer)}
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
                  {allCustomers.length > displayLimit && (
                    <div className="mt-6 flex items-center justify-center space-x-4">
                      <Button
                        variant="outline"
                        onClick={handleShowMoreCustomers}
                        className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        Show 100 More Customers
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShowLessCustomers}
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

      {/* Customer Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>
                {modalType === 'edit' ? 'Edit Customer' : 'Customer Details'} - {selectedCustomer?.first_name} {selectedCustomer?.last_name}
              </span>
            </DialogTitle>
            <DialogDescription>
              {modalType === 'edit' 
                ? 'Update customer information' 
                : 'Complete customer information and details'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Personal Information</h3>
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
                      </>
                    ) : (
                      <>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</Label>
                          <p className="text-gray-900 dark:text-gray-100">
                            {selectedCustomer.first_name} {selectedCustomer.last_name}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Contact Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</Label>
                      {modalType === 'edit' ? (
                        <Input
                          id="email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => handleFormChange('email', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-gray-100 flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          {selectedCustomer.email || 'N/A'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</Label>
                      {modalType === 'edit' ? (
                        <Input
                          id="phone"
                          value={editForm.phone}
                          onChange={(e) => handleFormChange('phone', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-gray-100 flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {selectedCustomer.phone || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Address Information</h3>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</Label>
                  {modalType === 'edit' ? (
                    <Input
                      id="address"
                      value={editForm.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      className="mt-1"
                      placeholder="Enter customer address"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {selectedCustomer.address || 'N/A'}
                    </p>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Customer ID</Label>
                    <p className="text-gray-900 dark:text-gray-100">#{selectedCustomer.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Member Since</Label>
                    <p className="text-gray-900 dark:text-gray-100 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(selectedCustomer.created_at)}
                    </p>
                  </div>
                </div>
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
                  onClick={handleSaveCustomer}
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
