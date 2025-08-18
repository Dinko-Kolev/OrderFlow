const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// Get all categories
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        id, 
        name, 
        description, 
        display_order, 
        is_active, 
        created_at 
      FROM categories 
      ORDER BY display_order ASC, name ASC
    `);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Categories retrieved successfully"
    });
  } catch (error) {
    console.error("Categories fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve categories",
      message: error.message
    });
  }
});

// Get category by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        id, 
        name, 
        description, 
        display_order, 
        is_active, 
        created_at 
      FROM categories 
      WHERE id = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Category not found"
      });
    }
    
    res.json({
      success: true,
      data: rows[0],
      message: "Category retrieved successfully"
    });
  } catch (error) {
    console.error("Category fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve category",
      message: error.message
    });
  }
});

// Get category with products
router.get("/:id/products", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.base_price,
        p.image_url,
        p.is_available,
        p.preparation_time,
        p.calories,
        p.created_at
      FROM products p
      WHERE p.category_id = $1 AND p.is_available = true
      ORDER BY p.name ASC
    `, [id]);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Category products retrieved successfully"
    });
  } catch (error) {
    console.error("Category products fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve category products",
      message: error.message
    });
  }
});

// Get category statistics
router.get("/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        COUNT(p.id) as total_products,
        COUNT(CASE WHEN p.is_available = true THEN 1 END) as available_products,
        AVG(p.base_price) as average_price,
        MIN(p.created_at) as first_product,
        MAX(p.created_at) as last_product
      FROM products p
      WHERE p.category_id = $1
    `, [id]);
    
    res.json({
      success: true,
      data: rows[0],
      message: "Category statistics retrieved successfully"
    });
  } catch (error) {
    console.error("Category stats fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve category statistics",
      message: error.message
    });
  }
});

module.exports = router;
