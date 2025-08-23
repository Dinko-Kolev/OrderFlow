const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Error handling middleware for malformed JSON
router.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      details: 'The request body contains invalid JSON'
    });
  }
  next();
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
        tr.duration_minutes,
        tr.grace_period_minutes,
        tr.max_sitting_minutes,
        tr.reservation_end_time,
        tr.actual_arrival_time,
        tr.actual_departure_time,
        tr.is_late_arrival,
        tr.arrival_notes,
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
        offset,
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

// POST /api/admin/reservations - Create new reservation
router.post('/', async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      reservation_date,
      reservation_time,
      number_of_guests,
      table_id,
      special_requests
    } = req.body;

    // Validate required fields
    if (!customer_name || !customer_email || !customer_phone || !reservation_date || !reservation_time || !number_of_guests || !table_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'customer_name, customer_email, customer_phone, reservation_date, reservation_time, number_of_guests, and table_id are required'
      });
    }

    const client = await pool.connect();

    // Check if table exists and is available
    const tableCheck = await client.query(
      'SELECT id, name, capacity, is_active FROM restaurant_tables WHERE id = $1',
      [table_id]
    );

    if (tableCheck.rows.length === 0) {
      client.release();
      return res.status(400).json({
        success: false,
        error: 'Table not found'
      });
    }

    if (!tableCheck.rows[0].is_active) {
      client.release();
      return res.status(400).json({
        success: false,
        error: 'Table not available'
      });
    }

    // Check business hours (12:00-15:00 for lunch, 19:00-22:30 for dinner)
    const reservationTime = new Date(`2000-01-01T${reservation_time}`);
    const hour = reservationTime.getHours();
    const minute = reservationTime.getMinutes();
    const timeInMinutes = hour * 60 + minute;
    
    // Convert business hours to minutes for easier comparison
    const lunchStart = 12 * 60; // 12:00
    const lunchEnd = 15 * 60;   // 15:00
    const dinnerStart = 19 * 60; // 19:00
    const dinnerEnd = 22 * 60 + 30; // 22:30
    
    const isLunchTime = timeInMinutes >= lunchStart && timeInMinutes < lunchEnd;
    const isDinnerTime = timeInMinutes >= dinnerStart && timeInMinutes < dinnerEnd;
    
    if (!isLunchTime && !isDinnerTime) {
      client.release();
      return res.status(400).json({
        success: false,
        error: `Reservation time outside business hours. Lunch: 12:00-15:00, Dinner: 19:00-22:30. Requested time: ${reservation_time}`
      });
    }

    // Check advance booking limit (30 days)
    const reservationDate = new Date(reservation_date);
    const today = new Date();
    const daysDifference = Math.ceil((reservationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference > 30) {
      client.release();
      return res.status(400).json({
        success: false,
        error: 'Reservations cannot be made more than 30 days in advance'
      });
    }

    // Check if table is available at the requested time
    const availabilityCheck = await client.query(
      `SELECT id FROM table_reservations 
       WHERE table_id = $1 
       AND reservation_date = $2 
       AND status IN ('confirmed', 'seated')
       AND (
         (reservation_time <= $3 AND reservation_time + INTERVAL '105 minutes' > $3) OR
         ($3 <= reservation_time AND $3 + INTERVAL '105 minutes' > reservation_time)
       )`,
      [table_id, reservation_date, reservation_time]
    );

    if (availabilityCheck.rows.length > 0) {
      client.release();
      return res.status(400).json({
        success: false,
        error: 'Table not available'
      });
    }

    // Create the reservation with duration fields
    const insertQuery = `
      INSERT INTO table_reservations (
        customer_name, customer_email, customer_phone, 
        reservation_date, reservation_time, number_of_guests, 
        table_id, special_requests, status, 
        duration_minutes, grace_period_minutes, max_sitting_minutes,
        reservation_end_time, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed', 
                $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    // Calculate end time (reservation_time + 105 minutes)
    const reservationDateTime = new Date(`${reservation_date}T${reservation_time}`);
    const endDateTime = new Date(reservationDateTime.getTime() + 105 * 60 * 1000);
    const endTime = endDateTime.toTimeString().split(' ')[0];

    const result = await client.query(insertQuery, [
      customer_name,
      customer_email,
      customer_phone,
      reservation_date,
      reservation_time,
      number_of_guests,
      table_id,
      special_requests || '',
      105, // duration_minutes (90 min dining + 15 min buffer)
      15,  // grace_period_minutes
      120, // max_sitting_minutes
      endTime
    ]);

    client.release();

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Reservation created successfully'
    });

  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create reservation',
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
        tr.duration_minutes,
        tr.grace_period_minutes,
        tr.max_sitting_minutes,
        tr.reservation_end_time,
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
        tr.duration_minutes,
        tr.grace_period_minutes,
        tr.max_sitting_minutes,
        tr.reservation_end_time,
        rt.table_number,
        rt.name as table_name,
        rt.capacity as table_capacity,
        rt.table_type,
        rt.location_description
      FROM table_reservations tr
      LEFT JOIN restaurant_tables rt ON tr.table_id = rt.id
      WHERE tr.reservation_date = CURRENT_DATE
      ORDER BY tr.reservation_time
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

// PUT /api/admin/reservations/:id - Update reservation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      customer_name, 
      customer_email, 
      customer_phone, 
      reservation_date, 
      reservation_time, 
      number_of_guests, 
      table_id, 
      special_requests,
      status 
    } = req.body;
    
    const client = await pool.connect();
    
    // Check if reservation exists
    const existingReservation = await client.query(
      'SELECT * FROM table_reservations WHERE id = $1',
      [id]
    );
    
    if (existingReservation.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      });
    }
    
    // Validate required fields
    if (!customer_name || !customer_email || !customer_phone || !reservation_date || !reservation_time || !number_of_guests || !table_id) {
      client.release();
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'customer_name, customer_email, customer_phone, reservation_date, reservation_time, number_of_guests, and table_id are required'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email)) {
      client.release();
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }
    
    // Validate number of guests (max 20)
    if (number_of_guests < 1 || number_of_guests > 20) {
      client.release();
      return res.status(400).json({
        success: false,
        error: 'Invalid number of guests',
        details: 'Number of guests must be between 1 and 20'
      });
    }
    
    const query = `
      UPDATE table_reservations 
      SET 
        customer_name = $1,
        customer_email = $2,
        customer_phone = $3,
        reservation_date = $4,
        reservation_time = $5,
        number_of_guests = $6,
        table_id = $7,
        special_requests = COALESCE($8, special_requests),
        status = COALESCE($9, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;
    
    const result = await client.query(query, [
      customer_name,
      customer_email,
      customer_phone,
      reservation_date,
      reservation_time,
      number_of_guests,
      table_id,
      special_requests || '',
      status || 'confirmed',
      id
    ]);
    client.release();
    
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

// PUT /api/admin/reservations/:id/arrival - Mark customer arrival
router.put('/:id/arrival', async (req, res) => {
  try {
    const { id } = req.params;
    const { actual_arrival_time, arrival_notes } = req.body;
    
    const client = await pool.connect();
    
    // Check if reservation exists
    const existingReservation = await client.query(
      'SELECT * FROM table_reservations WHERE id = $1',
      [id]
    );
    
    if (existingReservation.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      });
    }
    
    const reservation = existingReservation.rows[0];
    const arrivalTime = actual_arrival_time || new Date().toISOString();
    
    // Parse dates correctly - handle timezone issues
    // Create a proper ISO date for the scheduled time
    const scheduledDateTime = `${reservation.reservation_date}T${reservation.reservation_time}.000Z`;
    const scheduledDate = new Date(scheduledDateTime);
    const actualDate = new Date(arrivalTime);
    
    // Calculate delay in minutes
    const timeDiff = actualDate.getTime() - scheduledDate.getTime();
    const delayMinutes = Math.max(0, Math.floor(timeDiff / (1000 * 60)));
    const isOnTime = delayMinutes <= 15; // 15 minute grace period
    
    const query = `
      UPDATE table_reservations 
      SET 
        status = 'seated',
        actual_arrival_time = $1,
        arrival_notes = $2,
        is_late_arrival = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await client.query(query, [
      arrivalTime,
      arrival_notes || null,
      !isOnTime,
      id
    ]);
    client.release();
    
    res.json({
      success: true,
      data: result.rows[0],
      isOnTime,
      delayMinutes,
      message: isOnTime ? 'Customer arrived on time' : 'Customer arrived late'
    });
    
  } catch (error) {
    console.error('Error marking arrival:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark arrival',
      details: error.message
    });
  }
});

// PUT /api/admin/reservations/:id/departure - Mark customer departure
router.put('/:id/departure', async (req, res) => {
  try {
    const { id } = req.params;
    const { actual_departure_time } = req.body;
    
    const client = await pool.connect();
    
    // Check if reservation exists
    const existingReservation = await client.query(
      'SELECT * FROM table_reservations WHERE id = $1',
      [id]
    );
    
    if (existingReservation.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      });
    }
    
    const reservation = existingReservation.rows[0];
    const departureTime = actual_departure_time || new Date().toISOString();
    
    // Use actual arrival time if available, otherwise use scheduled time
    let arrivalTime;
    if (reservation.actual_arrival_time) {
      arrivalTime = reservation.actual_arrival_time;
    } else {
      arrivalTime = `${reservation.reservation_date}T${reservation.reservation_time}.000Z`;
    }
    
    // Calculate actual duration in minutes
    const departureDate = new Date(departureTime);
    const arrivalDate = new Date(arrivalTime);
    const actualDurationMinutes = Math.floor((departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60));
    
    // Format duration as HH:MM:SS
    const hours = Math.floor(actualDurationMinutes / 60);
    const minutes = actualDurationMinutes % 60;
    const durationFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    
    const query = `
      UPDATE table_reservations 
      SET 
        status = 'departed',
        actual_departure_time = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await client.query(query, [departureTime, id]);
    client.release();
    
    res.json({
      success: true,
      data: result.rows[0],
      actualDuration: durationFormatted,
      message: 'Customer departure marked successfully'
    });
    
  } catch (error) {
    console.error('Error marking departure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark departure',
      details: error.message
    });
  }
});

