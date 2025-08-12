const OrderService = require('./OrderService')
const { asyncHandler, ValidationError } = require('../utils/errors')

/**
 * Order Controller
 * Handles HTTP requests and responses for order operations
 */
class OrderController {
  constructor(orderService) {
    this.orderService = orderService
  }

  /**
   * Create a new order
   */
  createOrder = asyncHandler(async (req, res) => {
    // Debug: Log the raw request body
    console.log('Raw request body:', req.body)
    console.log('Request headers:', req.headers)
    console.log('Content-Type:', req.get('Content-Type'))
    
    const {
      userId,
      guestEmail,
      customerName,
      customerPhone,
      customerEmail,
      deliveryType,
      deliveryAddress,
      paymentMethod,
      specialInstructions,
      items
    } = req.body

    // Debug: Log the extracted values
    console.log('Extracted values:', {
      userId,
      guestEmail,
      customerName,
      customerPhone,
      customerEmail,
      deliveryType,
      deliveryAddress,
      paymentMethod,
      specialInstructions,
      items
    })

    // Validate required fields with detailed logging
    console.log('Validation check:', {
      hasCustomerName: !!customerName,
      hasCustomerEmail: !!customerEmail,
      hasDeliveryType: !!deliveryType,
      hasItems: !!items,
      isItemsArray: Array.isArray(items),
      customerName,
      customerEmail,
      deliveryType,
      items
    })
    
    if (!customerName || !customerEmail || !deliveryType || !items || !Array.isArray(items)) {
      const missingFields = []
      if (!customerName) missingFields.push('customerName')
      if (!customerEmail) missingFields.push('customerEmail')
      if (!deliveryType) missingFields.push('deliveryType')
      if (!items) missingFields.push('items')
      if (!Array.isArray(items)) missingFields.push('items (not an array)')
      
      throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`)
    }

    if (items.length === 0) {
      throw new ValidationError('Order must contain at least one item')
    }

    // Validate delivery type
    if (!['delivery', 'pickup'].includes(deliveryType)) {
      throw new ValidationError('Delivery type must be either "delivery" or "pickup"')
    }

    // Validate delivery address for delivery orders
    if (deliveryType === 'delivery' && !deliveryAddress) {
      throw new ValidationError('Delivery address is required for delivery orders')
    }

    // Prepare order data
    const orderData = {
      user_id: userId || null,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      delivery_type: deliveryType,
      delivery_address_text: deliveryAddress,
      special_instructions: specialInstructions,
      subtotal: 0, // Will be calculated by service
      delivery_fee: deliveryType === 'delivery' ? 2.50 : 0,
      total_amount: 0 // Will be calculated by service
    }

    // Validate and process items with detailed logging
    console.log('Items validation:', items.map(item => ({
      hasProductId: !!item.productId,
      hasQuantity: !!item.quantity,
      quantityValid: item.quantity > 0,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    })))
    
    const validatedItems = items.map(item => {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        throw new ValidationError(`Item validation failed: productId=${item.productId}, quantity=${item.quantity}`)
      }

      return {
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice || 0,
        special_instructions: item.specialInstructions,
        customizations: item.customizations || []
      }
    })

    // Create order using service
    const result = await this.orderService.createOrder(orderData, validatedItems)

    res.status(201).json(result)
  })

  /**
   * Get order by number
   */
  getOrderByNumber = asyncHandler(async (req, res) => {
    const { orderNumber } = req.params

    if (!orderNumber) {
      throw new ValidationError('Order number is required')
    }

    const order = await this.orderService.getOrderByNumber(orderNumber)

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      })
    }

    res.json({
      success: true,
      order
    })
  })

  /**
   * Update order status
   */
  updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params
    const { status } = req.body

    if (!orderId) {
      throw new ValidationError('Order ID is required')
    }

    if (!status) {
      throw new ValidationError('Status is required')
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
    }

    const updatedOrder = await this.orderService.updateOrderStatus(orderId, status)

    res.json({
      success: true,
      order: updatedOrder
    })
  })

  /**
   * Get user orders
   */
  getUserOrders = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { limit = 10, offset = 0 } = req.query

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    const orders = await this.orderService.getUserOrders(
      parseInt(userId),
      parseInt(limit),
      parseInt(offset)
    )

    res.json({
      success: true,
      orders,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: orders.length
      }
    })
  })

  /**
   * Health check endpoint
   */
  healthCheck = asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: 'Order service is healthy',
      timestamp: new Date().toISOString()
    })
  })
}

module.exports = OrderController
