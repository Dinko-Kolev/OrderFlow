const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'pizza_user',
  password: process.env.DB_PASS || 'pizza_pass',
  database: process.env.DB_NAME || 'pizza_db',
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to OrderFlow Pizza API! 🍕' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

// Authentication Routes

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 8 caracteres' 
      });
    }

    const client = await pool.connect();
    try {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ 
          error: 'El email ya está registrado' 
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new user
      const result = await client.query(
        `INSERT INTO users (first_name, last_name, email, phone, password_hash, created_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
         RETURNING id, first_name, last_name, email, phone, created_at`,
        [firstName, lastName, email, phone, hashedPassword]
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Usuario creado exitosamente',
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone
        },
        token
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      });
    }

    const client = await pool.connect();
    try {
      // Find user by email
      const result = await client.query(
        'SELECT id, first_name, last_name, email, phone, password_hash FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ 
          error: 'Email o contraseña incorrectos' 
        });
      }

      const user = result.rows[0];

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return res.status(401).json({ 
          error: 'Email o contraseña incorrectos' 
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Inicio de sesión exitoso',
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone
        },
        token
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Protected route example
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, first_name, last_name, email, phone, created_at FROM users WHERE id = $1',
        [req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const user = result.rows[0];
      res.json({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        createdAt: user.created_at
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Products Routes (existing)
app.get('/api/products', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.is_available = true 
        ORDER BY p.category_id, p.name
      `);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/categories', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM categories 
        ORDER BY display_order
      `);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// =============================================
// RESERVATIONS ENDPOINTS
// =============================================

// Create a new reservation
app.post('/api/reservations', async (req, res) => {
  try {
    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      reservationDate, 
      reservationTime, 
      numberOfGuests, 
      specialRequests,
      userId = null
    } = req.body

    // Validation
    if (!customerName || !customerEmail || !customerPhone || !reservationDate || !reservationTime || !numberOfGuests) {
      return res.status(400).json({ error: 'Todos los campos requeridos deben estar completos' })
    }

    if (numberOfGuests < 1 || numberOfGuests > 20) {
      return res.status(400).json({ error: 'El número de comensales debe ser entre 1 y 20' })
    }

    // Check if date is not in the past
    const reservationDateTime = new Date(`${reservationDate}T${reservationTime}`)
    if (reservationDateTime <= new Date()) {
      return res.status(400).json({ error: 'No se pueden hacer reservas en fechas pasadas' })
    }

    // Check availability (simple logic: max 10 reservations per time slot)
    const existingReservations = await pool.query(
      'SELECT COUNT(*) as count FROM table_reservations WHERE reservation_date = $1 AND reservation_time = $2 AND status = $3',
      [reservationDate, reservationTime, 'confirmed']
    )

    const maxReservationsPerSlot = 10
    if (parseInt(existingReservations.rows[0].count) >= maxReservationsPerSlot) {
      return res.status(400).json({ error: 'No hay disponibilidad para esa fecha y hora' })
    }

    // Insert reservation
    const result = await pool.query(
      `INSERT INTO table_reservations 
       (user_id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, number_of_guests, special_requests) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [userId, customerName, customerEmail, customerPhone, reservationDate, reservationTime, numberOfGuests, specialRequests || null]
    )

    const reservation = result.rows[0]

    console.log(`✅ New reservation created: ${customerName} for ${reservationDate} at ${reservationTime}`)

    res.status(201).json({
      message: 'Reserva confirmada exitosamente',
      reservation: {
        id: reservation.id,
        customerName: reservation.customer_name,
        customerEmail: reservation.customer_email,
        reservationDate: reservation.reservation_date,
        reservationTime: reservation.reservation_time,
        numberOfGuests: reservation.number_of_guests,
        status: reservation.status,
        createdAt: reservation.created_at
      }
    })

  } catch (error) {
    console.error('Error creating reservation:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Check availability for a specific date
app.get('/api/reservations/availability/:date', async (req, res) => {
  try {
    const { date } = req.params
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' })
    }

    // All possible time slots
    const allSlots = [
      '12:00:00', '12:30:00', '13:00:00', '13:30:00', '14:00:00', '14:30:00',
      '19:00:00', '19:30:00', '20:00:00', '20:30:00', '21:00:00', '21:30:00', '22:00:00'
    ]

    // Get existing reservations for the date
    const reservedSlots = await pool.query(
      'SELECT reservation_time, COUNT(*) as count FROM table_reservations WHERE reservation_date = $1 AND status = $2 GROUP BY reservation_time',
      [date, 'confirmed']
    )

    const maxReservationsPerSlot = 10

    // Calculate availability for each slot
    const availability = allSlots.map(slot => {
      const slotTime = slot.substring(0, 5) // Convert to HH:MM format
      const reserved = reservedSlots.rows.find(r => r.reservation_time === slot)
      const reservedCount = reserved ? parseInt(reserved.count) : 0
      const spotsLeft = Math.max(0, maxReservationsPerSlot - reservedCount)
      
      return {
        time: slotTime,
        available: spotsLeft > 0,
        spotsLeft: spotsLeft,
        totalReservations: reservedCount
      }
    })

    res.json(availability)

  } catch (error) {
    console.error('Error checking availability:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Get reservations for a specific user (protected route)
app.get('/api/reservations/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId

    const reservations = await pool.query(
      'SELECT * FROM table_reservations WHERE user_id = $1 ORDER BY reservation_date DESC, reservation_time DESC',
      [userId]
    )

    const formattedReservations = reservations.rows.map(r => ({
      id: r.id,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      customerPhone: r.customer_phone,
      reservationDate: r.reservation_date,
      reservationTime: r.reservation_time,
      numberOfGuests: r.number_of_guests,
      specialRequests: r.special_requests,
      status: r.status,
      createdAt: r.created_at
    }))

    res.json(formattedReservations)

  } catch (error) {
    console.error('Error fetching user reservations:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Cancel a reservation (protected route)
app.put('/api/reservations/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    // Check if reservation exists and belongs to user
    const reservation = await pool.query(
      'SELECT * FROM table_reservations WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (reservation.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' })
    }

    // Check if reservation can be cancelled (at least 2 hours before)
    const reservationDateTime = new Date(`${reservation.rows[0].reservation_date}T${reservation.rows[0].reservation_time}`)
    const now = new Date()
    const timeDiff = reservationDateTime.getTime() - now.getTime()
    const hoursDiff = timeDiff / (1000 * 3600)

    if (hoursDiff < 2) {
      return res.status(400).json({ error: 'No se puede cancelar una reserva con menos de 2 horas de antelación' })
    }

    // Update reservation status
    await pool.query(
      'UPDATE table_reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelled', id]
    )

    res.json({ message: 'Reserva cancelada exitosamente' })

  } catch (error) {
    console.error('Error cancelling reservation:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// =============================================
// CART ENDPOINTS
// =============================================

// Get pizza toppings for customization
app.get('/api/toppings', async (req, res) => {
  try {
    const toppings = await pool.query(
      'SELECT * FROM pizza_toppings WHERE is_active = true ORDER BY category, name'
    )

    // Group by category for easier frontend use
    const groupedToppings = {
      removal: toppings.rows.filter(t => t.category === 'removal'),
      ingredient: toppings.rows.filter(t => t.category === 'ingredient'),
      oregano: toppings.rows.filter(t => t.category === 'oregano'),
      sauce: toppings.rows.filter(t => t.category === 'sauce')
    }

    res.json(groupedToppings)
  } catch (error) {
    console.error('Error fetching toppings:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Get or create cart for user/session
app.get('/api/cart', async (req, res) => {
  try {
    let cart
    const sessionId = req.headers['x-session-id']

    if (req.user) {
      // Get cart for authenticated user
      cart = await pool.query(
        'SELECT * FROM shopping_carts WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
        [req.user.userId]
      )
    } else if (sessionId) {
      // Get cart for guest session
      cart = await pool.query(
        'SELECT * FROM shopping_carts WHERE session_id = $1 AND expires_at > CURRENT_TIMESTAMP ORDER BY updated_at DESC LIMIT 1',
        [sessionId]
      )
    }

    if (cart && cart.rows.length > 0) {
      const cartId = cart.rows[0].id

      // Get cart items with product details and customizations
      const items = await pool.query(`
        SELECT 
          ci.*,
          p.name as product_name,
          p.image_url as product_image,
          array_agg(
            json_build_object(
              'topping_id', cic.topping_id,
              'topping_name', pt.name,
              'quantity', cic.quantity,
              'price', cic.price
            )
          ) FILTER (WHERE cic.id IS NOT NULL) as customizations
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        LEFT JOIN cart_item_customizations cic ON ci.id = cic.cart_item_id
        LEFT JOIN pizza_toppings pt ON cic.topping_id = pt.id
        WHERE ci.cart_id = $1
        GROUP BY ci.id, p.name, p.image_url
        ORDER BY ci.created_at
      `, [cartId])

      const totalItems = items.rows.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = items.rows.reduce((sum, item) => sum + (item.total_price * item.quantity), 0)

      res.json({
        cartId: cartId,
        sessionId: cart.rows[0].session_id,
        items: items.rows,
        totalItems,
        totalPrice
      })
    } else {
      // Return empty cart
      res.json({
        cartId: null,
        sessionId,
        items: [],
        totalItems: 0,
        totalPrice: 0
      })
    }
  } catch (error) {
    console.error('Error fetching cart:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Add item to cart
app.post('/api/cart/items', async (req, res) => {
  try {
    const {
      product_id,
      quantity = 1,
      base_price,
      total_price,
      special_instructions,
      customizations = [],
      session_id
    } = req.body

    // Validation
    if (!product_id || !base_price || !total_price) {
      return res.status(400).json({ error: 'Datos del producto requeridos' })
    }

    if (quantity < 1) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' })
    }

    // Get or create cart
    let cartId
    if (req.user) {
      // User cart
      let cart = await pool.query(
        'SELECT id FROM shopping_carts WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
        [req.user.userId]
      )

      if (cart.rows.length === 0) {
        // Create new cart for user
        const newCart = await pool.query(
          'INSERT INTO shopping_carts (user_id, session_id) VALUES ($1, $2) RETURNING id',
          [req.user.userId, session_id]
        )
        cartId = newCart.rows[0].id
      } else {
        cartId = cart.rows[0].id
      }
    } else {
      // Guest cart
      if (!session_id) {
        return res.status(400).json({ error: 'Session ID requerido para invitados' })
      }

      let cart = await pool.query(
        'SELECT id FROM shopping_carts WHERE session_id = $1 AND expires_at > CURRENT_TIMESTAMP ORDER BY updated_at DESC LIMIT 1',
        [session_id]
      )

      if (cart.rows.length === 0) {
        // Create new guest cart
        const newCart = await pool.query(
          'INSERT INTO shopping_carts (session_id) VALUES ($1) RETURNING id',
          [session_id]
        )
        cartId = newCart.rows[0].id
      } else {
        cartId = cart.rows[0].id
      }
    }

    // Add item to cart
    const cartItem = await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, base_price, total_price, special_instructions)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [cartId, product_id, quantity, base_price, total_price, special_instructions]
    )

    const itemId = cartItem.rows[0].id

    // Add customizations if any
    if (customizations && customizations.length > 0) {
      for (const custom of customizations) {
        await pool.query(
          'INSERT INTO cart_item_customizations (cart_item_id, topping_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [itemId, custom.topping_id, custom.quantity || 1, custom.price]
        )
      }
    }

    console.log(`✅ Item added to cart: Product ${product_id}, Quantity ${quantity}`)

    res.status(201).json({
      message: 'Producto agregado al carrito',
      item: cartItem.rows[0]
    })

  } catch (error) {
    console.error('Error adding item to cart:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Update cart item quantity
app.put('/api/cart/items/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { quantity } = req.body

    if (quantity < 1) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' })
    }

    // Update item
    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [quantity, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado en el carrito' })
    }

    res.json({
      message: 'Cantidad actualizada',
      item: result.rows[0]
    })

  } catch (error) {
    console.error('Error updating cart item:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Remove item from cart
app.delete('/api/cart/items/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Delete customizations first
    await pool.query('DELETE FROM cart_item_customizations WHERE cart_item_id = $1', [id])

    // Delete cart item
    const result = await pool.query('DELETE FROM cart_items WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado en el carrito' })
    }

    res.json({ message: 'Producto eliminado del carrito' })

  } catch (error) {
    console.error('Error removing cart item:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Clear entire cart
app.delete('/api/cart', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id']
    let cartId

    if (req.user) {
      // Get user's cart
      const cart = await pool.query(
        'SELECT id FROM shopping_carts WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
        [req.user.userId]
      )
      if (cart.rows.length > 0) {
        cartId = cart.rows[0].id
      }
    } else if (sessionId) {
      // Get guest cart
      const cart = await pool.query(
        'SELECT id FROM shopping_carts WHERE session_id = $1 AND expires_at > CURRENT_TIMESTAMP ORDER BY updated_at DESC LIMIT 1',
        [sessionId]
      )
      if (cart.rows.length > 0) {
        cartId = cart.rows[0].id
      }
    }

    if (cartId) {
      // Delete all cart item customizations
      await pool.query(`
        DELETE FROM cart_item_customizations 
        WHERE cart_item_id IN (SELECT id FROM cart_items WHERE cart_id = $1)
      `, [cartId])

      // Delete all cart items
      await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId])

      // Delete cart
      await pool.query('DELETE FROM shopping_carts WHERE id = $1', [cartId])
    }

    res.json({ message: 'Carrito limpiado' })

  } catch (error) {
    console.error('Error clearing cart:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on http://localhost:${port}`);
  console.log(`📊 Database host: ${process.env.DB_HOST || 'db'}`);
  console.log(`🔐 Authentication endpoints available`);
  console.log(`🍽️ Reservations system enabled`);
});

// =============================================
// ORDER ENDPOINTS
// =============================================

// Create new order
app.post('/api/orders', async (req, res) => {
  const {
    userId,
    guestEmail,
    customerName,
    customerPhone,
    customerEmail,
    deliveryType,
    deliveryAddress,
    paymentMethod,
    specialInstructions,
    items // Array of cart items with customizations
  } = req.body

  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Calculate totals
    let totalAmount = 0
    const deliveryFee = deliveryType === 'delivery' ? 2.50 : 0

    // Validate and calculate item prices
    for (const item of items) {
      const productResult = await client.query(
        'SELECT base_price FROM products WHERE id = $1',
        [item.productId]
      )
      
      if (productResult.rows.length === 0) {
        throw new Error(`Product with ID ${item.productId} not found`)
      }

      let itemPrice = parseFloat(productResult.rows[0].base_price)
      
      // Add customization prices
      if (item.customizations && item.customizations.length > 0) {
        for (const custom of item.customizations) {
          const toppingResult = await client.query(
            'SELECT price FROM pizza_toppings WHERE id = $1',
            [custom.toppingId]
          )
          if (toppingResult.rows.length > 0) {
            itemPrice += parseFloat(toppingResult.rows[0].price) * custom.quantity
          }
        }
      }

      totalAmount += itemPrice * item.quantity
    }

    totalAmount += deliveryFee

    // Generate order number
    const orderNumberResult = await client.query('SELECT generate_order_number() as order_number')
    const orderNumber = orderNumberResult.rows[0].order_number

    // Calculate estimated delivery time (30-45 minutes from now)
    const estimatedDelivery = new Date()
    estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + (deliveryType === 'delivery' ? 45 : 30))

    // Create order - using actual database schema
    const orderResult = await client.query(
      `INSERT INTO orders (
        user_id, order_number, status, order_type, customer_name, customer_phone, 
        customer_email, delivery_address_text, delivery_instructions, 
        subtotal, delivery_fee, total_amount, estimated_delivery_time, special_instructions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, order_number`,
      [
        userId || null, orderNumber, 'pending', deliveryType, customerName, customerPhone,
        customerEmail, deliveryAddress, null, // delivery_instructions
        totalAmount - deliveryFee, deliveryFee, totalAmount, estimatedDelivery, specialInstructions
      ]
    )

    const orderId = orderResult.rows[0].id

    // Create order items
    for (const item of items) {
      const productResult = await client.query(
        'SELECT name, base_price FROM products WHERE id = $1',
        [item.productId]
      )

      if (productResult.rows.length === 0) continue

      const product = productResult.rows[0]
      let unitPrice = parseFloat(product.base_price)

      // Calculate unit price with customizations
      if (item.customizations && item.customizations.length > 0) {
        for (const custom of item.customizations) {
          const toppingResult = await client.query(
            'SELECT price FROM pizza_toppings WHERE id = $1',
            [custom.toppingId]
          )
          if (toppingResult.rows.length > 0) {
            unitPrice += parseFloat(toppingResult.rows[0].price) * custom.quantity
          }
        }
      }

      const totalPrice = unitPrice * item.quantity

      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, quantity, unit_price, 
          total_price, special_instructions
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          orderId, item.productId, item.quantity,
          unitPrice, totalPrice, item.specialInstructions || ''
        ]
      )
    }

    // Clear user's cart if authenticated
    if (userId) {
      await client.query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM shopping_carts WHERE user_id = $1)', [userId])
      await client.query('DELETE FROM shopping_carts WHERE user_id = $1', [userId])
    }

    await client.query('COMMIT')

    res.status(201).json({
      success: true,
      order: {
        id: orderId,
        orderNumber: orderNumber,
        totalAmount,
        estimatedDelivery
      }
    })

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error creating order:', error)
    res.status(500).json({ error: 'Error al crear el pedido' })
  } finally {
    client.release()
  }
})

