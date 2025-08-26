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
    console.log('🌱 Adding comprehensive historical orders (6 months)...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // First, create default customers if none exist
    let customers = [];
    const existingCustomers = await client.query('SELECT id, first_name, last_name, email FROM users LIMIT 10');
    
    if (existingCustomers.rows.length === 0) {
      console.log('📝 Creating default customers...');
      const defaultCustomers = [
        { firstName: 'Marco', lastName: 'Rossi', email: 'marco.rossi@email.com', phone: '+39 123 456 7890' },
        { firstName: 'Giulia', lastName: 'Bianchi', email: 'giulia.bianchi@email.com', phone: '+39 234 567 8901' },
        { firstName: 'Alessandro', lastName: 'Verdi', email: 'alessandro.verdi@email.com', phone: '+39 345 678 9012' },
        { firstName: 'Francesca', lastName: 'Neri', email: 'francesca.neri@email.com', phone: '+39 456 789 0123' },
        { firstName: 'Lorenzo', lastName: 'Ferrari', email: 'lorenzo.ferrari@email.com', phone: '+39 567 890 1234' }
      ];
      
      for (const customer of defaultCustomers) {
        const result = await client.query(
          'INSERT INTO users (first_name, last_name, email, phone, is_verified, created_at) VALUES ($1, $2, $3, $4, true, NOW()) RETURNING id',
          [customer.firstName, customer.lastName, customer.email, customer.phone]
        );
        customers.push({ id: result.rows[0].id, name: `${customer.firstName} ${customer.lastName}`, email: customer.email });
      }
      console.log(`✅ Created ${customers.length} default customers`);
    } else {
      customers = existingCustomers.rows.map(c => ({ 
        id: c.id, 
        name: `${c.first_name || 'Customer'} ${c.last_name || c.id}`,
        email: c.email 
      }));
      console.log(`✅ Using ${customers.length} existing customers`);
    }
    
    // Check for products, create defaults if none exist
    let products = [];
    const existingProducts = await client.query('SELECT id, name, base_price FROM products WHERE is_available = true LIMIT 20');
    
    if (existingProducts.rows.length === 0) {
      console.log('📝 Creating default products...');
      const defaultProducts = [
        { name: 'Margherita Pizza', price: 12.50 },
        { name: 'Pepperoni Pizza', price: 14.75 },
        { name: 'Quattro Stagioni', price: 16.90 },
        { name: 'Capricciosa', price: 15.60 },
        { name: 'Diavola', price: 14.20 },
        { name: 'Marinara', price: 10.80 },
        { name: 'Prosciutto e Funghi', price: 16.40 },
        { name: 'Vegetariana', price: 13.90 },
        { name: 'Calzone', price: 12.30 },
        { name: 'Coca Cola', price: 3.50 }
      ];
      
      for (const product of defaultProducts) {
        const result = await client.query(
          'INSERT INTO products (name, description, base_price, category_id, is_available, created_at) VALUES ($1, $2, $3, 1, true, NOW()) RETURNING id',
          [product.name, `Delicious ${product.name}`, product.price]
        );
        products.push({ id: result.rows[0].id, name: product.name, base_price: product.price });
      }
      console.log(`✅ Created ${products.length} default products`);
    } else {
      products = existingProducts.rows;
      console.log(`✅ Using ${products.length} existing products`);
    }
    
    // Generate many more historical orders dynamically
    console.log('🔄 Generating comprehensive 6-month order history...');
    
    const historicalOrders = [];
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    
    // Generate 8-15 orders per month for 6 months (48-90 total orders)
    for (let month = 0; month < 6; month++) {
      const currentMonth = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + month, 1);
      const nextMonth = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + month + 1, 1);
      const daysInMonth = Math.floor((nextMonth - currentMonth) / (1000 * 60 * 60 * 24));
      
      // Generate 8-15 orders per month (more realistic volume)
      const ordersThisMonth = Math.floor(Math.random() * 8) + 8; // 8-15 orders
      
      for (let i = 0; i < ordersThisMonth; i++) {
        // Random day in month
        const day = Math.floor(Math.random() * daysInMonth) + 1;
        // Random hour between 11:00 and 22:00 (restaurant hours)
        const hour = Math.floor(Math.random() * 11) + 11;
        const minute = Math.floor(Math.random() * 60);
        
        const orderDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, hour, minute);
        
        // Random customer
        const customerIndex = Math.floor(Math.random() * customers.length);
        
        // Random number of products (1-4 items per order)
        const numProducts = Math.floor(Math.random() * 4) + 1;
        const selectedProducts = [];
        const usedProducts = new Set();
        
        for (let j = 0; j < numProducts; j++) {
          let productIndex;
          do {
            productIndex = Math.floor(Math.random() * products.length);
          } while (usedProducts.has(productIndex));
          
          usedProducts.add(productIndex);
          selectedProducts.push({
            index: productIndex,
            quantity: Math.floor(Math.random() * 3) + 1 // 1-3 quantity
          });
        }
        
        // Calculate total amount based on selected products
        let totalAmount = 0;
        selectedProducts.forEach(item => {
          totalAmount += products[item.index].base_price * item.quantity;
        });
        
        // Add random delivery fee for delivery orders (20-30% chance)
        const isDelivery = Math.random() > 0.7;
        if (isDelivery) {
          totalAmount += Math.floor(Math.random() * 3) + 3; // 3-5 euro delivery fee
        }
        
        // Add some randomness to final amount (±10%)
        totalAmount = totalAmount * (0.9 + Math.random() * 0.2);
        totalAmount = Math.round(totalAmount * 100) / 100; // Round to 2 decimals
        
        historicalOrders.push({
          date: orderDate.toISOString(),
          amount: totalAmount,
          customer: customerIndex,
          products: selectedProducts,
          isDelivery
        });
      }
    }
    
    // Sort orders by date
    historicalOrders.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log(`📊 Generated ${historicalOrders.length} orders spanning ${sixMonthsAgo.toLocaleDateString()} to ${now.toLocaleDateString()}`);
    
    let successCount = 0;
    let orderCounter = 1;
    
    for (const order of historicalOrders) {
      try {
        // Generate order number
        const orderNumber = `ORD-${String(orderCounter).padStart(6, '0')}`;
        
        console.log(`📝 Creating order ${orderNumber} for ${order.date} with amount $${order.amount}...`);
        
        // Create order with required fields
        const orderType = order.isDelivery ? 'delivery' : 'pickup';
        const deliveryFee = orderType === 'delivery' ? Math.floor(Math.random() * 3) + 3 : 0;
        const subtotal = order.amount - deliveryFee;
        const customer = customers[order.customer];
        
        const orderResult = await client.query(
          'INSERT INTO orders (order_number, user_id, total_amount, subtotal, delivery_fee, order_type, status, created_at, order_date, customer_name, customer_email, customer_phone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id',
          [
            orderNumber, 
            customer.id, 
            order.amount, 
            subtotal,
            deliveryFee,
            orderType,
            'completed', 
            order.date,
            order.date,
            customer.name,
            customer.email,
            `+39 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`
          ]
        );
        
        const orderId = orderResult.rows[0].id;
        console.log(`   ✅ Order ${orderNumber} created (${orderType}) - €${order.amount}`);
        
        // Create order items with realistic quantities
        for (const productItem of order.products) {
          const product = products[productItem.index];
          const quantity = productItem.quantity;
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
    
    console.log('\n🎉 Historical orders generation completed!');
    console.log(`📊 Created ${successCount} orders out of ${historicalOrders.length} attempted`);
    console.log(`📅 Data spans: ${sixMonthsAgo.toLocaleDateString()} to ${now.toLocaleDateString()}`);
    console.log(`💰 Order types: ~70% pickup, ~30% delivery`);
    console.log(`🍕 Products: ${products.length} different items available`);
    console.log(`👥 Customers: ${customers.length} different customers`);
    
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
