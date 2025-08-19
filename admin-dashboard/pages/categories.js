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
  Edit,
  Trash2,
  Eye,
  Tag,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  X,
  Calendar,
  Clock,
  Hash,
  ArrowUpDown,
  SortAsc,
  SortDesc
} from 'lucide-react';

export default function Categories() {
  const { isDarkMode } = useTheme();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
    // Show welcome toast after a short delay
    const timer = setTimeout(() => {
      window.showToast('Categories management system ready! 🏷️', 'success', 3000);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchCategories = async () => {
    try {
      window.showToast('Loading categories...', 'info', 1500);
      const response = await fetch('http://localhost:3003/api/admin/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data || []);
        if (data.data && data.data.length > 0) {
          window.showToast(`${data.data.length} categories loaded successfully`, 'success', 2000);
        } else {
          window.showToast('No categories found', 'warning', 2000);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      window.showToast('Failed to load categories. Please refresh the page.', 'error', 4000);
    } finally {
      setLoading(false);
    }
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

  // Sort categories function
  const sortCategories = (categoriesToSort) => {
    return [...categoriesToSort].sort((a, b) => {
      if (!a || !b) return 0;
      
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'display_order':
          aValue = parseInt(a.display_order) || 0;
          bValue = parseInt(b.display_order) || 0;
          break;
        case 'status':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
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

  // Filter categories based on search
  const filteredCategories = categories.filter(category => {
    if (!category) return false;
    
    const matchesSearch = (category.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (category.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Apply sorting to filtered categories
  const sortedCategories = sortCategories(filteredCategories);

  // Show toast when search results change
  useEffect(() => {
    if (searchTerm) {
      const resultCount = sortedCategories.length;
      if (resultCount === 0) {
        window.showToast('No categories match your search criteria', 'warning', 2000);
      } else if (resultCount < categories.length) {
        window.showToast(`Found ${resultCount} matching categories`, 'success', 2000);
      }
    }
  }, [sortedCategories.length, searchTerm, categories.length]);

  // Show toast when sorting changes
  useEffect(() => {
    if (sortField !== 'name' || sortDirection !== 'asc') {
      window.showToast(`Categories sorted by ${sortField} (${sortDirection === 'asc' ? 'ascending' : 'descending'})`, 'info', 2000);
    }
  }, [sortField, sortDirection]);

  const handleAddCategory = () => {
    setShowAddModal(true);
    window.showToast('Add Category form opened', 'info', 2000);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setNewCategory({
      name: category.name || '',
      description: category.description || '',
      display_order: category.display_order || 0,
      is_active: category.is_active !== false
    });
    setShowEditModal(true);
    window.showToast(`Editing: ${category.name}`, 'info', 2000);
  };

  const handleViewCategory = (category) => {
    setSelectedCategory(category);
    setShowViewModal(true);
    window.showToast(`Viewing details for: ${category.name}`, 'info', 2000);
  };

  const handleDeleteCategory = (category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
    window.showToast(`Confirming deletion of: ${category.name}`, 'warning', 3000);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setShowDeleteModal(false);
    setSelectedCategory(null);
    setNewCategory({
      name: '',
      description: '',
      display_order: 0,
      is_active: true
    });
    window.showToast('Modal closed', 'info', 1000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCategory(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
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

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    
    // Show processing toast
    window.showToast('Processing your request...', 'info', 2000);
    
    try {
      const categoryData = {
        ...newCategory,
        display_order: parseInt(newCategory.display_order) || 0
      };

      if (showEditModal && selectedCategory) {
        // Update existing category
        const response = await fetch(`http://localhost:3003/api/admin/categories/${selectedCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData)
        });

        if (response.ok) {
          window.showToast('Category updated successfully!', 'success');
          fetchCategories(); // Refresh the list
          handleCloseModal();
        } else {
          const errorData = await response.json();
          window.showToast(errorData.error || 'Failed to update category. Please try again.', 'error');
        }
      } else {
        // Create new category
        const response = await fetch('http://localhost:3003/api/admin/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData)
        });

        if (response.ok) {
          window.showToast('Category created successfully!', 'success');
          fetchCategories(); // Refresh the list
          handleCloseModal();
        } else {
          const errorData = await response.json();
          window.showToast(errorData.error || 'Failed to create category. Please try again.', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving category:', error);
      window.showToast('An error occurred. Please try again.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;

    // Show processing toast
    window.showToast('Deleting category...', 'warning', 2000);

    try {
      const response = await fetch(`http://localhost:3003/api/admin/categories/${selectedCategory.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        window.showToast('Category deleted successfully!', 'success');
        fetchCategories(); // Refresh the list
        handleCloseModal();
      } else {
        const errorData = await response.json();
        window.showToast(errorData.error || 'Failed to delete category. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      window.showToast('An error occurred. Please try again.', 'error');
    }
  };

  // Calculate statistics
  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c && c.is_active === true).length;
  const inactiveCategories = categories.filter(c => c && c.is_active === false).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-6 text-xl text-gray-700 dark:text-gray-300 font-medium">Loading categories...</p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Preparing your category catalog</p>
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
                Categories Management
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Organize your restaurant's product categories and structure</p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
              <Button 
                onClick={handleAddCategory}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
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
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total Categories</CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalCategories}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">In catalog</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">Active Categories</CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{activeCategories}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Currently active</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">Inactive Categories</CardTitle>
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{inactiveCategories}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Currently inactive</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Sort */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search categories by name or description..."
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

              {/* Results Count and Sort Info */}
              <div className="lg:w-auto flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {sortedCategories.length} of {totalCategories} categories
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

        {/* Categories Table */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Category Catalog</CardTitle>
            <CardDescription className="dark:text-gray-400">Manage your restaurant's product categories and organization</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedCategories.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-slate-700">
                    <TableHead 
                      className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
                      onClick={() => handleSort('name')}
                      title="Click to sort by category name"
                    >
                      <div className="flex items-center gap-2">
                        Category Name
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
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Description</TableHead>
                    <TableHead 
                      className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
                      onClick={() => handleSort('display_order')}
                      title="Click to sort by display order"
                    >
                      <div className="flex items-center gap-2">
                        Order
                        <span className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {sortField === 'display_order' ? (
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
                      title="Click to sort by status"
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
                  {sortedCategories.map((category) => (
                    <TableRow key={category.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                            <Tag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{category.name || 'Unnamed Category'}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {category.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs">
                          {category.description || 'No description available'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {category.display_order || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={category.is_active ? "default" : "secondary"}
                          className={category.is_active 
                            ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700" 
                            : "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700"
                          }
                        >
                          {category.is_active ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => handleViewCategory(category)}
                            variant="outline"
                            size="sm"
                            className="border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleEditCategory(category)}
                            variant="outline"
                            size="sm"
                            className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteCategory(category)}
                            variant="outline"
                            size="sm"
                            className="border-red-200 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Tag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {searchTerm ? 'No categories found' : 'No categories yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search terms or create a new category.'
                    : 'Get started by creating your first product category.'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={handleAddCategory} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Category
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Category Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {showAddModal ? 'Add New Category' : 'Edit Category'}
                </h2>
                <Button
                  onClick={handleCloseModal}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmitCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter category name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newCategory.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter category description (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    value={newCategory.display_order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={newCategory.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Category is active
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleCloseModal}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {showAddModal ? 'Create Category' : 'Update Category'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Category Modal */}
      {showViewModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Category Details: {selectedCategory.name}
                </h2>
                <Button
                  onClick={handleCloseModal}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Category Information</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Name:</span>
                        <p className="text-gray-900 dark:text-gray-100">{selectedCategory.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Description:</span>
                        <p className="text-gray-900 dark:text-gray-100">
                          {selectedCategory.description || 'No description available'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Display Order:</span>
                        <p className="text-gray-900 dark:text-gray-100">{selectedCategory.display_order || 0}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                        <Badge 
                          variant={selectedCategory.is_active ? "default" : "secondary"}
                          className={selectedCategory.is_active 
                            ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700" 
                            : "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700"
                          }
                        >
                          {selectedCategory.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Created:</span>
                        <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedCategory.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          setShowViewModal(false);
                          handleEditCategory(selectedCategory);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Category
                      </Button>
                      <Button
                        onClick={() => {
                          setShowViewModal(false);
                          handleDeleteCategory(selectedCategory);
                        }}
                        variant="outline"
                        className="w-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Category
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Category</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete the category <span className="font-semibold">"{selectedCategory.name}"</span>?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  This will permanently remove the category from your system.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCloseModal}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Category
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
