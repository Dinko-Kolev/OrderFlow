import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  Euro,
  AlertCircle,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  X,
  Calendar,
  Clock
} from 'lucide-react';

export default function Products() {
  const { isDarkMode } = useTheme();
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    base_price: '',
    category_id: '',
    image_url: '',
    is_available: true
  });
  const [displayLimit, setDisplayLimit] = useState(100);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // Show welcome toast after a short delay
    const timer = setTimeout(() => {
      window.showToast('Products management system ready! 🍕', 'success', 3000);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [displayLimit]);

  const fetchProducts = async () => {
    try {
      window.showToast('Refreshing products...', 'info', 1500);
      const response = await fetch('http://localhost:3003/api/admin/products');
      const data = await response.json();
      
      if (data.success) {
        setAllProducts(data.data || []);
        // Show first 100 products initially
        const productsToShow = (data.data || []).slice(0, displayLimit);
        setProducts(productsToShow);
        if (data.data && data.data.length > 0) {
          window.showToast(`${data.data.length} products loaded (showing ${productsToShow.length})`, 'success', 2000);
        } else {
          window.showToast('No products found', 'warning', 2000);
        }
      }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
        window.showToast('Failed to load products. Please refresh the page.', 'error', 4000);
      } finally {
        setLoading(false);
      }
    };

  const fetchCategories = async () => {
    try {
      window.showToast('Loading categories...', 'info', 1500);
      const response = await fetch('http://localhost:3003/api/admin/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data || []);
        if (data.data && data.data.length > 0) {
          window.showToast(`${data.data.length} categories loaded`, 'info', 2000);
        } else {
          window.showToast('No categories found', 'warning', 2000);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      window.showToast('Failed to load categories. Please refresh the page.', 'error', 4000);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddProduct = () => {
    setShowAddModal(true);
    window.showToast('Add Product form opened', 'info', 2000);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setNewProduct({
      name: product.name || '',
      description: product.description || '',
      base_price: product.base_price || '',
      category_id: categories.find(c => c.name === product.category_name)?.id || '',
      image_url: product.image_url || '',
      is_available: product.is_available || true
    });
    setShowEditModal(true);
    window.showToast(`Editing: ${product.name}`, 'info', 2000);
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
    window.showToast(`Viewing details for: ${product.name}`, 'info', 2000);
  };

  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
    window.showToast(`Confirming deletion of: ${product.name}`, 'warning', 3000);
  };

  const handleShowMoreProducts = () => {
    const newLimit = Math.min(displayLimit + 100, allProducts.length);
    setDisplayLimit(newLimit);
    const productsToShow = allProducts.slice(0, newLimit);
    setProducts(productsToShow);
    window.showToast(`Now showing ${productsToShow.length} products`, 'info', 2000);
  };

  const handleShowLessProducts = () => {
    setDisplayLimit(100);
    const productsToShow = allProducts.slice(0, 100);
    setProducts(productsToShow);
    window.showToast(`Now showing ${productsToShow.length} products`, 'info', 2000);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setShowDeleteModal(false);
    setSelectedProduct(null);
    setNewProduct({
      name: '',
      description: '',
      base_price: '',
      category_id: '',
      image_url: '',
      is_available: true
    });
    window.showToast('Modal closed', 'info', 1000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with ascending direction
      setSortField(field);
      setSortDirection('asc');
    }
    
    // Show toast notification
    const direction = sortField === field && sortDirection === 'asc' ? 'descending' : 'ascending';
    window.showToast(`Sorting by ${field} (${direction})`, 'info', 1500);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    
    // Show processing toast
    window.showToast('Processing your request...', 'info', 2000);
    
    try {
      const productData = {
        ...newProduct,
        base_price: parseFloat(newProduct.base_price)
      };

      if (showEditModal && selectedProduct) {
        // Update existing product
        const response = await fetch(`http://localhost:3003/api/admin/products/${selectedProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData)
        });

        if (response.ok) {
          window.showToast('Product updated successfully!', 'success');
          fetchProducts(); // Refresh the list
          handleCloseModal();
        } else {
          window.showToast('Failed to update product. Please try again.', 'error');
        }
      } else {
        // Create new product
        const response = await fetch('http://localhost:3003/api/admin/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData)
        });

        if (response.ok) {
          window.showToast('Product created successfully!', 'success');
          fetchProducts(); // Refresh the list
          handleCloseModal();
        } else {
          window.showToast('Failed to create product. Please try again.', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      window.showToast('An error occurred. Please try again.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;

    // Show processing toast
    window.showToast('Deleting product...', 'warning', 2000);

    try {
      const response = await fetch(`http://localhost:3003/api/admin/products/${selectedProduct.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        window.showToast('Product deleted successfully!', 'success');
        fetchProducts(); // Refresh the list
        handleCloseModal();
      } else {
        window.showToast('Failed to delete product. Please try again.', 'error');
        }
    } catch (error) {
      console.error('Error deleting product:', error);
      window.showToast('An error occurred. Please try again.', 'error');
    }
  };

  // Sort products function
  const sortProducts = (productsToSort) => {
    return [...productsToSort].sort((a, b) => {
      if (!a || !b) return 0;
      
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'category':
          aValue = (a.category_name || '').toLowerCase();
          bValue = (b.category_name || '').toLowerCase();
          break;
        case 'price':
          aValue = parseFloat(a.base_price) || 0;
          bValue = parseFloat(b.base_price) || 0;
          break;
        case 'status':
          aValue = a.is_available ? 1 : 0;
          bValue = b.is_available ? 1 : 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        default:
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    if (!product) return false;
    
    const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || (product.category_name || '') === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Apply sorting to filtered products
  const sortedProducts = sortProducts(filteredProducts);

      // Show toast when search results change
    useEffect(() => {
      if (searchTerm || selectedCategory !== 'all') {
        const resultCount = sortedProducts.length;
        if (resultCount === 0) {
          window.showToast('No products match your search criteria', 'warning', 2000);
        } else if (resultCount < products.length) {
          window.showToast(`Found ${resultCount} matching products`, 'success', 2000);
        }
      }
    }, [sortedProducts.length, searchTerm, selectedCategory, products.length]);

    // Show toast when sorting changes
    useEffect(() => {
      if (sortField !== 'name' || sortDirection !== 'asc') {
        window.showToast(`Products sorted by ${sortField} (${sortDirection === 'asc' ? 'ascending' : 'descending'})`, 'info', 2000);
      }
    }, [sortField, sortDirection]);

    // Show initial sorting info
    useEffect(() => {
      if (products.length > 0) {
        window.showToast(`Products sorted by ${sortField} (${sortDirection === 'asc' ? 'ascending' : 'descending'})`, 'info', 2000);
      }
    }, [products.length]);

  // Calculate statistics
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p && p.is_available === true).length;
  const outOfStockProducts = products.filter(p => p && p.is_available === false).length;
  const totalValue = products.reduce((sum, p) => {
    if (!p) return sum;
    return sum + ((parseFloat(p.base_price) || 0) * (p.is_available ? 1 : 0));
  }, 0);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-6 text-xl text-gray-700 dark:text-gray-300 font-medium">Loading products...</p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Preparing your product catalog</p>
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
                Products Management
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Manage your restaurant's product catalog and inventory</p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
              <Button 
                onClick={handleAddProduct}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total Products</CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalProducts}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">In catalog</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">Available Products</CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{activeProducts}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Available for sale</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">Unavailable</CardTitle>
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{outOfStockProducts}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Currently unavailable</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">Catalog Value</CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Euro className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalValue)}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total catalog value</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products by name or description..."
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchTerm(value);
                      if (value.length > 0) {
                        window.showToast(`Searching for: "${value}"`, 'info', 1500);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="lg:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedCategory(value);
                    if (value !== 'all') {
                      window.showToast(`Filtering by category: ${value}`, 'info', 1500);
                    } else {
                      window.showToast('Showing all categories', 'info', 1500);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Results Count and Sort Info */}
              <div className="lg:w-auto flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {sortedProducts.length} of {totalProducts} products
                </span>
                {sortField !== 'name' || sortDirection !== 'asc' ? (
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <span>Sorted by:</span>
                    <span className="font-medium capitalize">{sortField}</span>
                    <span className="font-medium">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                    <button
                      onClick={() => {
                        setSortField('name');
                        setSortDirection('asc');
                        window.showToast('Sorting reset to default', 'info', 1500);
                      }}
                      className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Product Catalog</CardTitle>
            <CardDescription className="dark:text-gray-400">Manage your restaurant's products and inventory</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-slate-700">
                    <TableHead 
                      className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
                      onClick={() => handleSort('name')}
                      title="Click to sort by product name"
                    >
                      <div className="flex items-center gap-2">
                        Product
                        <span className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {sortField === 'name' ? (
                            <span className="text-blue-600 dark:text-blue-400">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          ) : (
                            '↕'
                          )}
                        </span>
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
                      onClick={() => handleSort('category')}
                      title="Click to sort by category"
                    >
                      <div className="flex items-center gap-2">
                        Category
                        <span className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {sortField === 'category' ? (
                            <span className="text-blue-600 dark:text-blue-400">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          ) : (
                            '↕'
                          )}
                        </span>
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
                      onClick={() => handleSort('price')}
                      title="Click to sort by price"
                    >
                      <div className="flex items-center gap-2">
                        Price
                        <span className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {sortField === 'price' ? (
                            <span className="text-blue-600 dark:text-blue-400">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          ) : (
                            '↕'
                          )}
                        </span>
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
                      onClick={() => handleSort('status')}
                      title="Click to sort by availability status"
                    >
                      <div className="flex items-center gap-2">
                        Status
                        <span className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {sortField === 'status' ? (
                            <span className="text-blue-600 dark:text-blue-400">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          ) : (
                            '↕'
                          )}
                        </span>
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                            {product.image_url ? (
                              <>
                                <img 
                                  src={product.image_url} 
                                  alt={product.name || 'Product'} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-slate-600" style={{ display: 'none' }}>
                                  <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-slate-600">
                                <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{product.name || 'Unnamed Product'}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {product.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300">
                          {product.category_name || 'Uncategorized'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(product.base_price)}
                      </TableCell>
                      <TableCell>
                        {product.is_available ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Available
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            <XCircle className="w-3 h-3 mr-1" />
                            Unavailable
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewProduct(product)}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background hover:text-accent-foreground h-9 rounded-md px-3 border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditProduct(product)}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background hover:text-accent-foreground h-9 rounded-md px-3 border-green-200 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteProduct(product)}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background hover:text-accent-foreground h-9 rounded-md px-3 border-red-200 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No products found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first product'
                  }
                </p>
                <Button 
                  onClick={handleAddProduct}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Product
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Product Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {showEditModal ? 'Edit Product' : 'Add New Product'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmitProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newProduct.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Base Price *
                </label>
                <input
                  type="number"
                  name="base_price"
                  value={newProduct.base_price}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  name="category_id"
                  value={newProduct.category_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={newProduct.image_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_available"
                  checked={newProduct.is_available}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Available for sale
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  {showEditModal ? (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Update Product
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Product Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Image */}
                <div className="space-y-4">
                  <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                    {selectedProduct.image_url ? (
                      <>
                        <img 
                          src={selectedProduct.image_url} 
                          alt={selectedProduct.name || 'Product'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-slate-600" style={{ display: 'none' }}>
                          <ImageIcon className="w-24 h-24 text-gray-400 dark:text-gray-500" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-slate-600">
                        <ImageIcon className="w-24 h-24 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex justify-center">
                    {selectedProduct.is_available ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-4 py-2 text-sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Available for Sale
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-4 py-2 text-sm">
                        <XCircle className="w-4 h-4 mr-2" />
                        Currently Unavailable
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Product Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {selectedProduct.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedProduct.description || 'No description available'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Package className="w-5 h-5 text-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Category:</span> {selectedProduct.category_name || 'Uncategorized'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Euro className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Price:</span> {formatCurrency(selectedProduct.base_price)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-purple-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Created:</span> {formatDate(selectedProduct.created_at)}
                      </span>
                    </div>

                    {selectedProduct.preparation_time && (
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-orange-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Prep Time:</span> {selectedProduct.preparation_time} minutes
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowViewModal(false);
                        handleEditProduct(selectedProduct);
                      }}
                      className="flex-1 border-green-200 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Product
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowViewModal(false);
                        handleDeleteProduct(selectedProduct);
                      }}
                      className="flex-1 border-red-200 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Product
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Product</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete <span className="font-semibold">"{selectedProduct.name}"</span>?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  This will permanently remove the product from your catalog.
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Product
                </Button>
              </div>
            </div>
          </div>
        </div>
              )}
      </div>
    </Layout>
  );
}
