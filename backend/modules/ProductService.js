const Product = require('../entities/Product')
const { DatabaseError, NotFoundError } = require('../utils/errors')

/**
 * Product Service
 * Handles all business logic related to products
 */
class ProductService {
  constructor(dbPool) {
    this.dbPool = dbPool
  }

  /**
   * Get all products with optional filtering
   */
  async getProducts(filters = {}) {
    try {
      let query = `
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
      `
      const params = []
      let paramIndex = 1

      // Apply filters
      if (filters.category_id) {
        query += ` AND p.category_id = $${paramIndex}`
        params.push(filters.category_id)
        paramIndex++
      }

      if (filters.is_available !== undefined) {
        query += ` AND p.is_available = $${paramIndex}`
        params.push(filters.is_available)
        paramIndex++
      }

      if (filters.is_featured !== undefined) {
        query += ` AND p.is_featured = $${paramIndex}`
        params.push(filters.is_featured)
        paramIndex++
      }

      if (filters.search) {
        query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`
        params.push(`%${filters.search}%`)
        paramIndex++
      }

      // Add ordering
      query += ` ORDER BY p.name ASC`

      // Add pagination
      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`
        params.push(filters.limit)
        paramIndex++
      }

      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`
        params.push(filters.offset)
        paramIndex++
      }

      const result = await this.dbPool.query(query, params)
      return result.rows.map(row => new Product(row))

    } catch (error) {
      console.error('Error getting products:', error)
      throw new DatabaseError('Failed to retrieve products')
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(productId) {
    try {
      const result = await this.dbPool.query(
        `SELECT p.*, c.name as category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id = $1`,
        [productId]
      )

      if (result.rows.length === 0) {
        throw new NotFoundError('Product')
      }

      const product = new Product(result.rows[0])

      // Get available sizes
      const sizesResult = await this.dbPool.query(
        `SELECT ps.*, s.name as size_name
         FROM product_sizes ps
         LEFT JOIN sizes s ON ps.size_id = s.id
         WHERE ps.product_id = $1
         ORDER BY ps.price ASC`,
        [productId]
      )
      product.available_sizes = sizesResult.rows

      // Get available toppings
      const toppingsResult = await this.dbPool.query(
        `SELECT pt.*, t.name as topping_name, t.price as topping_price
         FROM product_toppings pt
         LEFT JOIN toppings t ON pt.topping_id = t.id
         WHERE pt.product_id = $1
         ORDER BY t.name ASC`,
        [productId]
      )
      product.available_toppings = toppingsResult.rows

      return product

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      console.error('Error getting product:', error)
      throw new DatabaseError('Failed to retrieve product')
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId, limit = 20) {
    try {
      const result = await this.dbPool.query(
        `SELECT p.*, c.name as category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.category_id = $1 AND p.is_available = true
         ORDER BY p.name ASC
         LIMIT $2`,
        [categoryId, limit]
      )

      return result.rows.map(row => new Product(row))

    } catch (error) {
      console.error('Error getting products by category:', error)
      throw new DatabaseError('Failed to retrieve products by category')
    }
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 6) {
    try {
      const result = await this.dbPool.query(
        `SELECT p.*, c.name as category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_featured = true AND p.is_available = true
         ORDER BY p.name ASC
         LIMIT $1`,
        [limit]
      )

      return result.rows.map(row => new Product(row))

    } catch (error) {
      console.error('Error getting featured products:', error)
      throw new DatabaseError('Failed to retrieve featured products')
    }
  }

  /**
   * Search products
   */
  async searchProducts(searchTerm, limit = 20) {
    try {
      const result = await this.dbPool.query(
        `SELECT p.*, c.name as category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_available = true 
         AND (p.name ILIKE $1 OR p.description ILIKE $1)
         ORDER BY 
           CASE 
             WHEN p.name ILIKE $1 THEN 1
             WHEN p.name ILIKE $2 THEN 2
             ELSE 3
           END,
           p.name ASC
         LIMIT $3`,
        [`%${searchTerm}%`, `${searchTerm}%`, limit]
      )

      return result.rows.map(row => new Product(row))

    } catch (error) {
      console.error('Error searching products:', error)
      throw new DatabaseError('Failed to search products')
    }
  }

  /**
   * Get product categories
   */
  async getCategories() {
    try {
      const result = await this.dbPool.query(
        `SELECT c.*, COUNT(p.id) as product_count
         FROM categories c
         LEFT JOIN products p ON c.id = p.category_id AND p.is_available = true
         GROUP BY c.id, c.name, c.description
         ORDER BY c.name ASC`
      )

      return result.rows

    } catch (error) {
      console.error('Error getting categories:', error)
      throw new DatabaseError('Failed to retrieve categories')
    }
  }

  /**
   * Update product stock
   */
  async updateProductStock(productId, quantity) {
    try {
      const result = await this.dbPool.query(
        `UPDATE products 
         SET stock_quantity = GREATEST(0, stock_quantity + $1),
             is_available = CASE 
               WHEN GREATEST(0, stock_quantity + $1) > 0 THEN true 
               ELSE false 
             END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [quantity, productId]
      )

      if (result.rows.length === 0) {
        throw new NotFoundError('Product')
      }

      return new Product(result.rows[0])

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      console.error('Error updating product stock:', error)
      throw new DatabaseError('Failed to update product stock')
    }
  }
}

module.exports = ProductService
