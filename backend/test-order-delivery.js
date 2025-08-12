/**
 * Test Delivery Order Creation Script
 * Tests delivery order with card payment and address
 */

const { Pool } = require('pg')

// Database connection
const pool = new Pool({
  host: 'db',
  port: 5432,
  user: 'pizza_user',
  password: 'pizza_pass',
  database: 'pizza_db',
})

// Mock data for DELIVERY order with card payment
const mockDeliveryOrderData = {
  userId: null,
  guestEmail: 'test@delivery.com',
  customerName: 'Maria Garcia',
  customerPhone: '612345678',
  customerEmail: 'test@delivery.com',
  deliveryType: 'delivery',
  deliveryAddress: 'Calle Mayor 123, Madrid, 28001',
  paymentMethod: 'card',
  specialInstructions: 'Ring doorbell twice, leave at front door',
  items: [
    {
      productId: 1,
      quantity: 2,
      unitPrice: 7.5,
      totalPrice: 15.0,
      customizations: [
        {
          topping_id: 1,
          quantity: 1,
          price: 1.5
        }
      ],
      specialInstructions: 'Extra cheese please'
    },
    {
      productId: 23,
      quantity: 1,
      unitPrice: 2.2,
      totalPrice: 2.2,
      customizations: [],
      specialInstructions: 'No ice'
    }
  ]
}

