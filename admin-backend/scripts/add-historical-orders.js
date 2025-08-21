const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'db',
  port: 5432,
  database: 'pizza_db',
  user: 'pizza_user',
  password: 'pizza_pass'
});

async function addHistoricalOrders() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Adding historical orders for Revenue Trend testing...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Fetch existing customers and products
    const customersResult = await client.query('SELECT id FROM users LIMIT 3');
    const productsResult = await client.query('SELECT id, base_price FROM products WHERE is_available = true LIMIT 5');
    
    if (customersResult.rows.length === 0 || productsResult.rows.length === 0) {
      throw new Error('No customers or products found in database');
    }
    
    const customers = customersResult.rows;
    const products = productsResult.rows;
    
    console.log(`✅ Using ${customers.length} customers and ${products.length} products`);
    
    // Generate historical orders across 6 months
    const historicalOrders = [
      // March 2025
      { date: '2025-03-15T12:00:00Z', amount: 45.50, customer: 0, products: [0, 1] },
      { date: '2025-03-22T18:30:00Z', amount: 32.75, customer: 1, products: [2] },
      { date: '2025-03-28T14:15:00Z', amount: 67.25, customer: 2, products: [0, 3, 4] },
      
      // April 2025
      { date: '2025-04-05T19:45:00Z', amount: 28.90, customer: 0, products: [1, 2] },
      { date: '2025-04-12T13:20:00Z', amount: 55.60, customer: 1, products: [0, 4] },
      { date: '2025-04-18T20:10:00Z', amount: 41.30, customer: 2, products: [3] },
      { date: '2025-04-25T16:30:00Z', amount: 38.75, customer: 0, products: [2, 4] },
      
      // May 2025
      { date: '2025-05-03T11:15:00Z', amount: 52.40, customer: 1, products: [0, 1, 3] },
      { date: '2025-05-10T17:45:00Z', amount: 29.85, customer: 2, products: [2] },
      { date: '2025-05-17T14:30:00Z', amount: 63.20, customer: 0, products: [0, 4] },
      { date: '2025-05-24T19:20:00Z', amount: 47.90, customer: 1, products: [1, 2, 3] },
      
      // June 2025
      { date: '2025-06-01T12:45:00Z', amount: 35.60, customer: 2, products: [2, 4] },
      { date: '2025-06-08T18:15:00Z', amount: 58.75, customer: 0, products: [0, 1, 3] },
      { date: '2025-06-15T15:30:00Z', amount: 42.10, customer: 1, products: [2] },
      { date: '2025-06-22T20:45:00Z', amount: 71.30, customer: 2, products: [0, 1, 4] },
      { date: '2025-06-29T13:10:00Z', amount: 33.45, customer: 0, products: [3] },
      
      // July 2025
      { date: '2025-07-06T16:20:00Z', amount: 49.80, customer: 1, products: [0, 2] },
      { date: '2025-07-13T11:35:00Z', amount: 66.90, customer: 2, products: [1, 3, 4] },
      { date: '2025-07-20T19:50:00Z', amount: 37.25, customer: 0, products: [2, 4] },
      { date: '2025-07-27T14:05:00Z', amount: 54.60, customer: 1, products: [0, 1, 3] },
      
      // August 2025 (keep existing data, just add a few more)
      { date: '2025-08-01T12:30:00Z', amount: 43.20, customer: 2, products: [2, 3] },
      { date: '2025-08-08T17:55:00Z', amount: 59.75, customer: 0, products: [0, 4] },
      { date: '2025-08-15T20:15:00Z', amount: 31.40, customer: 1, products: [1, 2] }
    ];
    
    let successCount = 0;
    let orderCounter = 1;
    
    for (const order of historicalOrders) {
      try {
        // Generate order number
        const orderNumber = `ORD-${String(orderCounter).padStart(6, '0')}`;
        
        console.log(`📝 Creating order ${orderNumber} for ${order.date} with amount $${order.amount}...`);
        
        // Create order with order_number
        const orderResult = await client.query(
          'INSERT INTO orders (order_number, user_id, total_amount, status, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [orderNumber, customers[order.customer].id, order.amount, 'completed', order.date]
        );
        
        const orderId = orderResult.rows[0].id;
        console.log(`   ✅ Order created with ID: ${orderId}`);
        
        // Create order items
        for (const productIndex of order.products) {
          const product = products[productIndex];
          const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
          const itemTotal = (product.base_price * quantity);
          
          await client.query(
            'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)',
            [orderId, product.id, quantity, product.base_price, itemTotal]
          );
        }
        
        console.log(`   ✅ Order items created for order ${orderId}`);
        successCount++;
        orderCounter++;
        
      } catch (error) {
        console.error(`❌ Error creating order for ${order.date}:`, error.message);
        // Continue with other orders
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n🎉 Historical orders added successfully!');
    console.log(`📊 Created ${successCount} historical orders across 6 months`);
    console.log(`📅 Data now spans: March 2025 - August 2025`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding historical orders:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
addHistoricalOrders()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
