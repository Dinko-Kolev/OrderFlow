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

// GET /api/admin/tables - Get all tables with current status
router.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get all tables with their current availability status
    const query = `
      SELECT 
        rt.id,
        rt.table_number,
        rt.name,
        rt.capacity,
        rt.min_party_size,
        rt.is_active,
        rt.table_type,
        rt.location_description,
        rt.created_at,
        rt.updated_at,
        -- Get current date for availability check
        CURRENT_DATE as current_date,
        -- Check if table has any reservations today
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM table_reservations tr 
            WHERE tr.table_id = rt.id 
            AND tr.reservation_date = CURRENT_DATE 
            AND tr.status IN ('confirmed', 'seated')
          ) THEN 'reserved'
          ELSE 'available'
        END as current_status,
        -- Get today's reservation info if any
        (
          SELECT json_build_object(
            'id', tr.id,
            'customer_name', tr.customer_name,
            'reservation_time', tr.reservation_time,
            'number_of_guests', tr.number_of_guests,
            'status', tr.status
          )
          FROM table_reservations tr 
          WHERE tr.table_id = rt.id 
          AND tr.reservation_date = CURRENT_DATE 
          AND tr.status IN ('confirmed', 'seated')
          LIMIT 1
        ) as today_reservation
      FROM restaurant_tables rt
      WHERE rt.is_active = true
      ORDER BY rt.table_number
    `;
    
    const result = await client.query(query);
    client.release();
    
    res.json({
      success: true,
      data: result.rows,
      message: `Retrieved ${result.rows.length} tables`
    });
    
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tables',
      details: error.message
    });
  }
});

// GET /api/admin/tables/status - Get current table status overview
router.get('/status', async (req, res) => {
  try {
    const client = await pool.connect();
    
    const query = `
      SELECT 
        COUNT(*) as total_tables,
        COUNT(CASE WHEN rt.is_active = true THEN 1 END) as active_tables,
        COUNT(CASE WHEN rt.is_active = false THEN 1 END) as inactive_tables,
        COUNT(CASE WHEN EXISTS (
          SELECT 1 FROM table_reservations tr 
          WHERE tr.table_id = rt.id 
          AND tr.reservation_date = CURRENT_DATE 
          AND tr.status IN ('confirmed', 'seated')
        ) THEN 1 END) as reserved_tables,
        COUNT(CASE WHEN NOT EXISTS (
          SELECT 1 FROM table_reservations tr 
          WHERE tr.table_id = rt.id 
          AND tr.reservation_date = CURRENT_DATE 
          AND tr.status IN ('confirmed', 'seated')
        ) AND rt.is_active = true THEN 1 END) as available_tables
      FROM restaurant_tables rt
    `;
    
    const result = await client.query(query);
    client.release();
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Table status overview retrieved'
    });
    
  } catch (error) {
    console.error('Error fetching table status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch table status',
      details: error.message
    });
  }
});

// PUT /api/admin/tables/:id - Update table (activate/deactivate)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, table_type, location_description } = req.body;
    
    const client = await pool.connect();
    
    const query = `
      UPDATE restaurant_tables 
      SET 
        is_active = COALESCE($1, is_active),
        table_type = COALESCE($2, table_type),
        location_description = COALESCE($3, location_description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await client.query(query, [is_active, table_type, location_description, id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Table not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Table updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update table',
      details: error.message
    });
  }
});

// GET /api/admin/tables/:id - Get specific table details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    const query = `
      SELECT 
        rt.*,
        -- Get current reservation if any
        (
          SELECT json_build_object(
            'id', tr.id,
            'customer_name', tr.customer_name,
            'customer_email', tr.customer_email,
            'customer_phone', tr.customer_phone,
            'reservation_date', tr.reservation_date,
            'reservation_time', tr.reservation_time,
            'number_of_guests', tr.number_of_guests,
            'special_requests', tr.special_requests,
            'status', tr.status
          )
          FROM table_reservations tr 
          WHERE tr.table_id = rt.id 
          AND tr.reservation_date = CURRENT_DATE 
          AND tr.status IN ('confirmed', 'seated')
          LIMIT 1
        ) as current_reservation
      FROM restaurant_tables rt
      WHERE rt.id = $1
    `;
    
    const result = await client.query(query, [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Table not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Table details retrieved'
    });
    
  } catch (error) {
    console.error('Error fetching table details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch table details',
      details: error.message
    });
  }
});

module.exports = router;
