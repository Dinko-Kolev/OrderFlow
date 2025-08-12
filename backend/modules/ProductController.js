const { asyncHandler, ValidationError } = require('../utils/errors')

/**
 * Product Controller
 * Handles HTTP requests and responses for product operations
 */
class ProductController {
  constructor(productService) {
    this.productService = productService
  }

  /**
   * Get all products with optional filtering
   */
  getProducts = asyncHandler(async (req, res) => {
    const filters = {
      category_id: req.query.category_id ? parseInt(req.query.category_id) : undefined,
      is_available: req.query.is_available !== undefined ? req.query.is_available === 'true' : undefined,
      is_featured: req.query.is_featured !== undefined ? req.query.is_featured === 'true' : undefined,
      search: req.query.search,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    }

    const products = await this.productService.getProducts(filters)

    res.json({
      success: true,
      products,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: products.length
      }
    })
  })

  /**
   * Get product by ID
   */
  getProductById = asyncHandler(async (req, res) => {
    const { productId } = req.params

    if (!productId) {
      throw new ValidationError('Product ID is required')
    }

    const product = await this.productService.getProductById(parseInt(productId))

    res.json({
      success: true,
      product
    })
  })

  /**
   * Get products by category
   */
  getProductsByCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params
    const { limit = 20 } = req.query

    if (!categoryId) {
      throw new ValidationError('Category ID is required')
    }

    const products = await this.productService.getProductsByCategory(
      parseInt(categoryId),
      parseInt(limit)
    )

    res.json({
      success: true,
      products,
      category_id: parseInt(categoryId),
      total: products.length
    })
  })

  /**
   * Get featured products
   */
  getFeaturedProducts = asyncHandler(async (req, res) => {
    const { limit = 6 } = req.query

    const products = await this.productService.getFeaturedProducts(parseInt(limit))

    res.json({
      success: true,
      products,
      total: products.length
    })
  })

  /**
   * Search products
   */
  searchProducts = asyncHandler(async (req, res) => {
    const { q: searchTerm, limit = 20 } = req.query

    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new ValidationError('Search term is required')
    }

    const products = await this.productService.searchProducts(
      searchTerm.trim(),
      parseInt(limit)
    )

    res.json({
      success: true,
      products,
      search_term: searchTerm,
      total: products.length
    })
  })

  /**
   * Get product categories
   */
  getCategories = asyncHandler(async (req, res) => {
    const categories = await this.productService.getCategories()

    res.json({
      success: true,
      categories,
      total: categories.length
    })
  })

  /**
   * Get product image
   */
  getProductImage = asyncHandler(async (req, res) => {
    const { productId } = req.params

    if (!productId) {
      throw new ValidationError('Product ID is required')
    }

    // Get product image URL from database
    const result = await this.productService.dbPool.query(
      'SELECT image_url FROM products WHERE id = $1',
      [parseInt(productId)]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      })
    }

    const product = result.rows[0]

    if (!product.image_url) {
      return res.status(404).json({
        success: false,
        error: 'Product image not found'
      })
    }

    // Redirect to the actual image URL
    res.redirect(product.image_url)
  })

  /**
   * Health check endpoint
   */
  healthCheck = asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: 'Product service is healthy',
      timestamp: new Date().toISOString()
    })
  })
}

module.exports = ProductController
