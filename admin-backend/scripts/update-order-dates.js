const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'db',
  port: 5432,
  database: 'pizza_db',
  user: 'pizza_user',
  password: 'pizza_pass'
});

async function updateOrderDates() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Updating existing orders with historical dates...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Get existing orders
    const ordersResult = await client.query('SELECT id, total_amount FROM orders ORDER BY id LIMIT 30');
    const orders = ordersResult.rows;
    
    if (orders.length === 0) {
      throw new Error('No orders found in database');
    }
    
    console.log(`✅ Found ${orders.length} orders to update`);
    
    // Historical dates to distribute orders across months
    const historicalDates = [
      '2025-03-15T12:00:00Z',
      '2025-03-22T18:30:00Z',
      '2025-03-28T14:15:00Z',
      '2025-04-05T19:45:00Z',
      '2025-04-12T13:20:00Z',
      '2025-04-18T20:10:00Z',
      '2025-04-25T16:30:00Z',
      '2025-05-03T11:15:00Z',
      '2025-05-10T17:45:00Z',
      '2025-05-17T14:30:00Z',
      '2025-05-24T19:20:00Z',
      '2025-06-01T12:45:00Z',
      '2025-06-08T18:15:00Z',
      '2025-06-15T15:30:00Z',
      '2025-06-22T20:45:00Z',
      '2025-06-29T13:10:00Z',
      '2025-07-06T16:20:00Z',
      '2025-07-13T11:35:00Z',
      '2025-07-20T19:50:00Z',
      '2025-07-27T14:05:00Z',
      '2025-08-01T12:30:00Z',
      '2025-08-08T17:55:00Z',
      '2025-08-15T20:15:00Z',
      '2025-08-16T12:00:00Z',
      '2025-08-17T18:30:00Z',
      '2025-08-18T14:15:00Z',
      '2025-08-19T19:45:00Z',
      '2025-08-20T13:20:00Z',
      '2025-08-21T20:10:00Z'
    ];
    
    let successCount = 0;
    
    for (let i = 0; i < Math.min(orders.length, historicalDates.length); i++) {
      try {
        const order = orders[i];
        const newDate = historicalDates[i];
        
        console.log(`📝 Updating order ${order.id} ($${order.total_amount}) to date ${newDate}...`);
        
        // Update the order date
        await client.query(
          'UPDATE orders SET created_at = $1 WHERE id = $2',
          [newDate, order.id]
        );
        
        console.log(`   ✅ Order ${order.id} updated to ${newDate}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error updating order ${orders[i].id}:`, error.message);
        // Continue with other orders
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n🎉 Order dates updated successfully!');
    console.log(`📊 Updated ${successCount} orders with historical dates`);
    console.log(`📅 Data now spans: March 2025 - August 2025`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating order dates:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
updateOrderDates()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
