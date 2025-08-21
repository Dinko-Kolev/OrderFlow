const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'db',
  port: 5432,
  database: 'pizza_db',
  user: 'pizza_user',
  password: 'pizza_pass'
});

async function addSimpleTestOrders() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Adding simple test orders for Revenue Trend testing...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Fetch existing customers and products
    const customersResult = await client.query('SELECT id FROM users LIMIT 1');
    const productsResult = await client.query('SELECT id, base_price FROM products WHERE is_available = true LIMIT 1');
    
    if (customersResult.rows.length === 0 || productsResult.rows.length === 0) {
      throw new Error('No customers or products found in database');
    }
    
    const customerId = customersResult.rows[0].id;
    const productId = productsResult.rows[0].id;
    const productPrice = parseFloat(productsResult.rows[0].base_price);
    
    console.log(`✅ Using customer ID: ${customerId}, product ID: ${productId}, price: $${productPrice}`);
    
    // Add just 3 test orders for different months
    const testOrders = [
      {
        date: '2025-03-15T12:00:00Z',
        amount: 25.50
      },
      {
        date: '2025-05-20T18:30:00Z',
        amount: 32.75
      },
      {
        date: '2025-07-10T14:15:00Z',
        amount: 28.90
      }
    ];
    
    let successCount = 0;
    
    for (const order of testOrders) {
      try {
        console.log(`📝 Creating order for ${order.date} with amount $${order.amount}...`);
        
        // Create order
        const orderResult = await client.query(
          'INSERT INTO orders (user_id, total_amount, status, created_at) VALUES ($1, $2, $3, $4) RETURNING id',
          [customerId, order.amount, 'completed', order.date]
        );
        
        const orderId = orderResult.rows[0].id;
        console.log(`   ✅ Order created with ID: ${orderId}`);
        
        // Create order item
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)',
          [orderId, productId, 1, productPrice, order.amount]
        );
        
        console.log(`   ✅ Order item created for order ${orderId}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error creating order for ${order.date}:`, error.message);
        // Continue with other orders
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n🎉 Test orders added successfully!');
    console.log(`📊 Created ${successCount} test orders`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding test orders:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
addSimpleTestOrders()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
