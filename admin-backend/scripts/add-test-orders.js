const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'db',
  port: 5432,
  database: 'pizza_db',
  user: 'pizza_user',
  password: 'pizza_pass'
});

async function addTestOrders() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Adding test orders for Revenue Trend testing...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Fetch existing customers and products
    const customersResult = await client.query('SELECT id FROM users LIMIT 1');
    const productsResult = await client.query('SELECT id FROM products WHERE is_available = true LIMIT 1');
    
    if (customersResult.rows.length === 0 || productsResult.rows.length === 0) {
      throw new Error('No customers or products found in database');
    }
    
    const customerId = customersResult.rows[0].id;
    const productId = productsResult.rows[0].id;
    
    // Add test orders for different months
    const testOrders = [
      {
        date: '2025-03-15',
        amount: 45.50,
        customer_id: customerId
      },
      {
        date: '2025-04-20',
        amount: 32.75,
        customer_id: customerId
      },
      {
        date: '2025-05-10',
        amount: 67.25,
        customer_id: customerId
      },
      {
        date: '2025-06-05',
        amount: 28.90,
        customer_id: customerId
      },
      {
        date: '2025-07-12',
        amount: 55.60,
        customer_id: customerId
      }
    ];
    
    for (const order of testOrders) {
      // Create order
      const orderResult = await client.query(
        'INSERT INTO orders (user_id, total_amount, status, created_at) VALUES ($1, $2, $3, $4) RETURNING id',
        [order.customer_id, order.amount, 'completed', order.date]
      );
      
      const orderId = orderResult.rows[0].id;
      
      // Create order item
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)',
        [orderId, productId, 1, order.amount, order.amount]
      );
      
      console.log(`✅ Added order for ${order.date}: $${order.amount}`);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('🎉 Test orders added successfully!');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding test orders:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run the function
addTestOrders()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Script failed:', err);
    process.exit(1);
  });
