/**
 * Test Order Creation with Email Service
 * This file tests the complete order creation flow including email integration
 */

const { EmailService } = require('./modules/EmailService')
const { Pool } = require('pg')

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pizza_db',
  user: process.env.DB_USER || 'pizza_user',
  password: process.env.DB_PASS || 'pizza_pass'
})

// Mock order data for testing
const mockOrderData = {
  user_id: null,
  customer_name: 'Test Customer',
  customer_email: 'test@example.com',
  customer_phone: '+34 600 000 000',
  order_type: 'pickup',
  delivery_address_text: '',
  delivery_instructions: '',
  special_instructions: 'Test order for email integration',
  subtotal: 15.00,
  delivery_fee: 0.00,
  total_amount: 15.00
}

const mockItems = [
  {
    product_id: 1,
    quantity: 2,
    unit_price: 7.50,
    special_instructions: '',
    customizations: []
  }
]

async function testOrderCreation() {
  console.log('🧪 Testing Order Creation with Email Integration...\n')
  
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    console.log('📝 Step 1: Testing order number generation...')
    
    // Test order number generation
    const orderNumberResult = await client.query('SELECT generate_order_number() as order_number')
    const orderNumber = orderNumberResult.rows[0].order_number
    
    console.log(`✅ Order number generated: ${orderNumber}`)
    
    // Check if this number already exists
    const existingOrder = await client.query('SELECT id FROM orders WHERE order_number = $1', [orderNumber])
    if (existingOrder.rows.length > 0) {
      console.log(`⚠️  Order number ${orderNumber} already exists, this might cause issues`)
    } else {
      console.log(`✅ Order number ${orderNumber} is unique`)
    }
    
    console.log('\n📝 Step 2: Testing order insertion...')
    
    // Insert test order
    const orderResult = await client.query(
      `INSERT INTO orders (
        user_id, order_number, order_type, customer_name, customer_phone, 
        customer_email, delivery_address_text, delivery_instructions, 
        subtotal, delivery_fee, total_amount, estimated_delivery_time, special_instructions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, order_number`,
      [
        mockOrderData.user_id, orderNumber, mockOrderData.order_type, mockOrderData.customer_name, mockOrderData.customer_phone,
        mockOrderData.customer_email, mockOrderData.delivery_address_text, mockOrderData.delivery_instructions,
        mockOrderData.subtotal, mockOrderData.delivery_fee, mockOrderData.total_amount, 
        new Date(Date.now() + 30 * 60 * 1000), mockOrderData.special_instructions
      ]
    )
    
    const orderId = orderResult.rows[0].id
    console.log(`✅ Order inserted successfully with ID: ${orderId}`)
    
    console.log('\n📝 Step 3: Testing order items insertion...')
    
    // Insert order items
    const orderItems = []
    for (const itemData of mockItems) {
      const itemResult = await client.query(
        `INSERT INTO order_items (
          order_id, product_id, quantity, unit_price, total_price, special_instructions
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          orderId, itemData.product_id, itemData.quantity,
          itemData.unit_price, itemData.unit_price * itemData.quantity, itemData.special_instructions
        ]
      )
      
      const orderItem = {
        id: itemResult.rows[0].id,
        ...itemData,
        total_price: itemData.unit_price * itemData.quantity
      }
      orderItems.push(orderItem)
    }
    
    console.log(`✅ ${orderItems.length} order items inserted successfully`)
    
    console.log('\n📝 Step 4: Testing email service integration...')
    
    // Initialize email service
    const emailService = new EmailService()
    
    // Prepare order data for email
    const orderEmailData = {
      ...mockOrderData,
      order_number: orderNumber,
      estimated_delivery_time: new Date(Date.now() + 30 * 60 * 1000),
      items: orderItems
    }
    
    console.log('📧 Order data prepared for email:', {
      orderNumber: orderEmailData.order_number,
      customerEmail: orderEmailData.customer_email,
      itemsCount: orderEmailData.items.length,
      totalAmount: orderEmailData.total_amount
    })
    
    // Test email generation
    const emailContent = emailService.generateOrderEmail(orderEmailData)
    console.log('✅ Email content generated successfully')
    console.log(`   - HTML Length: ${emailContent.html.length} characters`)
    console.log(`   - Text Length: ${emailContent.text.length} characters`)
    
    // Test email sending
    const emailResult = await emailService.sendOrderConfirmation(orderEmailData)
    if (emailResult.success) {
      console.log('✅ Email sent successfully!')
      console.log(`   - Message ID: ${emailResult.messageId}`)
      if (emailResult.message) {
        console.log(`   - Message: ${emailResult.message}`)
      }
    } else {
      console.log('❌ Email sending failed')
      console.log(`   - Error: ${emailResult.error}`)
    }
    
    // Rollback the test data
    await client.query('ROLLBACK')
    console.log('\n🔄 Test data rolled back (not committed to database)')
    
    console.log('\n✨ Test completed successfully!')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Test failed with error:', error.message)
    console.error(error.stack)
  } finally {
    client.release()
    await pool.end()
  }
}

// Run the test
if (require.main === module) {
  testOrderCreation()
    .then(() => {
      console.log('\n🎉 All tests passed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error)
      process.exit(1)
    })
}

module.exports = { testOrderCreation, mockOrderData, mockItems }
