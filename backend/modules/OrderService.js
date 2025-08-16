const Order = require('../entities/Order')
const OrderItem = require('../entities/OrderItem')
const { DatabaseError, ValidationError } = require('../utils/errors')

/**
 * Order Service
 * Handles all business logic related to orders
 */
class OrderService {
  constructor(dbPool, emailService = null) {
    this.dbPool = dbPool
    this.emailService = emailService
  }

  /**
   * Create a new order with items
   */
  async createOrder(orderData, items) {
    const client = await this.dbPool.connect()
    
    try {
      await client.query('BEGIN')

      // Create order object
      const order = new Order(orderData)

      // Debug: Log the order data
      console.log('Order data received:', orderData)
      console.log('Items received:', items)

      // Generate order number
      const orderNumberResult = await client.query('SELECT generate_order_number() as order_number')
      const orderNumber = orderNumberResult.rows[0].order_number
      order.order_number = orderNumber

      // Calculate estimated delivery time
      const estimatedDelivery = new Date()
      estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + (order.order_type === 'delivery' ? 45 : 30))
      order.estimated_delivery_time = estimatedDelivery

      // Calculate subtotal from items (support snake_case and camelCase, include customizations)
      let subtotal = 0
      for (const item of items) {
        const quantity = item.quantity || 0
        const baseUnitPrice = (item.unit_price ?? item.unitPrice ?? 0)
        let itemTotal = baseUnitPrice * quantity

        // Include customizations price if provided
        if (Array.isArray(item.customizations) && item.customizations.length > 0) {
          for (const custom of item.customizations) {
            const customUnit = (custom.unit_price ?? custom.price ?? 0)
            const customQty = (custom.quantity ?? 1)
            itemTotal += customUnit * customQty
          }
        }

        subtotal += itemTotal
        console.log('Item subtotal:', {
          product_id: item.product_id,
          quantity,
          unit_price_used: baseUnitPrice,
          customizations_count: Array.isArray(item.customizations) ? item.customizations.length : 0,
          itemTotal
        })
      }
      order.subtotal = subtotal
      console.log('Subtotal calculated:', subtotal)

      // Set delivery fee based on delivery type
      order.delivery_fee = order.order_type === 'delivery' ? 2.50 : 0.00
      console.log('Delivery fee set:', order.delivery_fee)

      // Calculate totals (this will set total_amount)
      order.calculateTotals()
      
      // Debug logging
      console.log('Order totals calculated:', {
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        total_amount: order.total_amount
      })

      // Validate order data AFTER calculation
      const validation = order.validate()
      
      if (!validation.isValid) {
        throw new ValidationError(`Order validation failed: ${validation.errors.join(', ')}`)
      }

      // Insert order
      const orderResult = await client.query(
        `INSERT INTO orders (
          user_id, order_number, order_type, customer_name, customer_phone, 
          customer_email, delivery_address_text, delivery_instructions, 
          subtotal, delivery_fee, total_amount, estimated_delivery_time, special_instructions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, order_number`,
        [
          order.user_id, order.order_number, order.order_type, order.customer_name, order.customer_phone,
          order.customer_email, order.delivery_address_text, order.delivery_instructions,
          order.subtotal, order.delivery_fee, order.total_amount, order.estimated_delivery_time, order.special_instructions
        ]
      )

      const orderId = orderResult.rows[0].id
      order.id = orderId

      // Create order items
      const orderItems = []
      for (const itemData of items) {
        const orderItem = new OrderItem({
          ...itemData,
          order_id: orderId
        })

        const validation = orderItem.validate()
        if (!validation.isValid) {
          throw new ValidationError(`Order item validation failed: ${validation.errors.join(', ')}`)
        }

        // Calculate item price
        orderItem.calculateTotalPrice()

        // Insert order item
        const itemResult = await client.query(
          `INSERT INTO order_items (
            order_id, product_id, quantity, unit_price, total_price, special_instructions
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id`,
          [
            orderItem.order_id, orderItem.product_id, orderItem.quantity,
            orderItem.unit_price, orderItem.total_price, orderItem.special_instructions
          ]
        )

        orderItem.id = itemResult.rows[0].id
        orderItems.push(orderItem)

        // Insert customizations if any
        if (itemData.customizations && itemData.customizations.length > 0) {
          for (const custom of itemData.customizations) {
            const customUnit = (custom.unit_price ?? custom.price ?? 0)
            const customQty = (custom.quantity ?? 1)
            const customTotal = (custom.total_price ?? (customUnit * customQty))
            await client.query(
              `INSERT INTO order_item_toppings (
                order_item_id, topping_id, quantity, unit_price, total_price
              ) VALUES ($1, $2, $3, $4, $5)`,
              [
                orderItem.id, custom.topping_id, customQty,
                customUnit, customTotal
              ]
            )
          }
        }
      }

      // Clear user's cart if authenticated
      if (order.user_id) {
        await client.query(
          'DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM shopping_carts WHERE user_id = $1)',
          [order.user_id]
        )
        await client.query(
          'DELETE FROM shopping_carts WHERE user_id = $1',
          [order.user_id]
        )
      }

      await client.query('COMMIT')

      // Send order confirmation email if email service is available
      if (this.emailService) {
        try {
          console.log('📧 Preparing to send order confirmation email...')
          
          // Prepare order data for email
          const orderEmailData = {
            ...order.toJSON(),
            items: orderItems.map(item => ({
              ...item.toJSON(),
              customizations: item.customizations || []
            }))
          }
          
          console.log('📧 Order data prepared for email:', {
            orderNumber: orderEmailData.order_number,
            customerEmail: orderEmailData.customer_email,
            itemsCount: orderEmailData.items.length,
            totalAmount: orderEmailData.total_amount
          })
          
          // Send confirmation email asynchronously (don't block the response)
          this.emailService.sendOrderConfirmation(orderEmailData)
            .then(result => {
              if (result.success) {
                console.log('✅ Order confirmation email sent successfully')
                console.log(`   - Message ID: ${result.messageId}`)
                if (result.message) {
                  console.log(`   - Message: ${result.message}`)
                }
              } else {
                console.error('❌ Failed to send order confirmation email:', result.error)
              }
            })
            .catch(error => {
              console.error('❌ Error sending order confirmation email:', error)
            })
        } catch (emailError) {
          // Log email error but don't fail the order creation
          console.error('❌ Error preparing order confirmation email:', emailError)
          console.error('   - Order creation will continue without email notification')
        }
      } else {
        console.log('⚠️  Email service not available - skipping order confirmation email')
      }

      return {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          totalAmount: order.total_amount,
          estimatedDelivery: order.estimated_delivery_time,
          items: orderItems
        }
      }

    } catch (error) {
      await client.query('ROLLBACK')
      
      if (error instanceof ValidationError) {
        throw error
      }
      
      console.error('Error creating order:', error)
      throw new DatabaseError('Failed to create order')
    } finally {
      client.release()
    }
  }

  /**
   * Get order by number
   */
  async getOrderByNumber(orderNumber) {
    try {
      // Get order details
      const orderResult = await this.dbPool.query(
        `SELECT o.*, 
          CASE 
            WHEN o.estimated_delivery_time > NOW() THEN EXTRACT(EPOCH FROM (o.estimated_delivery_time - NOW()))/60 
            ELSE 0 
          END as minutes_remaining
        FROM orders o 
        WHERE o.order_number = $1`,
        [orderNumber]
      )

      if (orderResult.rows.length === 0) {
        return null
      }

      const order = new Order(orderResult.rows[0])

      // Get order items
      const itemsResult = await this.dbPool.query(
        `SELECT oi.*, p.name as product_name, p.image_url
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [order.id]
      )

      const items = itemsResult.rows.map(row => new OrderItem(row))

      // Get customizations for each item
      for (const item of items) {
        const customizationsResult = await this.dbPool.query(
          `SELECT oit.*, t.name as topping_name
           FROM order_item_toppings oit
           LEFT JOIN toppings t ON oit.topping_id = t.id
           WHERE oit.order_item_id = $1`,
          [item.id]
        )
        
        // Transform customizations to match the expected format
        item.customizations = customizationsResult.rows.map(custom => ({
          topping_id: custom.topping_id,
          topping_name: custom.topping_name,
          quantity: custom.quantity,
          unit_price: custom.unit_price,
          total_price: custom.total_price
        }))
      }

      return {
        ...order.toJSON(),
        items,
        minutes_remaining: orderResult.rows[0].minutes_remaining
      }

    } catch (error) {
      console.error('Error getting order:', error)
      throw new DatabaseError('Failed to retrieve order')
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, newStatus) {
    try {
      const result = await this.dbPool.query(
        'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [newStatus, orderId]
      )

      if (result.rows.length === 0) {
        throw new Error('Order not found')
      }

      return new Order(result.rows[0])

    } catch (error) {
      console.error('Error updating order status:', error)
      throw new DatabaseError('Failed to update order status')
    }
  }

  /**
   * Get orders for user
   */
  async getUserOrders(userId, limit = 10, offset = 0) {
    try {
      const result = await this.dbPool.query(
        `SELECT * FROM orders 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      )

      return result.rows.map(row => new Order(row))

    } catch (error) {
      console.error('Error getting user orders:', error)
      throw new DatabaseError('Failed to retrieve user orders')
    }
  }

  /**
   * Get orders by email (for guest orders)
   */
  async getOrdersByEmail(email, limit = 50) {
    try {
      const result = await this.dbPool.query(
        `SELECT * FROM orders 
         WHERE customer_email = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [email, limit]
      )

      return result.rows.map(row => new Order(row))

    } catch (error) {
      console.error('Error getting orders by email:', error)
      throw new DatabaseError('Failed to retrieve orders by email')
    }
  }
}

module.exports = OrderService
