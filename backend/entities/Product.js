const BaseEntity = require('./BaseEntity')

/**
 * Product Entity
 * Represents a product in the system (pizza, drink, etc.)
 */
class Product extends BaseEntity {
  constructor(data = {}) {
    super(data)
    
    // Basic product information
    this.name = data.name || null
    this.description = data.description || null
    this.category_id = data.category_id || null
    this.base_price = data.base_price || 0.00
    
    // Product details
    this.image_url = data.image_url || null
    this.is_available = data.is_available !== undefined ? data.is_available : true
    this.is_featured = data.is_featured !== undefined ? data.is_featured : false
    
    // Nutritional information (optional)
    this.calories = data.calories || null
    this.allergens = data.allergens || []
    
    // Product customization options
    this.available_sizes = data.available_sizes || []
    this.available_toppings = data.available_toppings || []
    
    // Inventory
    this.stock_quantity = data.stock_quantity || 0
    this.minimum_stock = data.minimum_stock || 0
  }

  /**
   * Validate product data
   */
  validate() {
    const errors = []

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Product name is required')
    }

    if (!this.category_id) {
      errors.push('Product category is required')
    }

    if (this.base_price < 0) {
      errors.push('Base price cannot be negative')
    }

    if (this.stock_quantity < 0) {
      errors.push('Stock quantity cannot be negative')
    }

    if (this.minimum_stock < 0) {
      errors.push('Minimum stock cannot be negative')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Check if product is in stock
   */
  isInStock() {
    return this.is_available && this.stock_quantity > 0
  }

  /**
   * Check if product is low on stock
   */
  isLowStock() {
    return this.stock_quantity <= this.minimum_stock
  }

  /**
   * Update stock quantity
   */
  updateStock(quantity) {
    this.stock_quantity = Math.max(0, this.stock_quantity + quantity)
    
    // Auto-disable if out of stock
    if (this.stock_quantity === 0) {
      this.is_available = false
    }
    
    return this
  }

  /**
   * Reserve stock for order
   */
  reserveStock(quantity) {
    if (this.stock_quantity < quantity) {
      throw new Error(`Insufficient stock. Available: ${this.stock_quantity}, Requested: ${quantity}`)
    }
    
    this.stock_quantity -= quantity
    return this
  }

  /**
   * Get product price with size adjustment
   */
  getPriceForSize(sizeId) {
    if (!this.available_sizes || this.available_sizes.length === 0) {
      return this.base_price
    }
    
    const size = this.available_sizes.find(s => s.id === sizeId)
    return size ? size.price : this.base_price
  }

  /**
   * Add topping to available toppings
   */
  addAvailableTopping(toppingId) {
    if (!this.available_toppings.includes(toppingId)) {
      this.available_toppings.push(toppingId)
    }
    return this
  }

  /**
   * Remove topping from available toppings
   */
  removeAvailableTopping(toppingId) {
    this.available_toppings = this.available_toppings.filter(id => id !== toppingId)
    return this
  }
}

module.exports = Product
