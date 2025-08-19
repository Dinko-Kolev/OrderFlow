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

// Create new category (POST)
router.post("/", async (req, res) => {
  try {
    const { name, description, display_order, is_active } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: name is required"
      });
    }

    // Check if category name already exists
    const existingCheck = await pool.query("SELECT id FROM categories WHERE name = $1", [name]);
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Category name already exists"
      });
    }

    // Insert new category
    const { rows } = await pool.query(`
      INSERT INTO categories (name, description, display_order, is_active, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, name, description, display_order, is_active, created_at
    `, [name, description || null, display_order || 0, is_active !== false]);

    res.status(201).json({
      success: true,
      data: rows[0],
      message: "Category created successfully"
    });
  } catch (error) {
    console.error("Category creation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create category",
      message: error.message
    });
  }
});

// Update category (PUT)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, display_order, is_active } = req.body;
    
    // Check if category exists
    const categoryCheck = await pool.query("SELECT id FROM categories WHERE id = $1", [id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Category not found"
      });
    }

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: name is required"
      });
    }

    // Check if category name already exists (excluding current category)
    const existingCheck = await pool.query("SELECT id FROM categories WHERE name = $1 AND id != $2", [name, id]);
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Category name already exists"
      });
    }

    // Update category
    const { rows } = await pool.query(`
      UPDATE categories 
      SET name = $1, description = $2, display_order = $3, is_active = $4
      WHERE id = $5
      RETURNING id, name, description, display_order, is_active, created_at
    `, [name, description || null, display_order || 0, is_active !== false, id]);

    res.json({
      success: true,
      data: rows[0],
      message: "Category updated successfully"
    });
  } catch (error) {
    console.error("Category update error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update category",
      message: error.message
    });
  }
});

// Delete category (DELETE)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const categoryCheck = await pool.query("SELECT id, name FROM categories WHERE id = $1", [id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Category not found"
      });
    }

    // Check if category has products
    const productsCheck = await pool.query("SELECT COUNT(*) as count FROM products WHERE category_id = $1", [id]);
    if (parseInt(productsCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete category: it contains products. Please move or delete all products first."
      });
    }

    // Delete category
    await pool.query("DELETE FROM categories WHERE id = $1", [id]);

    res.json({
      success: true,
      message: `Category "${categoryCheck.rows[0].name}" deleted successfully`
    });
  } catch (error) {
    console.error("Category deletion error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete category",
      message: error.message
    });
  }
});

module.exports = router;
