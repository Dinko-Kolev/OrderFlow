const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// Get dashboard overview statistics
router.get("/", async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json({
      success: true,
      data: stats,
      message: "Dashboard statistics retrieved successfully"
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve dashboard statistics",
      message: error.message
    });
  }
});

// Get sales analytics
router.get("/sales", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as daily_revenue,
        AVG(total_amount) as average_order_value
      FROM orders 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Sales analytics retrieved successfully"
    });
  } catch (error) {
    console.error("Sales analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve sales analytics",
      message: error.message
    });
  }
});

// Get top products
router.get("/top-products", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.base_price,
        COUNT(oi.id) as order_count,
        COALESCE(SUM(oi.quantity), 0) as total_quantity
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
      GROUP BY p.id, p.name, p.base_price
      ORDER BY total_quantity DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Top products retrieved successfully"
    });
  } catch (error) {
    console.error("Top products error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve top products",
      message: error.message
    });
  }
});

// Get recent activity
router.get("/recent-activity", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        'order' as type,
        o.id,
        o.total_amount,
        o.status,
        o.created_at,
        u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'product' as type,
        p.id,
        p.base_price as total_amount,
        CASE WHEN p.is_available THEN 'available' ELSE 'unavailable' END as status,
        p.created_at,
        p.name as customer_email
      FROM products p
      WHERE p.created_at >= CURRENT_DATE - INTERVAL '7 days'
      
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Recent activity retrieved successfully"
    });
  } catch (error) {
    console.error("Recent activity error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve recent activity",
      message: error.message
    });
  }
});

// Get current month revenue
router.get("/current-month-revenue", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as revenue
      FROM orders 
      WHERE status != 'cancelled' 
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    res.json({
      success: true,
      data: parseFloat(rows[0].revenue) || 0,
      message: "Current month revenue retrieved successfully"
    });
  } catch (error) {
    console.error("Current month revenue error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve current month revenue",
      message: error.message
    });
  }
});

// Get previous month revenue
router.get("/previous-month-revenue", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as revenue
      FROM orders 
      WHERE status != 'cancelled' 
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `);
    
    res.json({
      success: true,
      data: parseFloat(rows[0].revenue) || 0,
      message: "Previous month revenue retrieved successfully"
    });
  } catch (error) {
    console.error("Previous month revenue error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve previous month revenue",
      message: error.message
    });
  }
});

// Get current month orders
router.get("/current-month-orders", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(*) as orders
      FROM orders 
      WHERE status != 'cancelled' 
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    res.json({
      success: true,
      data: parseInt(rows[0].orders) || 0,
      message: "Current month orders retrieved successfully"
    });
  } catch (error) {
    console.error("Current month orders error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve current month orders",
      message: error.message
    });
  }
});

// Get previous month orders
router.get("/previous-month-orders", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(*) as orders
      FROM orders 
      WHERE status != 'cancelled' 
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `);
    
    res.json({
      success: true,
      data: parseInt(rows[0].orders) || 0,
      message: "Previous month orders retrieved successfully"
    });
  } catch (error) {
    console.error("Previous month orders error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve previous month orders",
      message: error.message
    });
  }
});

// Get current month customers
router.get("/current-month-customers", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as customers
      FROM orders 
      WHERE status != 'cancelled' 
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    res.json({
      success: true,
      data: parseInt(rows[0].customers) || 0,
      message: "Current month customers retrieved successfully"
    });
  } catch (error) {
    console.error("Current month customers error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve current month customers",
      message: error.message
    });
  }
});

// Get previous month customers
router.get("/previous-month-customers", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as customers
      FROM orders 
      WHERE status != 'cancelled' 
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `);
    
    res.json({
      success: true,
      data: parseInt(rows[0].customers) || 0,
      message: "Previous month customers retrieved successfully"
    });
  } catch (error) {
    console.error("Previous month customers error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve previous month customers",
      message: error.message
    });
  }
});

// Dashboard statistics function
async function getDashboardStats() {
  try {
    const ordersResult = await pool.query("SELECT COUNT(*) as count FROM orders");
    const totalOrders = parseInt(ordersResult.rows[0].count) || 0;

    const customersResult = await pool.query("SELECT COUNT(*) as count FROM users");
    const totalCustomers = parseInt(customersResult.rows[0].count) || 0;

    const revenueResult = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'completed'");
    const totalRevenue = parseFloat(revenueResult.rows[0].total) || 0;

    const productsResult = await pool.query("SELECT COUNT(*) as count FROM products WHERE is_available = true");
    const totalProducts = parseInt(productsResult.rows[0].count) || 0;

    const categoriesResult = await pool.query("SELECT COUNT(*) as count FROM categories WHERE is_active = true");
    const totalCategories = parseInt(categoriesResult.rows[0].count) || 0;

    const tablesResult = await pool.query("SELECT COUNT(*) as count FROM restaurant_tables WHERE is_active = true");
    const totalTables = parseInt(tablesResult.rows[0].count) || 0;

    return {
      totalOrders,
      totalCustomers,
      totalRevenue: totalRevenue.toFixed(2),
      totalProducts,
      totalCategories,
      totalTables,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Stats calculation error:", error);
    return {
      totalOrders: 0,
      totalCustomers: 0,
      totalRevenue: "0.00",
      totalProducts: 0,
      totalCategories: 0,
      totalTables: 0,
      lastUpdated: new Date().toISOString(),
      error: "Some statistics could not be calculated"
    };
  }
}

module.exports = router;
