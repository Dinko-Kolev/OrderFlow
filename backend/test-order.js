/**
 * Test Order Creation Script
 * Simulates the exact data flow from frontend to backend
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

// Mock data exactly as sent from frontend
const mockOrderData = {
  userId: null,
  guestEmail: 'dnkthegamer@gmail.com',
  customerName: 'Kolev Dinko',
  customerPhone: '635590163',
  customerEmail: 'dnkthegamer@gmail.com',
  deliveryType: 'pickup',
  deliveryAddress: '',
  paymentMethod: 'cash',
  specialInstructions: 'Test 3',
  items: [
    {
      productId: 1,
      quantity: 1,
      unitPrice: 7.5,
      totalPrice: 7.5,
      customizations: [],
      specialInstructions: ''
    },
    {
      productId: 23,
      quantity: 1,
      unitPrice: 2.2,
      totalPrice: 2.2,
      customizations: [],
      specialInstructions: ''
    }
  ]
}

// Test the order creation process step by step
async function testOrderCreation() {
  console.log('🧪 Testing Order Creation Process...')
  console.log('=====================================')
  
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
      user_id: mockOrderData.userId,
      customer_name: mockOrderData.customerName,
      customer_email: mockOrderData.customerEmail,
      customer_phone: mockOrderData.customerPhone,
      delivery_type: mockOrderData.deliveryType,
      delivery_address_text: mockOrderData.deliveryAddress,
      special_instructions: mockOrderData.specialInstructions,
      subtotal: 0,
      delivery_fee: mockOrderData.deliveryType === 'delivery' ? 2.50 : 0,
      total_amount: 0
    })
    
    console.log('✅ Order entity created:', {
      order_type: order.order_type,
      delivery_address_text: order.delivery_address_text,
      customer_name: order.customer_name
    })
    
    // Step 4: Test total calculation FIRST (as OrderService does)
    console.log('\n4️⃣ Testing total calculation...')
    let subtotal = 0
    for (const item of mockOrderData.items) {
      subtotal += (item.unitPrice || 0) * item.quantity
    }
    order.subtotal = subtotal
    order.calculateTotals()
    
    console.log('✅ Totals calculated:', {
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      total_amount: order.total_amount
    })
    
    // Step 5: Test validation AFTER calculation
    console.log('\n5️⃣ Testing validation after calculation...')
    const validation = order.validate()
    console.log('✅ Validation result:', validation)
    
    if (!validation.isValid) {
      console.log('❌ Validation failed with errors:', validation.errors)
      return
    }
    
    // Step 7: Test database insertion
    console.log('\n7️⃣ Testing database insertion...')
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
      
      // Step 8: Test order items insertion
      console.log('\n8️⃣ Testing order items insertion...')
      for (const itemData of mockOrderData.items) {
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
        console.log(`✅ Item ${itemData.productId} inserted with ID:`, itemResult.rows[0].id)
      }
      
      await client.query('COMMIT')
      console.log('\n🎉 SUCCESS: Complete order created and committed to database!')
      
      // Clean up - delete the test order
      console.log('\n🧹 Cleaning up test data...')
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
testOrderCreation()
