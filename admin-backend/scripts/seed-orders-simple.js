const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'db',
  port: 5432,
  database: 'pizza_db',
  user: 'pizza_user',
  password: 'pizza_pass'
});

async function seedData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting to seed database with 6 months of realistic order data...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Fetch existing customers and products
    console.log('👥 Fetching existing customers...');
    const customersResult = await client.query('SELECT id FROM users LIMIT 5');
    const existingCustomers = customersResult.rows;
    console.log(`✅ Found ${existingCustomers.length} customers`);
    
    console.log('🍕 Fetching existing products...');
    const productsResult = await client.query('SELECT id, base_price FROM products WHERE is_available = true LIMIT 10');
    const existingProducts = productsResult.rows;
    console.log(`✅ Found ${existingProducts.length} products`);
    
    if (existingCustomers.length === 0 || existingProducts.length === 0) {
      throw new Error('No customers or products found in database');
    }
    
    console.log('📋 Generating 6 months of realistic order data...');
    
    // Generate orders for the last 6 months
    const generatedOrders = [];
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    
    // Small pizzeria realistic order patterns
    const orderPatterns = {
      // Weekday vs weekend patterns
      weekday: { minOrders: 3, maxOrders: 8 },
      weekend: { minOrders: 8, maxOrders: 15 },
      
      // Monthly variations (seasonal)
      seasonal: {
        0: 0.8,   // January - slower
        1: 0.9,   // February - still slow
        2: 1.0,   // March - normal
        3: 1.1,   // April - picking up
        4: 1.2,   // May - busy
        5: 1.3,   // June - summer busy
        6: 1.4,   // July - peak summer
        7: 1.3,   // August - still busy
        8: 1.1,   // September - back to school
        9: 1.0,   // October - normal
        10: 1.2,  // November - holiday prep
        11: 1.5   // December - holiday peak
      }
    };
    
    let currentDate = new Date(sixMonthsAgo);
    let orderId = 1;
    
    while (currentDate <= now) {
      const month = currentDate.getMonth();
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      
      // Determine number of orders for this day
      const baseOrders = isWeekend ? 
        Math.floor(Math.random() * (orderPatterns.weekend.maxOrders - orderPatterns.weekend.minOrders + 1)) + orderPatterns.weekend.minOrders :
        Math.floor(Math.random() * (orderPatterns.weekday.maxOrders - orderPatterns.weekday.minOrders + 1)) + orderPatterns.weekday.minOrders;
      
      // Apply seasonal multiplier
      const seasonalMultiplier = orderPatterns.seasonal[month] || 1.0;
      const dailyOrders = Math.floor(baseOrders * seasonalMultiplier);
      
      // Generate orders for this day
      for (let i = 0; i < dailyOrders; i++) {
        // Random time during business hours (11 AM - 10 PM)
        const orderHour = Math.floor(Math.random() * 12) + 11; // 11 AM to 10 PM
        const orderMinute = Math.floor(Math.random() * 60);
        const orderTime = new Date(currentDate);
        orderTime.setHours(orderHour, orderMinute, 0, 0);
        
        // Generate realistic order
        const customer = existingCustomers[Math.floor(Math.random() * existingCustomers.length)];
        const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
        const selectedProducts = [];
        let totalAmount = 0;
        
        // Select products for this order
        for (let j = 0; j < numItems; j++) {
          const product = existingProducts[Math.floor(Math.random() * existingProducts.length)];
          const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
          const price = parseFloat(product.base_price);
          
          selectedProducts.push({
            product_id: product.id,
            quantity,
            price
          });
          
          totalAmount += price * quantity;
        }
        
        // Add some realistic variation to total amount
        totalAmount = Math.round(totalAmount * 100) / 100; // Round to 2 decimal places
        
        generatedOrders.push({
          user_id: customer.id,
          total_amount: totalAmount,
          status: 'completed',
          created_at: orderTime,
          items: selectedProducts
        });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`📅 Generated ${generatedOrders.length} orders across 6 months`);
    
    // Create the orders in database
    console.log('💾 Inserting orders into database...');
    let successCount = 0;
    
    for (const orderData of generatedOrders) {
      try {
        // Create order - only use columns that exist
        const orderResult = await client.query(
          `INSERT INTO orders (
            user_id,
            total_amount,
            status,
            created_at
          ) VALUES (
            $1, $2, $3, $4
          ) RETURNING id`,
          [
            orderData.user_id,
            orderData.total_amount,
            orderData.status,
            orderData.created_at
          ]
        );
        
        const orderId = orderResult.rows[0].id;
        
        // Create order items
        for (const item of orderData.items) {
          await client.query(
            'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)',
            [orderId, item.product_id, item.quantity, item.price, item.price * item.quantity]
          );
        }
        
        successCount++;
        if (successCount % 20 === 0) {
          console.log(`   ✅ Created ${successCount} orders...`);
        }
        
      } catch (error) {
        console.error(`❌ Error creating order ${orderId}:`, error.message);
        // Continue with other orders
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Created ${successCount} orders with items`);
    console.log(`📅 Data spans 6 months (${sixMonthsAgo.toLocaleDateString()} to ${now.toLocaleDateString()})`);
    console.log(`👥 Used ${existingCustomers.length} existing customers`);
    console.log(`🍕 Used ${existingProducts.length} existing products`);
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeding function
seedData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
