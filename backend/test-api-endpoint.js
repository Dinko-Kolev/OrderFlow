/**
 * Test API Endpoint Script
 * Tests the /api/orders endpoint directly to see what data is received
 */

const fetch = require('node-fetch')

// Test data that matches what frontend sends
const testOrderData = {
  userId: 1,
  guestEmail: 'test@api.com',
  customerName: 'Test User',
  customerPhone: '123456789',
  customerEmail: 'test@api.com',
  deliveryType: 'pickup',
  deliveryAddress: '',
  paymentMethod: 'cash',
  specialInstructions: 'Test order',
  items: [
    {
      productId: 1,
      quantity: 1,
      unitPrice: 7.5,
      totalPrice: 7.5,
      customizations: [],
      specialInstructions: ''
    }
  ]
}

async function testApiEndpoint() {
  console.log('🧪 Testing API Endpoint Directly...')
  console.log('====================================')
  
  try {
    console.log('\n📤 Sending data to /api/orders:')
    console.log(JSON.stringify(testOrderData, null, 2))
    
    const response = await fetch('http://localhost:3001/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testOrderData)
    })
    
    console.log('\n📥 Response Status:', response.status)
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('Response Body:', responseText)
    
    if (response.ok) {
      console.log('\n✅ SUCCESS: API endpoint working correctly!')
    } else {
      console.log('\n❌ FAILED: API endpoint returned error')
    }
    
  } catch (error) {
    console.error('❌ Error testing API endpoint:', error)
  }
}

// Run the test
testApiEndpoint()