// Get order by number
app.get('/api/orders/:orderNumber', async (req, res) => {
  const { orderNumber } = req.params

  try {
    // Get order details
    const orderResult = await pool.query(
      `SELECT o.*, 
        CASE 
          WHEN o.estimated_delivery_time > NOW() THEN EXTRACT(EPOCH FROM (o.estimated_delivery_time - NOW()))/60 
          ELSE 0 
        END as minutes_remaining
      FROM orders o 
      WHERE o.order_number = $1`,
      [orderNumber]
    )

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' })
    }

    const order = orderResult.rows[0]

    // Get order items
    const itemsResult = await pool.query(
      `SELECT oi.*, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      ORDER BY oi.id`,
      [order.id]
    )

    // Get status history
    const historyResult = await pool.query(
      `SELECT status, notes, created_at
      FROM order_status_history
      WHERE order_id = $1
      ORDER BY created_at ASC`,
      [order.id]
    )

    res.json({
      ...order,
      items: itemsResult.rows,
      statusHistory: historyResult.rows
    })

  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Get user orders
app.get('/api/orders', async (req, res) => {
  const userId = req.query.userId
  const email = req.query.email

  if (!userId && !email) {
    return res.status(400).json({ error: 'Se requiere userId o email' })
  }

  try {
    let query = `
      SELECT o.*, 
        COUNT(oi.id) as total_items,
        CASE 
          WHEN o.estimated_delivery_time > NOW() THEN EXTRACT(EPOCH FROM (o.estimated_delivery_time - NOW()))/60 
          ELSE 0 
        END as minutes_remaining
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `
    let params = []

    if (userId) {
      query += ' WHERE o.user_id = $1'
      params = [userId]
    } else {
      query += ' WHERE o.customer_email = $1'
      params = [email]
    }

    query += ' GROUP BY o.id ORDER BY o.created_at DESC'

    const result = await pool.query(query, params)
    res.json(result.rows)

  } catch (error) {
    console.error('Error fetching user orders:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Update order status (for admin)
app.put('/api/orders/:orderNumber/status', async (req, res) => {
  const { orderNumber } = req.params
  const { status, notes } = req.body

  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado de pedido inválido' })
  }

  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE order_number = $2 RETURNING id, status',
      [status, orderNumber]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' })
    }

    // Add notes if provided
    if (notes) {
      await pool.query(
        'INSERT INTO order_status_history (order_id, status, notes) VALUES ($1, $2, $3)',
        [result.rows[0].id, status, notes]
      )
    }

    res.json({ success: true, status: result.rows[0].status })

  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Cancel order
app.put('/api/orders/:orderNumber/cancel', async (req, res) => {
  const { orderNumber } = req.params
  const { reason } = req.body

  try {
    // Only allow cancellation if order is pending or confirmed
    const result = await pool.query(
      `UPDATE orders 
       SET status = 'cancelled' 
       WHERE order_number = $1 
       AND status IN ('pending', 'confirmed')
       RETURNING id, status`,
      [orderNumber]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No se puede cancelar este pedido' })
    }

    // Log cancellation reason
    await pool.query(
      'INSERT INTO order_status_history (order_id, status, notes) VALUES ($1, $2, $3)',
      [result.rows[0].id, 'cancelled', reason || 'Cancelado por el cliente']
    )

    res.json({ success: true, status: 'cancelled' })

  } catch (error) {
    console.error('Error cancelling order:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  pool.end(() => {
    process.exit(0);
  });
}); 