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

// Mock the dashboard route
const dashboardRouter = require('../routes/dashboard');
const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRouter);

describe('Admin Backend - Dashboard API', () => {
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

  describe('GET /api/dashboard/overview', () => {
    test('should fetch dashboard overview successfully', async () => {
      const mockOverview = {
        total_orders: 150,
        total_revenue: 3750.50,
        total_customers: 89,
        total_products: 45,
        pending_orders: 25,
        completed_orders: 100,
        cancelled_orders: 25,
        today_orders: 12,
        today_revenue: 298.75
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockOverview],
        rowCount: 1
      });

      const response = await request(app)
        .get('/api/dashboard/overview')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockOverview
      });
    });

    test('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/dashboard/overview')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('GET /api/dashboard/revenue', () => {
    test('should fetch revenue data for specified period', async () => {
      const mockRevenueData = [
        { date: '2025-01-01', revenue: 298.75, orders: 12 },
        { date: '2025-01-02', revenue: 345.20, orders: 15 },
        { date: '2025-01-03', revenue: 278.90, orders: 11 }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockRevenueData,
        rowCount: 3
      });

      const response = await request(app)
        .get('/api/dashboard/revenue?period=7d')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockRevenueData
      });
    });

    test('should use default period when none specified', async () => {
      const mockRevenueData = [
        { date: '2025-01-01', revenue: 298.75, orders: 12 }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockRevenueData,
        rowCount: 1
      });

      const response = await request(app)
        .get('/api/dashboard/revenue')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockRevenueData
      });
    });

    test('should validate period parameter', async () => {
      const response = await request(app)
        .get('/api/dashboard/revenue?period=invalid')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: expect.stringContaining('Invalid period')
      });
    });
  });

  describe('GET /api/dashboard/orders', () => {
    test('should fetch order statistics for specified period', async () => {
      const mockOrderStats = [
        { date: '2025-01-01', orders: 12, status: 'completed' },
        { date: '2025-01-01', orders: 3, status: 'pending' },
        { date: '2025-01-02', orders: 15, status: 'completed' },
        { date: '2025-01-02', orders: 2, status: 'pending' }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockOrderStats,
        rowCount: 4
      });

      const response = await request(app)
        .get('/api/dashboard/orders?period=7d')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockOrderStats
      });
    });

    test('should handle database errors for order statistics', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/dashboard/orders')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('GET /api/dashboard/products', () => {
    test('should fetch top selling products', async () => {
      const mockTopProducts = [
        { id: 1, name: 'Margherita Pizza', total_sold: 45, revenue: 584.55 },
        { id: 2, name: 'Caesar Salad', total_sold: 32, revenue: 287.68 },
        { id: 3, name: 'Pepperoni Pizza', total_sold: 28, revenue: 363.72 }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockTopProducts,
        rowCount: 3
      });

      const response = await request(app)
        .get('/api/dashboard/products/top-selling?limit=5')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockTopProducts
      });
    });

    test('should fetch low stock products', async () => {
      const mockLowStockProducts = [
        { id: 4, name: 'Mushroom Pizza', current_stock: 2, min_stock: 5 },
        { id: 5, name: 'Greek Salad', current_stock: 1, min_stock: 3 }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockLowStockProducts,
        rowCount: 2
      });

      const response = await request(app)
        .get('/api/dashboard/products/low-stock')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockLowStockProducts
      });
    });

    test('should handle database errors for product analytics', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/dashboard/products/top-selling')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('GET /api/dashboard/customers', () => {
    test('should fetch customer statistics', async () => {
      const mockCustomerStats = {
        total_customers: 89,
        new_customers_this_month: 12,
        returning_customers: 67,
        top_customers: [
          { id: 1, name: 'John Doe', total_orders: 15, total_spent: 298.75 },
          { id: 2, name: 'Jane Smith', total_orders: 12, total_spent: 245.50 }
        ]
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockCustomerStats],
        rowCount: 1
      });

      const response = await request(app)
        .get('/api/dashboard/customers')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockCustomerStats
      });
    });

    test('should handle database errors for customer statistics', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/dashboard/customers')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('GET /api/dashboard/analytics', () => {
    test('should fetch comprehensive analytics data', async () => {
      const mockAnalytics = {
        revenue_growth: 15.5,
        order_growth: 12.3,
        customer_growth: 8.7,
        average_order_value: 25.00,
        peak_hours: ['12:00', '13:00', '19:00'],
        popular_categories: [
          { name: 'Pizza', percentage: 45.2 },
          { name: 'Salads', percentage: 28.1 },
          { name: 'Drinks', percentage: 26.7 }
        ]
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockAnalytics],
        rowCount: 1
      });

      const response = await request(app)
        .get('/api/dashboard/analytics?period=30d')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockAnalytics
      });
    });

    test('should validate analytics period parameter', async () => {
      const response = await request(app)
        .get('/api/dashboard/analytics?period=invalid')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: expect.stringContaining('Invalid period')
      });
    });
  });

  describe('GET /api/dashboard/notifications', () => {
    test('should fetch system notifications', async () => {
      const mockNotifications = [
        {
          id: 1,
          type: 'low_stock',
          message: 'Mushroom Pizza is running low on stock',
          severity: 'warning',
          created_at: '2025-01-01T10:00:00Z'
        },
        {
          id: 2,
          type: 'high_demand',
          message: 'Unusual high demand for Margherita Pizza',
          severity: 'info',
          created_at: '2025-01-01T09:30:00Z'
        }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockNotifications,
        rowCount: 2
      });

      const response = await request(app)
        .get('/api/dashboard/notifications')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockNotifications
      });
    });

    test('should filter notifications by type', async () => {
      const mockNotifications = [
        {
          id: 1,
          type: 'low_stock',
          message: 'Mushroom Pizza is running low on stock',
          severity: 'warning'
        }
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockNotifications,
        rowCount: 1
      });

      const response = await request(app)
        .get('/api/dashboard/notifications?type=low_stock')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('low_stock');
    });

    test('should handle database errors for notifications', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/dashboard/notifications')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('POST /api/dashboard/notifications/mark-read', () => {
    test('should mark notification as read successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rowCount: 1
      });

      const response = await request(app)
        .post('/api/dashboard/notifications/mark-read')
        .send({ notification_id: 1 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Notification marked as read'
      });
    });

    test('should validate notification ID', async () => {
      const response = await request(app)
        .post('/api/dashboard/notifications/mark-read')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: expect.stringContaining('notification_id')
      });
    });

    test('should handle database errors when marking as read', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/dashboard/notifications/mark-read')
        .send({ notification_id: 1 })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });
});
