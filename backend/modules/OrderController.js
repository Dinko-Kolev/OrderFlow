const OrderService = require('./OrderService')
const { ValidationService } = require('./ValidationService')
const { RateLimitService } = require('./RateLimitService')
const { CAPTCHAService } = require('./CAPTCHAService')
const { StripeService } = require('./StripeService')
const { asyncHandler, ValidationError } = require('../utils/errors')

/**
 * Order Controller
 * Handles HTTP requests and responses for order operations
 */
class OrderController {
  constructor(orderService) {
    this.orderService = orderService
    this.validationService = new ValidationService()
    this.rateLimitService = new RateLimitService()
    this.captchaService = new CAPTCHAService()
    this.stripeService = new StripeService()
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
      items,
      recaptchaToken // For guest orders
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
      items,
      recaptchaToken
    })

    // SECURITY VALIDATION FOR GUEST ORDERS
    if (!userId) {
      console.log('🔒 Guest order detected - applying security measures...')
      
      // 1. CAPTCHA Verification for guest orders
      if (!recaptchaToken) {
        // Development mode: Allow orders without CAPTCHA for testing
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Development mode: Bypassing CAPTCHA requirement for testing');
        } else {
          throw new ValidationError('CAPTCHA verification required for guest orders')
        }
      }
      
      // Development mode: Skip CAPTCHA verification for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Development mode: Skipping CAPTCHA verification for testing');
      } else {
        const captchaResult = await this.captchaService.performSecurityCheck({
          recaptchaToken,
          action: 'order',
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          referrer: req.get('Referrer'),
          timestamp: Date.now()
        })
        
        if (!captchaResult.allowed) {
          console.log('🚫 Guest order blocked by CAPTCHA:', captchaResult.overallRisk)
          throw new ValidationError(`Order blocked: ${captchaResult.recommendations.join(', ')}`)
        }
      }
      
      // 2. Rate Limiting for guest orders
      const rateLimitResult = this.rateLimitService.checkOrderRateLimit({
        ip: req.ip || req.connection.remoteAddress,
        userId: null,
        email: customerEmail,
        phone: customerPhone
      })
      
      if (!rateLimitResult.allowed) {
        console.log('🚫 Guest order blocked by rate limiting:', rateLimitResult.reason)
        throw new ValidationError(`Order blocked: ${rateLimitResult.reason}`)
      }
      
      // 3. Enhanced Input Validation for guest orders
      const orderDataForValidation = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        order_type: deliveryType,
        delivery_address_text: deliveryAddress
      }
      
      const validationResult = this.validationService.validateOrderData(orderDataForValidation)
      if (!validationResult.isValid) {
        console.log('🚫 Guest order blocked by validation:', validationResult.errors)
        throw new ValidationError(`Validation failed: ${validationResult.errors.join(', ')}`)
      }
      
      console.log('✅ Guest order passed all security checks')
      
      // Record the request for rate limiting
      this.rateLimitService.recordRequest(
        req.ip || req.connection.remoteAddress,
        null,
        customerEmail,
        customerPhone,
        'order'
      )
    }

    // Basic validation (existing logic)
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
      order_type: deliveryType,
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

    // STRIPE PAYMENT INTEGRATION
    let paymentIntent = null;
    let stripeCustomer = null;

    // If payment method is Stripe, create payment intent first
    if (paymentMethod === 'stripe') {
      try {
        console.log('💰 Processing Stripe payment for order...');
        
        // Calculate total amount (including delivery fee)
        const subtotal = validatedItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        const totalAmount = subtotal + (deliveryType === 'delivery' ? 2.50 : 0);
        
        // Create or get Stripe customer
        if (customerEmail) {
          try {
            stripeCustomer = await this.stripeService.createCustomer(
              customerEmail,
              customerName,
              customerPhone
            );
            console.log('✅ Stripe customer created/retrieved:', stripeCustomer.id);
          } catch (error) {
            console.error('⚠️ Failed to create Stripe customer, continuing with order:', error.message);
          }
        }

        // Validate minimum amount for Stripe
        if (totalAmount < 0.50) {
          throw new ValidationError(`Amount too small for Stripe: $${totalAmount}. Minimum is $0.50`);
        }

        console.log('💰 Creating payment intent with amount:', totalAmount);
        
        // Create payment intent
        paymentIntent = await this.stripeService.createPaymentIntent(
          totalAmount,
          'eur', // Changed to EUR to match your pricing
          {
            orderType: 'pizza_order',
            customerEmail: customerEmail,
            customerName: customerName,
            customerPhone: customerPhone
          }
        );

        console.log('✅ Payment intent created:', paymentIntent.id);
        
        // Add Stripe data to order
        orderData.stripe_payment_intent_id = paymentIntent.id;
        if (stripeCustomer) {
          orderData.stripe_customer_id = stripeCustomer.id;
        }
        orderData.payment_status = 'pending';
        
      } catch (error) {
        console.error('❌ Stripe payment setup failed:', error);
        throw new ValidationError(`Payment setup failed: ${error.message}`);
      }
    }

    // Create order using service
    const result = await this.orderService.createOrder(orderData, validatedItems)

    // Return order with payment intent if using Stripe
    if (paymentMethod === 'stripe' && paymentIntent) {
      res.status(201).json({
        success: true,
        order: result,
        paymentIntent: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status
        }
      });
    } else {
      res.status(201).json(result);
    }
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
