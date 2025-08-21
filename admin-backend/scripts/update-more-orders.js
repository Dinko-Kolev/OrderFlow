const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'db',
  port: 5432,
  database: 'pizza_db',
  user: 'pizza_user',
  password: 'pizza_pass'
});

async function updateMoreOrders() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Updating more orders with historical dates...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Get more orders to update (let's get the next 100 orders)
    const ordersResult = await client.query('SELECT id, total_amount FROM orders ORDER BY id LIMIT 100 OFFSET 30');
    const orders = ordersResult.rows;
    
    if (orders.length === 0) {
      throw new Error('No more orders found to update');
    }
    
    console.log(`✅ Found ${orders.length} more orders to update`);
    
    // Historical dates to distribute orders across months (more dates)
    const historicalDates = [
      // March 2025
      '2025-03-01T12:00:00Z', '2025-03-08T18:30:00Z', '2025-03-15T14:15:00Z', '2025-03-22T19:45:00Z', '2025-03-29T13:20:00Z',
      // April 2025
      '2025-04-02T20:10:00Z', '2025-04-09T16:30:00Z', '2025-04-16T11:15:00Z', '2025-04-23T17:45:00Z', '2025-04-30T14:30:00Z',
      // May 2025
      '2025-05-01T19:20:00Z', '2025-05-08T12:45:00Z', '2025-05-15T18:15:00Z', '2025-05-22T15:30:00Z', '2025-05-29T20:45:00Z',
      // June 2025
      '2025-06-03T13:10:00Z', '2025-06-10T16:20:00Z', '2025-06-17T11:35:00Z', '2025-06-24T19:50:00Z', '2025-06-30T14:05:00Z',
      // July 2025
      '2025-07-02T12:30:00Z', '2025-07-09T17:55:00Z', '2025-07-16T20:15:00Z', '2025-07-23T12:00:00Z', '2025-07-30T18:30:00Z',
      // August 2025 (keep some recent)
      '2025-08-01T14:15:00Z', '2025-08-08T19:45:00Z', '2025-08-15T13:20:00Z', '2025-08-20T20:10:00Z', '2025-08-21T16:30:00Z'
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
    
    console.log('\n🎉 More orders updated successfully!');
    console.log(`📊 Updated ${successCount} orders with historical dates`);
    console.log(`📅 Data now spans: March 2025 - August 2025`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating more orders:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
updateMoreOrders()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
