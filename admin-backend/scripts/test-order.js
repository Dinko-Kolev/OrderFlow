const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  host: 'db',
  port: 5432,
  user: 'pizza_user',
  password: 'pizza_pass',
  database: 'pizza_db'
});

async function testOrder() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing order creation...');
    
    // Try to create a simple order with minimal fields
    const orderResult = await client.query(`
      INSERT INTO orders (
        order_number, 
        user_id, 
        total_amount, 
        status, 
        order_type, 
        subtotal,
        created_at, 
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `, [
      'TEST-001',
      1, // user_id
      15.00, // total_amount
      'pending', // status
      'delivery', // order_type
      15.00 // subtotal
    ]);
    
    console.log('✅ Order created successfully!');
    console.log('Order details:', orderResult.rows[0]);
    
    // Clean up - delete the test order
    await client.query('DELETE FROM orders WHERE order_number = $1', ['TEST-001']);
    console.log('🧹 Test order cleaned up');
    
  } catch (error) {
    console.error('❌ Error creating test order:', error.message);
    console.error('Full error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testOrder();