// DELETE /api/admin/reservations/:id - Cancel reservation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    // Update status to cancelled instead of deleting
    const query = `
      UPDATE table_reservations 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *
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
      message: 'Reservation cancelled successfully'
    });
    
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel reservation',
      details: error.message
    });
  }
});

// GET /api/admin/reservations/statistics - Get reservation statistics
router.get('/statistics', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get total reservations
    const totalQuery = 'SELECT COUNT(*) as total FROM table_reservations';
    const totalResult = await client.query(totalQuery);
    
    // Get reservations by status
    const statusQuery = `
      SELECT status, COUNT(*) as count 
      FROM table_reservations 
      GROUP BY status
    `;
    const statusResult = await client.query(statusQuery);
    
    // Get today's reservations
    const todayQuery = `
      SELECT COUNT(*) as count 
      FROM table_reservations 
      WHERE reservation_date = CURRENT_DATE
    `;
    const todayResult = await client.query(todayQuery);
    
    // Get this week's reservations
    const weekQuery = `
      SELECT COUNT(*) as count 
      FROM table_reservations 
      WHERE reservation_date BETWEEN CURRENT_DATE - INTERVAL '7 days' AND CURRENT_DATE
    `;
    const weekResult = await client.query(weekQuery);
    
    // Get this month's reservations
    const monthQuery = `
      SELECT COUNT(*) as count 
      FROM table_reservations 
      WHERE reservation_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE
    `;
    const monthResult = await client.query(monthQuery);
    
    client.release();
    
    const statistics = {
      total_reservations: parseInt(totalResult.rows[0].total),
      by_status: statusResult.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
      today: parseInt(todayResult.rows[0].count),
      this_week: parseInt(weekResult.rows[0].count),
      this_month: parseInt(monthResult.rows[0].count)
    };
    
    res.json({
      success: true,
      statistics,
      message: 'Statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
});

// GET /api/admin/reservations/utilization - Get table utilization data
router.get('/utilization', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    const client = await pool.connect();
    
    const query = `
      SELECT 
        rt.id,
        rt.table_number,
        rt.name,
        rt.capacity,
        rt.table_type,
        rt.location_description,
        COUNT(tr.id) as reservation_count,
        COALESCE(SUM(tr.number_of_guests), 0) as total_guests,
        CASE 
          WHEN COUNT(tr.id) > 0 THEN 
            ROUND((COUNT(tr.id) * 105.0 / (24 * 60)) * 100, 2)
          ELSE 0 
        END as utilization_percentage
      FROM restaurant_tables rt
      LEFT JOIN table_reservations tr ON rt.id = tr.table_id 
        AND tr.reservation_date = $1 
        AND tr.status IN ('confirmed', 'seated')
      WHERE rt.is_active = true
      GROUP BY rt.id, rt.table_number, rt.name, rt.capacity, rt.table_type, rt.location_description
      ORDER BY rt.table_number
    `;
    
    const result = await client.query(query, [date]);
    client.release();
    
    res.json({
      success: true,
      utilization: result.rows,
      date,
      message: `Utilization data retrieved for ${date}`
    });
    
  } catch (error) {
    console.error('Error fetching utilization data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch utilization data',
      details: error.message
    });
  }
});

// GET /api/admin/reservations/analytics/duration - Get duration analytics
router.get('/analytics/duration', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Default to last 30 days if no dates provided
    const end = end_date || new Date().toISOString().split('T')[0];
    const start = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const client = await pool.connect();
    
    const query = `
      SELECT 
        AVG(EXTRACT(EPOCH FROM (actual_departure_time - actual_arrival_time)) / 60) as average_dining_minutes,
        AVG(EXTRACT(EPOCH FROM (actual_arrival_time - (reservation_date + reservation_time::time)) / 60)) as average_delay_minutes,
        COUNT(*) as total_completed_reservations,
        COUNT(CASE WHEN is_late_arrival = true THEN 1 END) as late_arrivals,
        COUNT(CASE WHEN is_late_arrival = false THEN 1 END) as on_time_arrivals
      FROM table_reservations 
      WHERE actual_arrival_time IS NOT NULL 
        AND actual_departure_time IS NOT NULL
        AND reservation_date BETWEEN $1 AND $2
    `;
    
    const result = await client.query(query, [start, end]);
    client.release();
    
    const analytics = {
      average_dining_minutes: Math.round(result.rows[0].average_dining_minutes || 0),
      average_delay_minutes: Math.round(result.rows[0].average_delay_minutes || 0),
      total_completed_reservations: parseInt(result.rows[0].total_completed_reservations || 0),
      late_arrivals: parseInt(result.rows[0].late_arrivals || 0),
      on_time_arrivals: parseInt(result.rows[0].on_time_arrivals || 0),
      on_time_percentage: result.rows[0].total_completed_reservations > 0 
        ? Math.round((result.rows[0].on_time_arrivals / result.rows[0].total_completed_reservations) * 100)
        : 0
    };
    
    res.json({
      success: true,
      analytics,
      dateRange: { start, end },
      message: 'Duration analytics retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching duration analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch duration analytics',
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
        tr.id,
        tr.customer_name,
        tr.customer_email,
        tr.customer_phone,
        tr.reservation_date,
        tr.reservation_time,
        tr.number_of_guests,
        tr.special_requests,
        tr.status,
        tr.duration_minutes,
        tr.grace_period_minutes,
        tr.max_sitting_minutes,
        tr.reservation_end_time,
        tr.actual_arrival_time,
        tr.actual_departure_time,
        tr.is_late_arrival,
        tr.arrival_notes,
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
