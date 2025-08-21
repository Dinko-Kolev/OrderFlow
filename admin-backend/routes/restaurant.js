const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'pizza_user',
  password: process.env.DB_PASS || 'pizza_pass',
  database: process.env.DB_NAME || 'pizza_db',
});

// Get all restaurant configuration
router.get('/config', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT config_key, config_value, description FROM restaurant_config ORDER BY config_key');
    client.release();

    const config = {};
    result.rows.forEach(row => {
      config[row.config_key] = row.config_value;
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching restaurant config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restaurant configuration'
    });
  }
});

// Update restaurant configuration
router.put('/config', async (req, res) => {
  try {
    const { config_key, config_value, description } = req.body;
    
    if (!config_key || config_value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'config_key and config_value are required'
      });
    }

    const client = await pool.connect();
    const result = await client.query(
      'SELECT update_restaurant_config($1, $2, $3)',
      [config_key, config_value, description]
    );
    client.release();

    res.json({
      success: true,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating restaurant config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update restaurant configuration'
    });
  }
});

// Get working hours for all days
router.get('/working-hours', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM working_hours ORDER BY day_of_week'
    );
    client.release();

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching working hours:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch working hours'
    });
  }
});

// Update working hours for a specific day
router.put('/working-hours/:dayOfWeek', async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const {
      is_open,
      open_time,
      close_time,
      is_lunch_service,
      lunch_start,
      lunch_end,
      is_dinner_service,
      dinner_start,
      dinner_end
    } = req.body;

    const client = await pool.connect();
    const result = await client.query(
      'SELECT update_working_hours($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [
        parseInt(dayOfWeek),
        is_open,
        open_time,
        close_time,
        lunch_start,
        lunch_end,
        dinner_start,
        dinner_end,
        is_lunch_service,
        is_dinner_service
      ]
    );
    client.release();

    if (result.rows[0].update_working_hours) {
      res.json({
        success: true,
        message: 'Working hours updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Day not found'
      });
    }
  } catch (error) {
    console.error('Error updating working hours:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update working hours'
    });
  }
});

// Get all reservation policies
router.get('/policies', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM reservation_policies ORDER BY policy_name'
    );
    client.release();

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policies'
    });
  }
});

// Update a specific policy
router.put('/policies/:policyName', async (req, res) => {
  try {
    const { policyName } = req.params;
    const { policy_value, is_active } = req.body;

    if (policy_value === undefined || is_active === undefined) {
      return res.status(400).json({
        success: false,
        error: 'policy_value and is_active are required'
      });
    }

    const client = await pool.connect();
    const result = await client.query(
      'UPDATE reservation_policies SET policy_value = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP WHERE policy_name = $3 RETURNING *',
      [policy_value, is_active, policyName]
    );
    client.release();

    if (result.rows.length > 0) {
      res.json({
        success: true,
        message: 'Policy updated successfully',
        data: result.rows[0]
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
    }
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update policy'
    });
  }
});

// Get restaurant configuration summary
router.get('/summary', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM restaurant_config_summary');
    client.release();

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching restaurant summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restaurant summary'
    });
  }
});

// Get available time slots for a specific date
router.get('/time-slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { service_type = 'both' } = req.query;

    const client = await pool.connect();
    const result = await client.query(
      'SELECT get_available_time_slots($1, $2) as time_slots',
      [date, service_type]
    );
    client.release();

    res.json({
      success: true,
      data: {
        date,
        service_type,
        time_slots: result.rows[0].time_slots || []
      }
    });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch time slots'
    });
  }
});

// Get reservation duration for a service type
router.get('/reservation-duration/:serviceType', async (req, res) => {
  try {
    const { serviceType } = req.params;

    const client = await pool.connect();
    const result = await client.query(
      'SELECT get_reservation_duration($1) as duration_minutes',
      [serviceType]
    );
    client.release();

    res.json({
      success: true,
      data: {
        service_type: serviceType,
        duration_minutes: result.rows[0].duration_minutes
      }
    });
  } catch (error) {
    console.error('Error fetching reservation duration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reservation duration'
    });
  }
});

// Reset configuration to defaults
router.post('/reset-defaults', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Reset working hours to defaults
    await client.query(`
      UPDATE working_hours SET 
        is_open = true,
        open_time = '11:00:00',
        close_time = '23:00:00',
        is_lunch_service = true,
        lunch_start = '12:00:00',
        lunch_end = '14:30:00',
        is_dinner_service = true,
        dinner_start = '19:00:00',
        dinner_end = '22:00:00',
        updated_at = CURRENT_TIMESTAMP
    `);

    // Reset config to defaults
    await client.query(`
      UPDATE restaurant_config SET 
        config_value = CASE config_key
          WHEN 'reservation_duration_minutes' THEN '105'
          WHEN 'grace_period_minutes' THEN '15'
          WHEN 'max_sitting_minutes' THEN '120'
          WHEN 'time_slot_interval_minutes' THEN '30'
          WHEN 'lunch_buffer_minutes' THEN '15'
          WHEN 'dinner_buffer_minutes' THEN '15'
          WHEN 'advance_booking_days' THEN '30'
          WHEN 'same_day_booking_hours' THEN '2'
          WHEN 'max_party_size' THEN '12'
          WHEN 'min_party_size' THEN '1'
          ELSE config_value
        END,
        updated_at = CURRENT_TIMESTAMP
    `);

    // Reset policies to defaults
    await client.query(`
      UPDATE reservation_policies SET 
        policy_value = CASE policy_name
          WHEN 'allow_same_day_reservations' THEN 'true'
          WHEN 'require_phone_confirmation' THEN 'false'
          WHEN 'allow_walk_ins' THEN 'true'
          WHEN 'cancellation_policy_hours' THEN '24'
          WHEN 'no_show_policy' THEN '3'
          WHEN 'deposit_required' THEN 'false'
          WHEN 'deposit_amount' THEN '0'
          ELSE policy_value
        END,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
    `);

    client.release();

    res.json({
      success: true,
      message: 'Configuration reset to defaults successfully'
    });
  } catch (error) {
    console.error('Error resetting configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset configuration'
    });
  }
});

module.exports = router;
