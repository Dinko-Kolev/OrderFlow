const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// Get all orders
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        o.id, 
        o.user_id,
        u.email as customer_email,
        u.first_name,
        u.last_name,
        o.total_amount, 
        o.status, 
        o.created_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, o.user_id, u.email, u.first_name, u.last_name, o.total_amount, o.status, o.created_at
      ORDER BY o.created_at DESC 
      LIMIT 100
    `);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Orders retrieved successfully"
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve orders",
      message: error.message
    });
  }
});

// Get order by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        o.*,
        u.email as customer_email,
        u.first_name,
        u.last_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }
    
    res.json({
      success: true,
      data: rows[0],
      message: "Order retrieved successfully"
    });
  } catch (error) {
    console.error("Order fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve order",
      message: error.message
    });
  }
});

// Get order items
router.get("/:id/items", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.base_price
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [id]);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Order items retrieved successfully"
    });
  } catch (error) {
    console.error("Order items fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve order items",
      message: error.message
    });
  }
});

// Create new order
router.post("/", async (req, res) => {
  try {
    const { user_id, total_amount, status = 'pending', items } = req.body;
    
    if (!user_id || !total_amount || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: user_id, total_amount, and items array are required"
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create order
      const orderResult = await client.query(`
        INSERT INTO orders (user_id, total_amount, status, created_at, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
      `, [user_id, total_amount, status]);
      
      const orderId = orderResult.rows[0].id;
      
      // Create order items
      for (const item of items) {
        if (!item.product_id || !item.quantity || !item.price) {
          throw new Error(`Invalid item data: product_id, quantity, and price are required`);
        }
        
        await client.query(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES ($1, $2, $3, $4)
        `, [orderId, item.product_id, item.quantity, item.price]);
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        data: { id: orderId },
        message: "Order created successfully"
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create order",
      message: error.message
    });
  }
});

// Update order
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, total_amount, status, items } = req.body;
    
    if (!user_id || !total_amount || !status) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: user_id, total_amount, and status are required"
      });
    }

    // Check if order exists
    const orderCheck = await pool.query('SELECT id FROM orders WHERE id = $1', [id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update order
      const orderResult = await client.query(`
        UPDATE orders 
        SET user_id = $1, total_amount = $2, status = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `, [user_id, total_amount, status, id]);
      
      // If items are provided, update them
      if (items && Array.isArray(items)) {
        // Delete existing items
        await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
        
        // Insert new items
        for (const item of items) {
          if (!item.product_id || !item.quantity || !item.price) {
            throw new Error(`Invalid item data: product_id, quantity, and price are required`);
          }
          
          await client.query(`
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES ($1, $2, $3, $4)
          `, [id, item.product_id, item.quantity, item.price]);
        }
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        data: orderResult.rows[0],
        message: "Order updated successfully"
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Order update error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update order",
      message: error.message
    });
  }
});

// Update order status
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const { rows } = await pool.query(`
      UPDATE orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }
    
    res.json({
      success: true,
      data: rows[0],
      message: "Order status updated successfully"
    });
  } catch (error) {
    console.error("Order status update error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update order status",
      message: error.message
    });
  }
});

// Delete order
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if order exists
    const orderCheck = await pool.query('SELECT id FROM orders WHERE id = $1', [id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete order items first (due to foreign key constraint)
      await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
      
      // Delete order
      await client.query('DELETE FROM orders WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: "Order deleted successfully"
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Order deletion error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete order",
      message: error.message
    });
  }
});

module.exports = router;
