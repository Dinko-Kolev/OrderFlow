const BaseEntity = require('./BaseEntity')

/**
 * Order Entity
 * Represents a customer order in the system
 */
class Order extends BaseEntity {
  constructor(data = {}) {
    super(data)
    
    // Core order fields
    this.user_id = data.user_id || null
    this.order_number = data.order_number || null
    this.status = data.status || 'pending'
    this.order_type = data.order_type || data.delivery_type || 'delivery'
    
    // Customer information
    this.customer_name = data.customer_name || null
    this.customer_email = data.customer_email || null
    this.customer_phone = data.customer_phone || null
    
    // Delivery information
    this.delivery_address_id = data.delivery_address_id || null
    this.delivery_address_text = data.delivery_address_text || data.deliveryAddress || null
    this.delivery_instructions = data.delivery_instructions || null
    
    // Pricing
    this.subtotal = data.subtotal || 0.00
    this.tax_amount = data.tax_amount || 0.00
    this.delivery_fee = data.delivery_fee || 0.00
    this.discount_amount = data.discount_amount || 0.00
    this.total_amount = data.total_amount || 0.00
    
    // Timestamps
    this.order_date = data.order_date || new Date()
    this.estimated_delivery_time = data.estimated_delivery_time || null
    this.actual_delivery_time = data.actual_delivery_time || null
    
    // Special instructions
    this.special_instructions = data.special_instructions || null
  }

  /**
   * Validate order data
   */
  validate() {
    const errors = []

    // Required fields validation
    if (!this.customer_name) {
      errors.push('Customer name is required')
    }

    if (!this.customer_email) {
      errors.push('Customer email is required')
    }

    if (!this.order_type || !['delivery', 'pickup'].includes(this.order_type)) {
      errors.push('Order type must be either "delivery" or "pickup"')
    }

    if (this.order_type === 'delivery' && !this.delivery_address_text) {
      errors.push('Delivery address is required for delivery orders')
    }

    if (this.total_amount <= 0) {
      errors.push('Total amount must be greater than 0')
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (this.customer_email && !emailRegex.test(this.customer_email)) {
      errors.push('Invalid email format')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Calculate order totals
   */
  calculateTotals() {
    this.subtotal = Math.max(0, this.subtotal)
    this.tax_amount = Math.max(0, this.tax_amount)
    this.delivery_fee = Math.max(0, this.delivery_fee)
    this.discount_amount = Math.max(0, this.discount_amount)
    
    this.total_amount = this.subtotal + this.tax_amount + this.delivery_fee - this.discount_amount
    
    return this.total_amount
  }

  /**
   * Update order status
   */
  updateStatus(newStatus) {
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Valid statuses are: ${validStatuses.join(', ')}`)
    }
    
    this.status = newStatus
    this.updated_at = new Date()
    
    return this
  }

  /**
   * Check if order can be cancelled
   */
  canBeCancelled() {
    return ['pending', 'confirmed'].includes(this.status)
  }

  /**
   * Check if order is completed
   */
  isCompleted() {
    return ['delivered', 'cancelled'].includes(this.status)
  }
}

module.exports = Order