// Test the delivery order creation process step by step
async function testDeliveryOrderCreation() {
  console.log('🚚 Testing DELIVERY Order Creation Process...')
  console.log('=============================================')
  
  try {
    // Step 1: Test database connection
    console.log('\n1️⃣ Testing database connection...')
    const testResult = await pool.query('SELECT 1 as test')
    console.log('✅ Database connection successful:', testResult.rows[0])
    
    // Step 2: Test order number generation
    console.log('\n2️⃣ Testing order number generation...')
    const orderNumberResult = await pool.query('SELECT generate_order_number() as order_number')
    const orderNumber = orderNumberResult.rows[0].order_number
    console.log('✅ Generated order number:', orderNumber)
    
    // Step 3: Test Order entity creation
    console.log('\n3️⃣ Testing Order entity creation...')
    const Order = require('./entities/Order')
    const order = new Order({
      user_id: mockDeliveryOrderData.userId,
      customer_name: mockDeliveryOrderData.customerName,
      customer_email: mockDeliveryOrderData.customerEmail,
      customer_phone: mockDeliveryOrderData.customerPhone,
      delivery_type: mockDeliveryOrderData.deliveryType,
      delivery_address_text: mockDeliveryOrderData.deliveryAddress,
      special_instructions: mockDeliveryOrderData.specialInstructions,
      subtotal: 0,
      delivery_fee: mockDeliveryOrderData.deliveryType === 'delivery' ? 2.50 : 0,
      total_amount: 0
    })
    
    console.log('✅ Order entity created:', {
      order_type: order.order_type,
      delivery_address_text: order.delivery_address_text,
      customer_name: order.customer_name,
      delivery_fee: order.delivery_fee
    })
    
    // Step 4: Test total calculation FIRST (as OrderService does)
    console.log('\n4️⃣ Testing total calculation...')
    let subtotal = 0
    for (const item of mockDeliveryOrderData.items) {
      let itemTotal = (item.unitPrice || 0) * item.quantity
      // Add customizations
      if (item.customizations && item.customizations.length > 0) {
        for (const custom of item.customizations) {
          itemTotal += (custom.price || 0) * (custom.quantity || 1)
        }
      }
      subtotal += itemTotal
    }
    order.subtotal = subtotal
    order.calculateTotals()
    
    console.log('✅ Totals calculated:', {
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      total_amount: order.total_amount,
      items_count: mockDeliveryOrderData.items.length
    })
    
    // Step 5: Test validation AFTER calculation
    console.log('\n5️⃣ Testing validation after calculation...')
    const validation = order.validate()
    console.log('✅ Validation result:', validation)
    
    if (!validation.isValid) {
      console.log('❌ Validation failed with errors:', validation.errors)
      return
    }
    
    // Step 6: Test database insertion
    console.log('\n6️⃣ Testing database insertion...')
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      const orderResult = await client.query(
        `INSERT INTO orders (
          user_id, order_number, order_type, customer_name, customer_phone, 
          customer_email, delivery_address_text, delivery_instructions, 
          subtotal, delivery_fee, total_amount, estimated_delivery_time, special_instructions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, order_number`,
        [
          order.user_id, orderNumber, order.order_type, order.customer_name, order.customer_phone,
          order.customer_email, order.delivery_address_text, null,
          order.subtotal, order.delivery_fee, order.total_amount, new Date(), order.special_instructions
        ]
      )
      
      const orderId = orderResult.rows[0].id
      console.log('✅ Order inserted successfully:', {
        id: orderId,
        order_number: orderResult.rows[0].order_number
      })
      
      // Step 7: Test order items insertion with customizations
      console.log('\n7️⃣ Testing order items insertion with customizations...')
      for (const itemData of mockDeliveryOrderData.items) {
        const itemResult = await client.query(
          `INSERT INTO order_items (
            order_id, product_id, quantity, unit_price, total_price, special_instructions
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id`,
          [
            orderId, itemData.productId, itemData.quantity,
            itemData.unitPrice, itemData.totalPrice, itemData.specialInstructions
          ]
        )
        
        const itemId = itemResult.rows[0].id
        console.log(`✅ Item ${itemData.productId} inserted with ID:`, itemId)
        
        // Insert customizations if any
        if (itemData.customizations && itemData.customizations.length > 0) {
          for (const custom of itemData.customizations) {
            await client.query(
              `INSERT INTO order_item_toppings (
                order_item_id, topping_id, quantity, unit_price, total_price
              ) VALUES ($1, $2, $3, $4, $5)`,
              [
                itemId, custom.topping_id, custom.quantity,
                custom.price, custom.price * custom.quantity
              ]
            )
            console.log(`  ✅ Customization ${custom.topping_id} added`)
          }
        }
      }
      
      await client.query('COMMIT')
      console.log('\n🎉 SUCCESS: Complete DELIVERY order created and committed to database!')
      
      // Step 8: Test order retrieval and confirmation
      console.log('\n8️⃣ Testing order retrieval and confirmation...')
      const retrievedOrder = await client.query(
        `SELECT o.*, 
          CASE 
            WHEN o.estimated_delivery_time > NOW() THEN EXTRACT(EPOCH FROM (o.estimated_delivery_time - NOW()))/60 
            ELSE 0 
          END as minutes_remaining
        FROM orders o 
        WHERE o.id = $1`,
        [orderId]
      )
      
      if (retrievedOrder.rows.length > 0) {
        const orderData = retrievedOrder.rows[0]
        console.log('✅ Order retrieved successfully:', {
          order_number: orderData.order_number,
          customer_name: orderData.customer_name,
          delivery_address: orderData.delivery_address_text,
          total_amount: orderData.total_amount,
          delivery_fee: orderData.delivery_fee,
          minutes_remaining: Math.round(orderData.minutes_remaining)
        })
      }
      
      // Get order items
      const orderItems = await client.query(
        `SELECT oi.*, p.name as product_name
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [orderId]
      )
      
      console.log(`✅ Retrieved ${orderItems.rows.length} order items`)
      
      // Clean up - delete the test order
      console.log('\n🧹 Cleaning up test data...')
      await client.query('DELETE FROM order_item_toppings WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = $1)', [orderId])
      await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId])
      await client.query('DELETE FROM orders WHERE id = $1', [orderId])
      console.log('✅ Test data cleaned up')
      
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Database insertion failed:', error)
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await pool.end()
  }
}

// Run the test
testDeliveryOrderCreation()
