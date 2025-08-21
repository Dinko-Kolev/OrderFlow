import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTheme } from '../contexts/ThemeContext';
import Navigation from '../components/Navigation';
import { 
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Euro,
  ShoppingCart
} from 'lucide-react';

export default function Customers() {
  const { isDarkMode } = useTheme();
  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(100);

  useEffect(() => {
    fetchCustomers();
  }, [displayLimit]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/admin/customers');
      const data = await response.json();
      
      if (data.success) {
        setAllCustomers(data.data || []);
        // Show first 100 customers initially
        const customersToShow = (data.data || []).slice(0, displayLimit);
        setCustomers(customersToShow);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '€0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleShowMoreCustomers = () => {
    const newLimit = Math.min(displayLimit + 100, allCustomers.length);
    setDisplayLimit(newLimit);
    const customersToShow = allCustomers.slice(0, newLimit);
    setCustomers(customersToShow);
  };

  const handleShowLessCustomers = () => {
    setDisplayLimit(100);
    const customersToShow = allCustomers.slice(0, 100);
    setCustomers(customersToShow);
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    if (!customer) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (customer.first_name || '').toLowerCase().includes(searchLower) ||
      (customer.last_name || '').toLowerCase().includes(searchLower) ||
      (customer.customer_email || '').toLowerCase().includes(searchLower) ||
      (customer.phone || '').toLowerCase().includes(searchLower)
    );
  });

  // Calculate statistics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c && c.status === 'active').length;
  const newCustomersThisMonth = customers.filter(c => {
    if (!c || !c.created_at) return false;
    const createdDate = new Date(c.created_at);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-6 text-xl text-gray-700 dark:text-gray-300 font-medium">Loading customers...</p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Preparing your customer database</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-b border-gray-200 dark:border-slate-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Customer Management
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Manage your restaurant's customer relationships and insights</p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
              <Button 
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total Customers</CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalCustomers}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Registered customers</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">Active Customers</CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{activeCustomers}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Active accounts</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">New This Month</CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{newCustomersThisMonth}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">New registrations</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search customers by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
              <div className="lg:w-auto flex items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredCustomers.length} of {totalCustomers} customers
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Customer Database</CardTitle>
            <CardDescription className="dark:text-gray-400">Manage your restaurant's customer relationships</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-slate-700">
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Customer</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Location</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Orders</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Total Spent</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {customer.first_name || 'Unknown'} {customer.last_name || ''}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: #{customer.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-3 h-3 mr-2" />
                            {customer.customer_email || 'No email'}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="w-3 h-3 mr-2" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-3 h-3 mr-2" />
                          {customer.address || 'No address'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <ShoppingCart className="w-3 h-3 mr-2" />
                          {customer.total_orders || 0} orders
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(customer.total_spent)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <Users className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="border-green-200 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20">
                            <Mail className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No customers found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Get started by adding your first customer'
                  }
                </p>
                <Button 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Customer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
