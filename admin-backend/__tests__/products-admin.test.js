const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');

// Mock the database pool
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  })),
}));

// Mock the products route
const productsRouter = require('../routes/products');
const app = express();
app.use(express.json());
app.use('/api/products', productsRouter);

describe('Admin Backend - Products API', () => {
  let mockPool;
  let mockQuery;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup mock pool
    mockPool = new Pool();
    mockQuery = mockPool.query;
    
    // Mock the db module to return our mock pool
    jest.doMock('../db', () => ({
      pool: mockPool,
    }));
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('GET /api/products', () => {
    test('should fetch all products successfully', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Margherita Pizza',
          description: 'Classic tomato and mozzarella pizza',
          price: 12.99,
          category_id: 1,
          category_name: 'Pizza',
          is_available: true,
          image_url: 'pizza1.jpg'
        },
        {
          id: 2,
          name: 'Caesar Salad',
          description: 'Fresh romaine lettuce with Caesar dressing',
          price: 8.99,
          category_id: 2,
          category_name: 'Salads',
          is_available: true,
          image_url: 'salad1.jpg'
        }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockProducts,
        rowCount: 2
      });

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockProducts,
        total: 2
      });
    });

    test('should filter products by category', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Margherita Pizza',
          category_id: 1,
          category_name: 'Pizza'
        }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockProducts,
        rowCount: 1
      });

      const response = await request(app)
        .get('/api/products?category=1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category_id).toBe(1);
    });

    test('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/products')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('GET /api/products/:id', () => {
    test('should fetch product by ID successfully', async () => {
      const mockProduct = {
        id: 1,
        name: 'Margherita Pizza',
        description: 'Classic tomato and mozzarella pizza',
        price: 12.99,
        category_id: 1,
        category_name: 'Pizza',
        is_available: true,
        image_url: 'pizza1.jpg'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockProduct],
        rowCount: 1
      });

      const response = await request(app)
        .get('/api/products/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockProduct
      });
    });

    test('should return 404 when product not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      const response = await request(app)
        .get('/api/products/999')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Product not found'
      });
    });

    test('should handle invalid product ID', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid product ID'
      });
    });
  });

  describe('POST /api/products', () => {
    test('should create product successfully', async () => {
      const newProduct = {
        name: 'New Pizza',
        description: 'A delicious new pizza',
        price: 15.99,
        category_id: 1,
        is_available: true,
        image_url: 'new-pizza.jpg'
      };

      const createdProduct = {
        id: 3,
        ...newProduct,
        created_at: '2025-01-01T10:00:00Z'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [createdProduct],
        rowCount: 1
      });

      const response = await request(app)
        .post('/api/products')
        .send(newProduct)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: createdProduct,
        message: 'Product created successfully'
      });
    });

    test('should validate required fields', async () => {
      const invalidProduct = {
        description: 'Missing name and price',
        category_id: 1
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: expect.stringContaining('required')
      });
    });

    test('should validate price is positive', async () => {
      const invalidProduct = {
        name: 'Invalid Pizza',
        description: 'Pizza with negative price',
        price: -5.99,
        category_id: 1
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: expect.stringContaining('positive')
      });
    });

    test('should handle database errors during creation', async () => {
      const newProduct = {
        name: 'New Pizza',
        description: 'A delicious new pizza',
        price: 15.99,
        category_id: 1
      };

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/products')
        .send(newProduct)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('PUT /api/products/:id', () => {
    test('should update product successfully', async () => {
      const updateData = {
        name: 'Updated Pizza',
        price: 18.99
      };

      const updatedProduct = {
        id: 1,
        name: 'Updated Pizza',
        description: 'Classic tomato and mozzarella pizza',
        price: 18.99,
        category_id: 1,
        is_available: true,
        image_url: 'pizza1.jpg',
        updated_at: '2025-01-01T12:00:00Z'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [updatedProduct],
        rowCount: 1
      });

      const response = await request(app)
        .put('/api/products/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: updatedProduct,
        message: 'Product updated successfully'
      });
    });

    test('should return 404 when product not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      const response = await request(app)
        .put('/api/products/999')
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Product not found'
      });
    });

    test('should validate update data', async () => {
      const invalidUpdate = {
        price: -10.99
      };

      const response = await request(app)
        .put('/api/products/1')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: expect.stringContaining('positive')
      });
    });
  });

  describe('DELETE /api/products/:id', () => {
    test('should delete product successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rowCount: 1
      });

      const response = await request(app)
        .delete('/api/products/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Product deleted successfully'
      });
    });

    test('should return 404 when product not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rowCount: 0
      });

      const response = await request(app)
        .delete('/api/products/999')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Product not found'
      });
    });

    test('should handle database errors during deletion', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .delete('/api/products/1')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('GET /api/products/categories', () => {
    test('should fetch all categories successfully', async () => {
      const mockCategories = [
        { id: 1, name: 'Pizza', description: 'Italian pizzas' },
        { id: 2, name: 'Salads', description: 'Fresh salads' },
        { id: 3, name: 'Drinks', description: 'Beverages' }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockCategories,
        rowCount: 3
      });

      const response = await request(app)
        .get('/api/products/categories')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockCategories
      });
    });

    test('should handle database errors for categories', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/products/categories')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('POST /api/products/categories', () => {
    test('should create category successfully', async () => {
      const newCategory = {
        name: 'Desserts',
        description: 'Sweet treats and desserts'
      };

      const createdCategory = {
        id: 4,
        ...newCategory,
        created_at: '2025-01-01T10:00:00Z'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [createdCategory],
        rowCount: 1
      });

      const response = await request(app)
        .post('/api/products/categories')
        .send(newCategory)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: createdCategory,
        message: 'Category created successfully'
      });
    });

    test('should validate category name is required', async () => {
      const invalidCategory = {
        description: 'Missing name'
      };

      const response = await request(app)
        .post('/api/products/categories')
        .send(invalidCategory)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: expect.stringContaining('name')
      });
    });
  });
});
