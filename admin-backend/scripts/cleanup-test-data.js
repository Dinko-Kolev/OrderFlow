const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'db',
  port: 5432,
  database: 'pizza_db',
  user: 'pizza_user',
  password: 'pizza_pass'
});

async function cleanupTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting cleanup of test order data...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Count orders before cleanup
    const ordersBefore = await client.query('SELECT COUNT(*) as count FROM orders');
    const orderItemsBefore = await client.query('SELECT COUNT(*) as count FROM order_items');
    
    console.log(`📊 Before cleanup: ${ordersBefore.rows[0].count} orders, ${orderItemsBefore.rows[0].count} order items`);
    
    // Delete all test orders and their items
    // We'll delete orders with order_number pattern ORD-XXXXXX-XXX (created by seed script)
    console.log('🗑️  Deleting test orders and order items...');
    
    // First, get the IDs of test orders to delete
    const testOrderIds = await client.query(`
      SELECT id FROM orders 
      WHERE order_number LIKE 'ORD-%' 
      AND order_number ~ '^ORD-[0-9]{6}-[0-9]{3}$'
    `);
    
    if (testOrderIds.rows.length > 0) {
      console.log(`🔍 Found ${testOrderIds.rows.length} test orders to delete`);
      
      // Delete order items first (due to foreign key constraints)
      const orderIds = testOrderIds.rows.map(row => row.id);
      const placeholders = orderIds.map((_, index) => `$${index + 1}`).join(',');
      
      const deletedOrderItems = await client.query(
        `DELETE FROM order_items WHERE order_id IN (${placeholders})`,
        orderIds
      );
      
      console.log(`   📦 Deleted ${deletedOrderItems.rowCount} order items`);
      
      // Now delete the orders
      const deletedOrders = await client.query(
        `DELETE FROM orders WHERE id IN (${placeholders})`,
        orderIds
      );
      
      console.log(`   📋 Deleted ${deletedOrders.rowCount} orders`);
      
    } else {
      console.log('ℹ️  No test orders found to delete');
    }
    
    // Count orders after cleanup
    const ordersAfter = await client.query('SELECT COUNT(*) as count FROM orders');
    const orderItemsAfter = await client.query('SELECT COUNT(*) as count FROM order_items');
    
    console.log(`📊 After cleanup: ${ordersAfter.rows[0].count} orders, ${orderItemsAfter.rows[0].count} order items`);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n✅ Cleanup completed successfully!');
    console.log(`🗑️  Removed ${ordersBefore.rows[0].count - ordersAfter.rows[0].count} test orders`);
    console.log(`🗑️  Removed ${orderItemsBefore.rows[0].count - orderItemsAfter.rows[0].count} test order items`);
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the cleanup function
cleanupTestData()
  .then(() => {
    console.log('✅ Cleanup script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup script failed:', error);
    process.exit(1);
  });
