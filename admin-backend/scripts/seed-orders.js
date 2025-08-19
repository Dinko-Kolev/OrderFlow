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
    const customersResult = await client.query('SELECT id, first_name, last_name FROM users LIMIT 10');
    const existingCustomers = customersResult.rows;
    console.log(`✅ Found ${existingCustomers.length} customers: ${existingCustomers.map(c => c.first_name).join(', ')}`);
    
    console.log('🍕 Fetching existing products...');
    const productsResult = await client.query('SELECT id, name, base_price FROM products WHERE is_available = true LIMIT 15');
    const existingProducts = productsResult.rows;
    console.log(`✅ Found ${existingProducts.length} products: ${existingProducts.map(p => p.name).join(', ')}`);
    
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
      weekday: { minOrders: 8, maxOrders: 15 },
      weekend: { minOrders: 15, maxOrders: 25 },
      
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
        const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items per order
        const selectedProducts = [];
        let totalAmount = 0;
        
        // Select products for this order
        for (let j = 0; j < numItems; j++) {
          const product = existingProducts[Math.floor(Math.random() * existingProducts.length)];
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
          const price = parseFloat(product.base_price);
          totalAmount += price * quantity;
          
          selectedProducts.push({
            product_id: product.id,
            quantity: quantity,
            price: price
          });
        }
        
        // Realistic status distribution based on order age
        let status;
        const daysSinceOrder = Math.floor((now - orderTime) / (1000 * 60 * 60 * 24));
        
        if (daysSinceOrder === 0) {
          // Today's orders
          const hourOfDay = now.getHours();
          if (hourOfDay < orderHour + 1) {
            status = 'pending';
          } else if (hourOfDay < orderHour + 2) {
            status = 'processing';
          } else {
            status = 'completed';
          }
        } else if (daysSinceOrder <= 7) {
          // Recent orders - mostly completed
          status = Math.random() < 0.9 ? 'completed' : 'cancelled';
        } else {
          // Older orders - all completed
          status = 'completed';
        }
        
        // Add some cancelled orders (realistic for small pizzeria)
        if (Math.random() < 0.05) { // 5% cancellation rate
          status = 'cancelled';
        }
        
        generatedOrders.push({
          order_number: `ORD-${String(orderTime.getTime()).slice(-6)}-${String(orderId).padStart(3, '0')}`,
          user_id: customer.id,
          total_amount: Math.round(totalAmount * 100) / 100,
          status: status,
          order_type: Math.random() < 0.7 ? 'delivery' : 'pickup', // 70% delivery, 30% pickup
          order_date: orderTime,
          items: selectedProducts
        });
        
        orderId++;
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
        // Create order
        const orderResult = await client.query(
          `INSERT INTO orders (
            order_number,
            user_id,
            total_amount,
            status,
            order_type,
            subtotal,
            tax_amount,
            delivery_fee,
            discount_amount,
            order_date,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          ) RETURNING id`,
          [
            orderData.order_number,
            orderData.user_id,
            orderData.total_amount,
            orderData.status,
            orderData.order_type,
            orderData.total_amount, // subtotal
            0.00, // tax_amount
            orderData.order_type === 'delivery' ? 2.50 : 0.00, // delivery fee for delivery orders
            0.00, // discount_amount
            orderData.order_date,
            orderData.order_date,
            orderData.order_date
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
        if (successCount % 50 === 0) {
          console.log(`   ✅ Created ${successCount} orders...`);
        }
        
      } catch (error) {
        console.error(`❌ Error creating order ${orderData.order_number}:`, error.message);
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
