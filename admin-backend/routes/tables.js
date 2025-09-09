const express = require('express');
const router = express.Router();
const { pool } = require('../db');

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

// PUT /api/admin/tables/:id/deactivate - Deactivate table (soft delete)
router.put('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    // Soft delete by setting is_active to false
    const query = `
      UPDATE restaurant_tables 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
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
      message: 'Table deactivated (soft delete)'
    });
    
  } catch (error) {
    console.error('Error deactivating table:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate table',
      details: error.message
    });
  }
});

// PUT /api/admin/tables/:id - Update table
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { table_name, table_number, capacity, table_type, location, is_active } = req.body;
    
    const client = await pool.connect();
    
    // Check if table number already exists (if changing table number)
    if (table_number) {
      const existingTable = await client.query(
        'SELECT id FROM restaurant_tables WHERE table_number = $1 AND id != $2',
        [table_number, id]
      );
      
      if (existingTable.rows.length > 0) {
        client.release();
        return res.status(400).json({
          success: false,
          error: 'Table number already exists'
        });
      }
    }
    
    const query = `
      UPDATE restaurant_tables 
      SET 
        name = COALESCE($1, name),
        table_number = COALESCE($2, table_number),
        capacity = COALESCE($3, capacity),
        table_type = COALESCE($4, table_type),
        location_description = COALESCE($5, location_description),
        is_active = COALESCE($6, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    
    const result = await client.query(query, [
      table_name, // Frontend sends table_name, map to name
      table_number, 
      capacity, 
      table_type, 
      location, // Frontend sends location, map to location_description
      is_active, 
      id
    ]);
    
    client.release();
    
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

// DELETE /api/admin/tables/:id - Delete table
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    // Check if table has any active reservations (only confirmed or seated reservations should prevent deletion)
    const reservationsCheck = await client.query(
      'SELECT COUNT(*) FROM table_reservations WHERE table_id = $1 AND status IN (\'confirmed\', \'seated\')',
      [id]
    );
    
    if (parseInt(reservationsCheck.rows[0].count) > 0) {
      client.release();
      return res.status(400).json({
        success: false,
        error: 'Cannot delete table with existing reservations. Please cancel or complete all reservations first.'
      });
    }
    
    // Actually DELETE the table (not soft delete)
    const query = `
      DELETE FROM restaurant_tables 
      WHERE id = $1
      RETURNING *
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
      message: 'Table permanently deleted'
    });
    
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete table',
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

// POST /api/admin/tables - Create new table
router.post('/', async (req, res) => {
  try {
    const { table_name, table_number, capacity, location, is_active } = req.body;
    
    // Validate required fields
    if (!table_name || !table_number || !capacity) {
      return res.status(400).json({
        success: false,
        error: 'Table name, table number, and capacity are required'
      });
    }

    const client = await pool.connect();
    
    // Check if table number already exists
    const existingTable = await client.query(
      'SELECT id FROM restaurant_tables WHERE table_number = $1',
      [table_number]
    );
    
    if (existingTable.rows.length > 0) {
      client.release();
      return res.status(400).json({
        success: false,
        error: 'Table number already exists'
      });
    }

    // Insert new table
    const query = `
      INSERT INTO restaurant_tables (
        name, 
        table_number, 
        capacity, 
        min_party_size,
        table_type,
        location_description,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const result = await client.query(query, [
      table_name, // Frontend sends table_name, map to name
      table_number, 
      capacity, 
      Math.ceil(capacity / 2), // min_party_size as half of capacity
      'standard', // Default table type
      location || 'Main Area', // Frontend sends location, map to location_description
      is_active !== false // default to true
    ]);
    
    client.release();
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Table created successfully'
    });
    
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create table',
      details: error.message
    });
  }
});

module.exports = router;
