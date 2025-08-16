// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { errorHandler } = require('./utils/errors');
const { TableService } = require('./modules/TableService');
const { EmailService } = require('./modules/EmailService');

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

// Initialize services
const tableService = new TableService(pool);
const emailService = new EmailService();

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

    // Enhanced validation
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos' 
      });
    }

    // Enhanced name validation - prevent numbers and suspicious patterns
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    
    if (firstName.trim().length < 2 || firstName.trim().length > 50) {
      return res.status(400).json({ 
        error: 'El nombre debe tener entre 2 y 50 caracteres' 
      });
    }
    
    if (/\d/.test(firstName.trim())) {
      return res.status(400).json({ 
        error: 'El nombre no puede contener números' 
      });
    }
    
    if (!nameRegex.test(firstName.trim())) {
      return res.status(400).json({ 
        error: 'El nombre solo puede contener letras, espacios, guiones y apóstrofes' 
      });
    }
    
    if (lastName.trim().length < 2 || lastName.trim().length > 50) {
      return res.status(400).json({ 
        error: 'El apellido debe tener entre 2 y 50 caracteres' 
      });
    }
    
    if (/\d/.test(lastName.trim())) {
      return res.status(400).json({ 
        error: 'El apellido no puede contener números' 
      });
    }
    
    if (!nameRegex.test(lastName.trim())) {
      return res.status(400).json({ 
        error: 'El apellido solo puede contener letras, espacios, guiones y apóstrofes' 
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

// Update profile endpoint
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    console.log('PUT /api/auth/profile headers:', req.headers)
    console.log('PUT /api/auth/profile body:', req.body)
    const { firstName, lastName, phone } = req.body
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Nombre y apellido son requeridos' })
    }

    // Enhanced name validation - prevent numbers and suspicious patterns
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    
    if (firstName.trim().length < 2 || firstName.trim().length > 50) {
      return res.status(400).json({ 
        error: 'El nombre debe tener entre 2 y 50 caracteres' 
      });
    }
    
    if (/\d/.test(firstName.trim())) {
      return res.status(400).json({ 
        error: 'El nombre no puede contener números' 
      });
    }
    
    if (!nameRegex.test(firstName.trim())) {
      return res.status(400).json({ 
        error: 'El nombre solo puede contener letras, espacios, guiones y apóstrofes' 
      });
    }
    
    if (lastName.trim().length < 2 || lastName.trim().length > 50) {
      return res.status(400).json({ 
        error: 'El apellido debe tener entre 2 y 50 caracteres' 
      });
    }
    
    if (/\d/.test(lastName.trim())) {
      return res.status(400).json({ 
        error: 'El apellido no puede contener números' 
      });
    }
    
    if (!nameRegex.test(lastName.trim())) {
      return res.status(400).json({ 
        error: 'El apellido solo puede contener letras, espacios, guiones y apóstrofes' 
      });
    }

    const client = await pool.connect()
    try {
      const result = await client.query(
        'UPDATE users SET first_name = $1, last_name = $2, phone = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, first_name, last_name, email, phone',
        [firstName, lastName, phone || null, req.user.userId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
      }

      const u = result.rows[0]
      res.json({
        success: true,
        data: {
          user: {
            id: u.id,
            firstName: u.first_name,
            lastName: u.last_name,
            email: u.email,
            phone: u.phone
          }
        }
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Delete account endpoint
app.delete('/api/auth/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('DELETE /api/auth/account - User ID:', userId);

    const client = await pool.connect();
    try {
      // Start transaction
      await client.query('BEGIN');

      // Delete user's addresses
      await client.query('DELETE FROM addresses WHERE user_id = $1', [userId]);
      console.log('Deleted addresses for user:', userId);

      // Delete user's table reservations
      await client.query('DELETE FROM table_reservations WHERE user_id = $1', [userId]);
      console.log('Deleted table reservations for user:', userId);

      // Delete user's cart items and cart
      await client.query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM shopping_carts WHERE user_id = $1)', [userId]);
      await client.query('DELETE FROM shopping_carts WHERE user_id = $1', [userId]);
      console.log('Deleted shopping cart for user:', userId);

      // Delete user's orders (keep order history but remove user association)
      await client.query('UPDATE orders SET user_id = NULL WHERE user_id = $1', [userId]);
      console.log('Removed user association from orders for user:', userId);

      // Finally, delete the user
      const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id, email', [userId]);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Commit transaction
      await client.query('COMMIT');
      
      console.log('Account deleted successfully for user:', userId);
      
      res.json({
        success: true,
        message: 'Cuenta eliminada exitosamente',
        deletedUser: {
          id: result.rows[0].id,
          email: result.rows[0].email
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al eliminar la cuenta' 
    });
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

    // Find best available table for the party
    const bestTable = await tableService.findBestAvailableTable(
      numberOfGuests, 
      reservationDate, 
      reservationTime
    )

    if (!bestTable) {
      return res.status(400).json({ 
        error: 'No hay mesas disponibles para esa fecha, hora y número de comensales' 
      })
    }

    // Insert reservation with table assignment
    const result = await pool.query(
      `INSERT INTO table_reservations 
       (user_id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, number_of_guests, special_requests, table_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [userId, customerName, customerEmail, customerPhone, reservationDate, reservationTime, numberOfGuests, specialRequests || null, bestTable.id]
    )

    const reservation = result.rows[0]

    // Reserve the table for this time slot
    await tableService.reserveTable(bestTable.id, reservationDate, reservationTime, reservation.id)

    // Send confirmation email
    const emailData = {
      customerName,
      customerEmail,
      customerPhone,
      reservationDate,
      reservationTime: reservationTime.substring(0, 5), // Convert HH:MM:SS to HH:MM
      numberOfGuests,
      tableName: bestTable.name,
      tableNumber: bestTable.table_number,
      tableCapacity: bestTable.capacity,
      specialRequests
    }
    
    const emailResult = await emailService.sendReservationConfirmation(emailData)
    
    if (emailResult.success) {
      console.log(`✅ Confirmation email sent to ${customerEmail}`)
    } else {
      console.log(`⚠️  Email service error: ${emailResult.error}`)
    }

    console.log(`✅ New reservation created: ${customerName} for ${reservationDate} at ${reservationTime} at table ${bestTable.name} (${bestTable.capacity} seats)`)

    res.status(201).json({
      message: 'Reserva confirmada exitosamente',
      reservation: {
        id: reservation.id,
        customerName: reservation.customer_name,
        customerEmail: reservation.customer_email,
        reservationDate: reservation.reservation_date,
        reservationTime: reservation.reservation_time,
        numberOfGuests: reservation.number_of_guests,
        tableId: bestTable.id,
        tableName: bestTable.name,
        tableNumber: bestTable.table_number,
        tableCapacity: bestTable.capacity,
        status: reservation.status,
        createdAt: reservation.created_at
      }
    })

  } catch (error) {
    console.error('Error creating reservation:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// =============================================
// ADDRESSES ENDPOINTS (protected)
// =============================================

// Get addresses for user
app.get('/api/users/:userId/addresses', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/users/:userId/addresses', { params: req.params, authUserId: req.user?.userId })
    const { userId } = req.params
    if (parseInt(userId) !== req.user.userId) {
      return res.status(403).json({ error: 'Acceso denegado' })
    }
    const result = await pool.query('SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, id DESC', [userId])
    res.json({ success: true, addresses: result.rows })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Create address
app.post('/api/users/:userId/addresses', authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/users/:userId/addresses', { params: req.params, body: req.body, authUserId: req.user?.userId })
    const { userId } = req.params
    const { street, city, state, zip_code, is_default } = req.body
    if (parseInt(userId) !== req.user.userId) {
      return res.status(403).json({ error: 'Acceso denegado' })
    }
    if (!street || !city || !state || !zip_code) {
      return res.status(400).json({ error: 'Todos los campos de dirección son requeridos' })
    }
    const client = await pool.connect()
    try {
      if (is_default) {
        await client.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId])
      }
      const result = await client.query(
        'INSERT INTO addresses (user_id, street, city, state, zip_code, is_default) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [userId, street, city, state, zip_code, !!is_default]
      )
      res.status(201).json({ success: true, address: result.rows[0] })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error creating address:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Update address
app.put('/api/users/:userId/addresses/:addressId', authenticateToken, async (req, res) => {
  try {
    console.log('PUT /api/users/:userId/addresses/:addressId', { params: req.params, body: req.body, authUserId: req.user?.userId })
    const { userId, addressId } = req.params
    const { street, city, state, zip_code, is_default } = req.body
    if (parseInt(userId) !== req.user.userId) {
      return res.status(403).json({ error: 'Acceso denegado' })
    }
    const client = await pool.connect()
    try {
      // Ensure address belongs to user
      const owns = await client.query('SELECT id FROM addresses WHERE id = $1 AND user_id = $2', [addressId, userId])
      if (owns.rows.length === 0) {
        return res.status(404).json({ error: 'Dirección no encontrada' })
      }
      if (is_default) {
        await client.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId])
      }
      const result = await client.query(
        'UPDATE addresses SET street = $1, city = $2, state = $3, zip_code = $4, is_default = $5 WHERE id = $6 RETURNING *',
        [street, city, state, zip_code, !!is_default, addressId]
      )
      res.json({ success: true, address: result.rows[0] })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error updating address:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Delete address
app.delete('/api/users/:userId/addresses/:addressId', authenticateToken, async (req, res) => {
  try {
    console.log('DELETE /api/users/:userId/addresses/:addressId', { params: req.params, authUserId: req.user?.userId })
    const { userId, addressId } = req.params
    if (parseInt(userId) !== req.user.userId) {
      return res.status(403).json({ error: 'Acceso denegado' })
    }
    const result = await pool.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id', [addressId, userId])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dirección no encontrada' })
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting address:', error)
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

    // Use the new table service to get real availability
    const availability = await tableService.getTimeSlotAvailability(date)
    
    res.json(availability)

  } catch (error) {
    console.error('Error checking availability:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Get table availability overview for a specific date
app.get('/api/reservations/tables/:date', async (req, res) => {
  try {
    const { date } = req.params
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' })
    }

    // Use the table service to get detailed table availability
    const tableOverview = await tableService.getAvailabilityOverview(date)
    
    res.json(tableOverview)

  } catch (error) {
    console.error('Error getting table availability overview:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Test email service endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    const testData = {
      customerName: 'Usuario de Prueba',
      customerEmail: 'test@example.com',
      customerPhone: '+34 600 000 000',
      reservationDate: '2024-12-25',
      reservationTime: '19:00',
      numberOfGuests: 4,
      tableName: 'Mesa 6',
      tableNumber: 6,
      tableCapacity: 6,
      specialRequests: 'Mesa cerca de la ventana, por favor'
    }
    
    const result = await emailService.sendReservationConfirmation(testData)
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully',
        emailResult: result
      })
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send test email',
        details: result
      })
    }
  } catch (error) {
    console.error('Error testing email service:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Get reservations for a specific user (protected route)
app.get('/api/reservations/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId

    const reservations = await pool.query(
      `SELECT r.*, rt.table_number, rt.name as table_name, rt.capacity as table_capacity
       FROM table_reservations r
       LEFT JOIN restaurant_tables rt ON r.table_id = rt.id
       WHERE r.user_id = $1 
       ORDER BY r.reservation_date DESC, r.reservation_time DESC`,
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
      tableId: r.table_id,
      tableNumber: r.table_number,
      tableName: r.table_name,
      tableCapacity: r.table_capacity,
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

// Add error handling middleware
app.use(errorHandler)

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 OrderFlow Backend Server running on http://localhost:${port}`);
  console.log(`📊 Database host: ${process.env.DB_HOST || 'db'}`);
  console.log(`🔐 Authentication endpoints available`);
  console.log(`🍽️ Reservations system enabled`);
  console.log(`🍕 Orders API: http://localhost:${port}/api/orders`);
  console.log(`🛍️ Products API: http://localhost:${port}/api/products`);
  console.log(`💚 Health check: http://localhost:${port}/api/health`);
});

// =============================================
// ORDER ENDPOINTS
// =============================================

// Import the new architecture
const AppModule = require('./app.module')

// Initialize application module
const appModule = new AppModule(pool)

// Order routes using the new controller
app.post('/api/orders', appModule.getController('orderController').createOrder)
app.get('/api/orders/:orderNumber', appModule.getController('orderController').getOrderByNumber)
app.put('/api/orders/:orderId/status', appModule.getController('orderController').updateOrderStatus)
app.get('/api/users/:userId/orders', appModule.getController('orderController').getUserOrders)

// Product routes using the new controller
app.get('/api/products', appModule.getController('productController').getProducts)
app.get('/api/products/:productId', appModule.getController('productController').getProductById)
app.get('/api/categories/:categoryId/products', appModule.getController('productController').getProductsByCategory)
app.get('/api/products/featured', appModule.getController('productController').getFeaturedProducts)
app.get('/api/products/search', appModule.getController('productController').searchProducts)
app.get('/api/categories', appModule.getController('productController').getCategories)
app.get('/api/products/:productId/image', appModule.getController('productController').getProductImage)

// Health check endpoints
app.get('/api/health', async (req, res) => {
  const health = await appModule.healthCheck()
  res.json(health)
})

app.get('/api/orders/health', appModule.getController('orderController').healthCheck)
app.get('/api/products/health', appModule.getController('productController').healthCheck)

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  pool.end(() => {
    process.exit(0);
  });
}); 