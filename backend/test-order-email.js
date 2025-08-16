/**
 * Test Order Email Service
 * This file tests the order confirmation email functionality
 */

const { EmailService } = require('./modules/EmailService')

// Mock order data for testing
const mockOrderData = {
  order_number: 'ORD-2024-001',
  customer_name: 'Juan Pérez',
  customer_email: 'juan.perez@example.com',
  customer_phone: '+34 600 123 456',
  order_type: 'delivery',
  delivery_address_text: 'Calle Mayor, 123, Madrid',
  delivery_instructions: 'Llamar al timbre',
  subtotal: 25.50,
  delivery_fee: 2.50,
  total_amount: 28.00,
  estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
  special_instructions: 'Sin cebolla en la pizza',
  items: [
    {
      product_id: 1,
      product_name: 'Pizza Margherita',
      quantity: 2,
      unit_price: 12.75,
      total_price: 25.50,
      customizations: [
        {
          topping_id: 1,
          topping_name: 'Extra Queso',
          quantity: 1,
          unit_price: 2.00,
          total_price: 2.00
        }
      ]
    },
    {
      product_id: 2,
      product_name: 'Coca Cola',
      quantity: 1,
      unit_price: 2.50,
      total_price: 2.50,
      customizations: []
    }
  ]
}

async function testOrderEmail() {
  console.log('🧪 Testing Order Confirmation Email Service...\n')
  
  try {
    // Initialize email service
    const emailService = new EmailService()
    
    console.log('📧 Email Service Configuration:')
    console.log(`   - SMTP Configured: ${emailService.isConfigured}`)
    console.log(`   - SMTP Host: ${process.env.SMTP_HOST || 'Not set'}`)
    console.log(`   - SMTP Port: ${process.env.SMTP_PORT || 'Not set'}`)
    console.log(`   - SMTP User: ${process.env.SMTP_USER || 'Not set'}`)
    console.log(`   - SMTP Pass: ${process.env.SMTP_PASS ? '***' : 'Not set'}\n`)
    
    // Test email generation
    console.log('📝 Testing Email Generation...')
    const emailContent = emailService.generateOrderEmail(mockOrderData)
    
    console.log('✅ Email content generated successfully')
    console.log(`   - HTML Length: ${emailContent.html.length} characters`)
    console.log(`   - Text Length: ${emailContent.text.length} characters`)
    
    // Test email sending
    console.log('\n📤 Testing Email Sending...')
    const result = await emailService.sendOrderConfirmation(mockOrderData)
    
    if (result.success) {
      console.log('✅ Email sent successfully!')
      console.log(`   - Message ID: ${result.messageId}`)
      if (result.message) {
        console.log(`   - Message: ${result.message}`)
      }
    } else {
      console.log('❌ Email sending failed')
      console.log(`   - Error: ${result.error}`)
    }
    
    // Test connection if configured
    if (emailService.isConfigured) {
      console.log('\n🔗 Testing SMTP Connection...')
      const connectionTest = await emailService.testConnection()
      
      if (connectionTest.success) {
        console.log('✅ SMTP connection successful')
      } else {
        console.log('❌ SMTP connection failed')
        console.log(`   - Error: ${connectionTest.error}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    console.error(error.stack)
  }
}

// Run the test
if (require.main === module) {
  testOrderEmail()
    .then(() => {
      console.log('\n✨ Test completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Test failed:', error)
      process.exit(1)
    })
}

module.exports = { testOrderEmail, mockOrderData }
