const BaseEntity = require('./BaseEntity')

/**
 * OrderItem Entity
 * Represents an individual item within an order
 */
class OrderItem extends BaseEntity {
  constructor(data = {}) {
    super(data)
    
    // Order relationship
    this.order_id = data.order_id || null
    
    // Product information
    this.product_id = data.product_id || null
    this.product_size_id = data.product_size_id || null
    this.product_name = data.product_name || null
    
    // Quantity and pricing
    this.quantity = data.quantity || 1
    this.unit_price = data.unit_price || 0.00
    this.total_price = data.total_price || 0.00
    
    // Special instructions for this item
    this.special_instructions = data.special_instructions || null
    
    // Customizations (toppings, etc.)
    this.customizations = data.customizations || []
  }

  /**
   * Validate order item data
   */
  validate() {
    const errors = []

    if (!this.order_id) {
      errors.push('Order ID is required')
    }

    if (!this.product_id && !this.product_name) {
      errors.push('Either product ID or product name is required')
    }

    if (this.quantity <= 0) {
      errors.push('Quantity must be greater than 0')
    }

    if (this.unit_price < 0) {
      errors.push('Unit price cannot be negative')
    }

    if (this.total_price < 0) {
      errors.push('Total price cannot be negative')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Calculate total price for this item
   */
  calculateTotalPrice() {
    this.total_price = this.unit_price * this.quantity
    return this.total_price
  }

  /**
   * Add customization to this item
   */
  addCustomization(customization) {
    if (!customization.topping_id && !customization.topping_name) {
      throw new Error('Customization must have either topping ID or name')
    }
    
    this.customizations.push({
      ...customization,
      id: Date.now() // Temporary ID for tracking
    })
    
    return this
  }

  /**
   * Remove customization from this item
   */
  removeCustomization(customizationId) {
    this.customizations = this.customizations.filter(c => c.id !== customizationId)
    return this
  }

  /**
   * Get total price including customizations
   */
  getTotalPriceWithCustomizations() {
    let total = this.total_price
    
    if (this.customizations && this.customizations.length > 0) {
      const customizationTotal = this.customizations.reduce((sum, custom) => {
        return sum + (custom.total_price || 0)
      }, 0)
      total += customizationTotal
    }
    
    return total
  }
}

module.exports = OrderItem
