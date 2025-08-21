const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: 'db',
  port: 5432,
  database: 'pizza_db',
  user: 'pizza_user',
  password: 'pizza_pass'
});

// GET /api/admin/reservations - Get all reservations with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      date, 
      status, 
      table_id, 
      customer_name, 
      page = 1, 
      limit = 50 
    } = req.query;
    
    const client = await pool.connect();
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    // Add filters
    if (date) {
      paramCount++;
      whereClause += ` AND tr.reservation_date = $${paramCount}`;
      params.push(date);
    }
    
    if (status) {
      paramCount++;
      whereClause += ` AND tr.status = $${paramCount}`;
      params.push(status);
    }
    
    if (table_id) {
      paramCount++;
      whereClause += ` AND tr.table_id = $${paramCount}`;
      params.push(table_id);
    }
    
    if (customer_name) {
      paramCount++;
      whereClause += ` AND (tr.customer_name ILIKE $${paramCount} OR tr.customer_email ILIKE $${paramCount})`;
      params.push(`%${customer_name}%`);
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);
    
    const query = `
      SELECT 
        tr.id,
        tr.customer_name,
        tr.customer_email,
        tr.customer_phone,
        tr.reservation_date,
        tr.reservation_time,
        tr.number_of_guests,
        tr.special_requests,
        tr.status,
        tr.created_at,
        tr.updated_at,
        rt.table_number,
        rt.name as table_name,
        rt.capacity as table_capacity,
        rt.table_type,
        rt.location_description,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email
      FROM table_reservations tr
      LEFT JOIN restaurant_tables rt ON tr.table_id = rt.id
      LEFT JOIN users u ON tr.user_id = u.id
      ${whereClause}
      ORDER BY tr.reservation_date DESC, tr.reservation_time ASC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM table_reservations tr
      LEFT JOIN restaurant_tables rt ON tr.table_id = rt.id
      ${whereClause}
    `;
    
    const [result, countResult] = await Promise.all([
      client.query(query, params),
      client.query(countQuery, params.slice(0, -2)) // Remove limit and offset
    ]);
    
    client.release();
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      message: `Retrieved ${result.rows.length} reservations`
    });
    
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reservations',
      details: error.message
    });
  }
});

// GET /api/admin/reservations/calendar - Get calendar view data
router.get('/calendar', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Default to current month if no dates provided
    const start = start_date || new Date().toISOString().split('T')[0].substring(0, 7) + '-01';
    const end = end_date || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
    
    const client = await pool.connect();
    
    const query = `
      SELECT 
        tr.id,
        tr.customer_name,
        tr.customer_email,
        tr.customer_phone,
        tr.reservation_date,
        tr.reservation_time,
        tr.number_of_guests,
        tr.special_requests,
        tr.status,
        rt.table_number,
        rt.name as table_name,
        rt.capacity as table_capacity,
        rt.table_type,
        rt.location_description
      FROM table_reservations tr
      LEFT JOIN restaurant_tables rt ON tr.table_id = rt.id
      WHERE tr.reservation_date BETWEEN $1 AND $2
      AND tr.status IN ('confirmed', 'seated')
      ORDER BY tr.reservation_date, tr.reservation_time
    `;
    
    const result = await client.query(query, [start, end]);
    client.release();
    
    // Group by date for calendar view
    const calendarData = {};
    result.rows.forEach(reservation => {
      const date = reservation.reservation_date;
      if (!calendarData[date]) {
        calendarData[date] = [];
      }
      calendarData[date].push(reservation);
    });
    
    res.json({
      success: true,
      data: calendarData,
      dateRange: { start, end },
      message: `Calendar data retrieved for ${Object.keys(calendarData).length} days`
    });
    
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar data',
      details: error.message
    });
  }
});

// GET /api/admin/reservations/today - Get today's reservations
router.get('/today', async (req, res) => {
  try {
    const client = await pool.connect();
    
    const query = `
      SELECT 
        tr.id,
        tr.customer_name,
        tr.customer_email,
        tr.customer_phone,
        tr.reservation_date,
        tr.reservation_time,
        tr.number_of_guests,
        tr.special_requests,
        tr.status,
        rt.table_number,
        rt.name as table_name,
        rt.capacity as table_capacity,
        rt.table_type,
        rt.location_description
      FROM table_reservations tr
      LEFT JOIN restaurant_tables rt ON tr.table_id = rt.id
      WHERE tr.reservation_date = CURRENT_DATE
      ORDER BY tr.reservation_time ASC
    `;
    
    const result = await client.query(query);
    client.release();
    
    res.json({
      success: true,
      data: result.rows,
      message: `Retrieved ${result.rows.length} reservations for today`
    });
    
  } catch (error) {
    console.error('Error fetching today\'s reservations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch today\'s reservations',
      details: error.message
    });
  }
});

// PUT /api/admin/reservations/:id - Update reservation status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, special_requests } = req.body;
    
    const client = await pool.connect();
    
    const query = `
      UPDATE table_reservations 
      SET 
        status = COALESCE($1, status),
        special_requests = COALESCE($2, special_requests),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await client.query(query, [status, special_requests, id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Reservation updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update reservation',
      details: error.message
    });
  }
});

// DELETE /api/admin/reservations/:id - Delete reservation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    const query = 'DELETE FROM table_reservations WHERE id = $1 RETURNING *';
    const result = await client.query(query, [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Reservation deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete reservation',
      details: error.message
    });
  }
});

// GET /api/admin/reservations/:id - Get specific reservation details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    const query = `
      SELECT 
        tr.*,
        rt.table_number,
        rt.name as table_name,
        rt.capacity as table_capacity,
        rt.table_type,
        rt.location_description,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email
      FROM table_reservations tr
      LEFT JOIN restaurant_tables rt ON tr.table_id = rt.id
      LEFT JOIN users u ON tr.user_id = u.id
      WHERE tr.id = $1
    `;
    
    const result = await client.query(query, [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Reservation details retrieved'
    });
    
  } catch (error) {
    console.error('Error fetching reservation details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reservation details',
      details: error.message
    });
  }
});

module.exports = router;
