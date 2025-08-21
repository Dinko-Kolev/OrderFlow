import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, Package } from 'lucide-react';
import { useState, useEffect } from 'react';

export const CategoryDistributionWidget = ({ isDarkMode = false }) => {
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        
        // Fetch both categories and products to calculate distribution
        const [categoriesResponse, productsResponse] = await Promise.all([
          fetch('http://localhost:3003/api/admin/categories'),
          fetch('http://localhost:3003/api/admin/products')
        ]);
        
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
        if (!productsResponse.ok) throw new Error('Failed to fetch products');
        
        const categoriesData = await categoriesResponse.json();
        const productsData = await productsResponse.json();
        
        if (categoriesData.success && productsData.data) {
          const distribution = buildCategoryDistributionData(categoriesData.data, productsData.data);
          setCategoryData(distribution);
        }
        
      } catch (err) {
        console.error('Error fetching category distribution:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, []);

  const buildCategoryDistributionData = (categories, products) => {
    if (!categories || !products) return { labels: [], data: [] };

    // Count products in each category
    const categoryCounts = {};
    const categoryNames = {};
    
    // Initialize counts for all categories
    categories.forEach(category => {
      categoryCounts[category.name] = 0;
      categoryNames[category.name] = category.name;
    });
    
    // Count products in each category using category_name
    products.forEach(product => {
      if (product.category_name && categoryCounts[product.category_name] !== undefined) {
        categoryCounts[product.category_name]++;
      }
    });
    
    // Filter out categories with 0 products and sort by count
    const sortedCategories = Object.entries(categoryCounts)
      .filter(([_, count]) => count > 0)
      .sort(([_, a], [__, b]) => b - a);
    
    const labels = sortedCategories.map(([name, _]) => categoryNames[name]);
    const data = sortedCategories.map(([_, count]) => count);
    
    return { labels, data };
  };

  // Color palette for categories
  const getCategoryColors = () => [
    'bg-blue-500',
    'bg-green-500', 
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-orange-500',
    'bg-cyan-500'
  ];

  const getTotalProducts = () => {
    return categoryData.data ? categoryData.data.reduce((sum, count) => sum + count, 0) : 0;
  };

  const getTopCategory = () => {
    if (!categoryData.labels || !categoryData.data || categoryData.data.length === 0) return null;
    const maxIndex = categoryData.data.indexOf(Math.max(...categoryData.data));
    return {
      name: categoryData.labels[maxIndex],
      count: categoryData.data[maxIndex]
    };
  };

  if (loading) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Category Distribution
            </CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
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
              Category Distribution
            </CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">Error loading category distribution: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topCategory = getTopCategory();
  const totalProducts = getTotalProducts();

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            Category Distribution
          </CardTitle>
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart - Replaced with shadcn components */}
        <div className="space-y-4 mb-6">
          {/* Progress bars for each category */}
          {categoryData.labels && categoryData.labels.map((label, index) => {
            const count = categoryData.data[index];
            const total = getTotalProducts();
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            const colors = getCategoryColors();
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${colors[index % colors.length]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {totalProducts}
            </div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Products
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {categoryData.labels ? categoryData.labels.length : 0}
            </div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Active Categories
            </div>
          </div>
        </div>
        

        
        {/* Top Category Info */}
        {topCategory && (
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-700 dark:text-gray-200">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span>
                Top category: <span className="font-bold text-purple-700 dark:text-purple-300">{topCategory.name}</span> 
                <span className="text-gray-600 dark:text-gray-300"> ({topCategory.count} products)</span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryDistributionWidget;
