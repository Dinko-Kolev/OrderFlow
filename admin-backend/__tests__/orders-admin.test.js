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

// Mock the orders route
const ordersRouter = require('../routes/orders');
const app = express();
app.use(express.json());
app.use('/api/orders', ordersRouter);

describe('Admin Backend - Orders API', () => {
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

  describe('GET /api/orders', () => {
    test('should fetch all orders successfully', async () => {
      const mockOrders = [
        {
          id: 1,
          order_number: 'ORD-20250101-0001',
          status: 'pending',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          total_amount: 25.99,
          created_at: '2025-01-01T10:00:00Z'
        },
        {
          id: 2,
          order_number: 'ORD-20250101-0002',
          status: 'completed',
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          total_amount: 45.50,
          created_at: '2025-01-01T11:00:00Z'
        }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockOrders,
        rowCount: 2
      });

      const response = await request(app)
        .get('/api/orders')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockOrders,
        total: 2
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT o.*, oi.product_name, oi.quantity, oi.price')
      );
    });

    test('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/orders')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });

    test('should return empty array when no orders exist', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      const response = await request(app)
        .get('/api/orders')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [],
        total: 0
      });
    });
  });

  describe('GET /api/orders/:id', () => {
    test('should fetch order by ID successfully', async () => {
      const mockOrder = {
        id: 1,
        order_number: 'ORD-20250101-0001',
        status: 'pending',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        total_amount: 25.99,
        created_at: '2025-01-01T10:00:00Z'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockOrder],
        rowCount: 1
      });

      const response = await request(app)
        .get('/api/orders/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockOrder
      });
    });

    test('should return 404 when order not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      const response = await request(app)
        .get('/api/orders/999')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Order not found'
      });
    });

    test('should handle invalid order ID', async () => {
      const response = await request(app)
        .get('/api/orders/invalid-id')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid order ID'
      });
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    test('should update order status successfully', async () => {
      const mockUpdatedOrder = {
        id: 1,
        status: 'completed',
        updated_at: '2025-01-01T12:00:00Z'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockUpdatedOrder],
        rowCount: 1
      });

      const response = await request(app)
        .put('/api/orders/1/status')
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUpdatedOrder,
        message: 'Order status updated successfully'
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE orders SET status = $1'),
        ['completed', 1]
      );
    });

    test('should validate status field', async () => {
      const response = await request(app)
        .put('/api/orders/1/status')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Status is required'
      });
    });

    test('should validate valid status values', async () => {
      const response = await request(app)
        .put('/api/orders/1/status')
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid status. Must be one of: pending, confirmed, preparing, ready, completed, cancelled'
      });
    });

    test('should return 404 when order not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      const response = await request(app)
        .put('/api/orders/999/status')
        .send({ status: 'completed' })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Order not found'
      });
    });
  });

  describe('DELETE /api/orders/:id', () => {
    test('should delete order successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rowCount: 1
      });

      const response = await request(app)
        .delete('/api/orders/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Order deleted successfully'
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM orders WHERE id = $1'),
        [1]
      );
    });

    test('should return 404 when order not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rowCount: 0
      });

      const response = await request(app)
        .delete('/api/orders/999')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Order not found'
      });
    });

    test('should handle database errors during deletion', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .delete('/api/orders/1')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('GET /api/orders/stats/summary', () => {
    test('should fetch order statistics successfully', async () => {
      const mockStats = {
        total_orders: 150,
        total_revenue: 3750.50,
        pending_orders: 25,
        completed_orders: 100,
        cancelled_orders: 25
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockStats],
        rowCount: 1
      });

      const response = await request(app)
        .get('/api/orders/stats/summary')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockStats
      });
    });

    test('should handle database errors for statistics', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/orders/stats/summary')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('GET /api/orders/search', () => {
    test('should search orders by customer name', async () => {
      const mockSearchResults = [
        {
          id: 1,
          order_number: 'ORD-20250101-0001',
          customer_name: 'John Doe',
          status: 'completed'
        }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockSearchResults,
        rowCount: 1
      });

      const response = await request(app)
        .get('/api/orders/search?q=John')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockSearchResults,
        total: 1
      });
    });

    test('should search orders by order number', async () => {
      const mockSearchResults = [
        {
          id: 1,
          order_number: 'ORD-20250101-0001',
          customer_name: 'John Doe',
          status: 'completed'
        }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockSearchResults,
        rowCount: 1
      });

      const response = await request(app)
        .get('/api/orders/search?q=ORD-20250101-0001')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockSearchResults,
        total: 1
      });
    });

    test('should return empty results when no matches found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      const response = await request(app)
        .get('/api/orders/search?q=nonexistent')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [],
        total: 0
      });
    });

    test('should handle missing search query', async () => {
      const response = await request(app)
        .get('/api/orders/search')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Search query is required'
      });
    });
  });
});
