const request = require('supertest')
const express = require('express')
const { Pool } = require('pg')

// Mock the database pool
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  })),
}))

// Mock the server
const app = express()
app.use(express.json())

// Mock reservation routes
const reservationRoutes = require('../routes/reservations')
app.use('/api/reservations', reservationRoutes)

// Test data
const mockReservation = {
  id: 1,
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  customer_phone: '+1234567890',
  reservation_date: '2024-01-15',
  reservation_time: '19:00:00',
  number_of_guests: 4,
  table_id: 2,
  special_requests: 'Window table preferred',
  status: 'confirmed',
  duration_minutes: 105,
  grace_period_minutes: 15,
  max_sitting_minutes: 120,
  reservation_end_time: '20:45:00',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockTable = {
  id: 2,
  table_number: 2,
  name: 'Table 2',
  capacity: 4,
  min_party_size: 2,
  is_active: true,
  table_type: 'standard',
  location_description: 'Near window',
}

const mockAvailableSlots = [
  { time: '12:00:00', available: true, availableTables: [1, 3, 5] },
  { time: '12:30:00', available: true, availableTables: [1, 3] },
  { time: '13:00:00', available: false, availableTables: [] },
  { time: '19:00:00', available: true, availableTables: [1, 2, 3, 4, 5] },
  { time: '19:30:00', available: true, availableTables: [2, 3, 4] },
  { time: '20:00:00', available: true, availableTables: [1, 2, 3] },
]

describe('Backend Reservation System', () => {
  let mockPool
  let mockClient

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock database client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    }
    
    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      query: jest.fn(),
      end: jest.fn(),
    }
    
    Pool.mockImplementation(() => mockPool)
  })

  describe('GET /api/reservations/availability/:date', () => {
    test('returns available time slots for a given date', async () => {
      // Mock database response for availability check
      mockClient.query.mockResolvedValueOnce({
        rows: [
          { table_id: 1, reservation_time: '19:00:00' },
          { table_id: 2, reservation_time: '19:00:00' },
        ],
        rowCount: 2,
      })
      
      // Mock database response for table information
      mockClient.query.mockResolvedValueOnce({
        rows: [mockTable],
        rowCount: 1,
      })
      
      const response = await request(app)
        .get('/api/reservations/availability/2024-01-15')
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.date).toBe('2024-01-15')
      expect(response.body.availableSlots).toBeDefined()
      expect(Array.isArray(response.body.availableSlots)).toBe(true)
    })

    test('handles database errors gracefully', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Database connection failed'))
      
      const response = await request(app)
        .get('/api/reservations/availability/2024-01-15')
        .expect(500)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Database connection failed')
    })

    test('returns empty availability for dates with no tables', async () => {
      // Mock empty table response
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      })
      
      const response = await request(app)
        .get('/api/reservations/availability/2024-01-15')
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.availableSlots).toEqual([])
    })

    test('calculates correct end times for time slots', async () => {
      // Mock database responses
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      })
      
      mockClient.query.mockResolvedValueOnce({
        rows: [mockTable],
        rowCount: 1,
      })
      
      const response = await request(app)
        .get('/api/reservations/availability/2024-01-15')
        .expect(200)
      
      // Check that end times are calculated correctly (105 minutes after start)
      const slot = response.body.availableSlots.find(s => s.time === '19:00:00')
      expect(slot).toBeDefined()
      expect(slot.endTime).toBe('20:45:00')
    })
  })

  describe('POST /api/reservations', () => {
    const validReservationData = {
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      customer_phone: '+1234567890',
      reservation_date: '2024-01-15',
      reservation_time: '19:00:00',
      number_of_guests: 4,
      special_requests: 'Window table preferred',
    }

    test('creates a new reservation successfully', async () => {
      // Mock table availability check
      mockClient.query.mockResolvedValueOnce({
        rows: [mockTable],
        rowCount: 1,
      })
      
      // Mock reservation creation
      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...mockReservation, id: 123 }],
        rowCount: 1,
      })
      
      const response = await request(app)
        .post('/api/reservations')
        .send(validReservationData)
        .expect(201)
      
      expect(response.body.success).toBe(true)
      expect(response.body.reservation.id).toBe(123)
      expect(response.body.reservation.tableNumber).toBe(2)
      expect(response.body.reservation.reservationEndTime).toBe('20:45:00')
      expect(response.body.reservation.durationMinutes).toBe(105)
    })

    test('validates required fields', async () => {
      const invalidData = {
        customer_name: 'John Doe',
        // Missing email, phone, date, time, guests
      }
      
      const response = await request(app)
        .post('/api/reservations')
        .send(invalidData)
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
      expect(response.body.errors).toContain('customer_email is required')
      expect(response.body.errors).toContain('customer_phone is required')
      expect(response.body.errors).toContain('reservation_date is required')
      expect(response.body.errors).toContain('reservation_time is required')
      expect(response.body.errors).toContain('number_of_guests is required')
    })

    test('validates email format', async () => {
      const invalidEmailData = {
        ...validReservationData,
        customer_email: 'invalid-email',
      }
      
      const response = await request(app)
        .post('/api/reservations')
        .send(invalidEmailData)
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.errors).toContain('customer_email must be a valid email address')
    })

    test('validates phone number format', async () => {
      const invalidPhoneData = {
        ...validReservationData,
        customer_phone: '123',
      }
      
      const response = await request(app)
        .post('/api/reservations')
        .send(invalidPhoneData)
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.errors).toContain('customer_phone must be a valid phone number')
    })

    test('validates guest count limits', async () => {
      const invalidGuestData = {
        ...validReservationData,
        number_of_guests: 25, // Above maximum
      }
      
      const response = await request(app)
        .post('/api/reservations')
        .send(invalidGuestData)
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.errors).toContain('number_of_guests must be between 1 and 20')
    })

    test('validates date format and future dates', async () => {
      const pastDateData = {
        ...validReservationData,
        reservation_date: '2020-01-15', // Past date
      }
      
      const response = await request(app)
        .post('/api/reservations')
        .send(pastDateData)
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.errors).toContain('reservation_date must be a future date')
    })

    test('validates time slot availability', async () => {
      // Mock that no tables are available at the requested time
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      })
      
      const response = await request(app)
        .post('/api/reservations')
        .send(validReservationData)
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('No available tables')
    })

    test('assigns table based on guest count and availability', async () => {
      // Mock table availability check
      mockClient.query.mockResolvedValueOnce({
        rows: [mockTable],
        rowCount: 1,
      })
      
      // Mock reservation creation
      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...mockReservation, id: 123 }],
        rowCount: 1,
      })
      
      const response = await request(app)
        .post('/api/reservations')
        .send(validReservationData)
        .expect(201)
      
      expect(response.body.reservation.tableNumber).toBe(2)
      expect(response.body.reservation.tableCapacity).toBe(4)
    })

    test('calculates reservation end time correctly', async () => {
      // Mock table availability check
      mockClient.query.mockResolvedValueOnce({
        rows: [mockTable],
        rowCount: 1,
      })
      
      // Mock reservation creation
      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...mockReservation, id: 123 }],
        rowCount: 1,
      })
      
      const response = await request(app)
        .post('/api/reservations')
        .send(validReservationData)
        .expect(201)
      
      // 19:00 + 105 minutes = 20:45
      expect(response.body.reservation.reservationEndTime).toBe('20:45:00')
      expect(response.body.reservation.durationMinutes).toBe(105)
    })

    test('handles database errors during creation', async () => {
      // Mock table availability check
      mockClient.query.mockResolvedValueOnce({
        rows: [mockTable],
        rowCount: 1,
      })
      
      // Mock reservation creation error
      mockClient.query.mockRejectedValueOnce(new Error('Insert failed'))
      
      const response = await request(app)
        .post('/api/reservations')
        .send(validReservationData)
        .expect(500)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Insert failed')
    })
  })

  describe('GET /api/reservations/:id', () => {
    test('returns reservation by ID', async () => {
      // Mock reservation fetch
      mockClient.query.mockResolvedValueOnce({
        rows: [mockReservation],
        rowCount: 1,
      })
      
      const response = await request(app)
        .get('/api/reservations/1')
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.reservation.id).toBe(1)
      expect(response.body.reservation.customer_name).toBe('John Doe')
      expect(response.body.reservation.reservation_end_time).toBe('20:45:00')
    })

    test('returns 404 for non-existent reservation', async () => {
      // Mock no reservation found
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      })
      
      const response = await request(app)
        .get('/api/reservations/999')
        .expect(404)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Reservation not found')
    })

    test('handles database errors gracefully', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Database error'))
      
      const response = await request(app)
        .get('/api/reservations/1')
        .expect(500)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Database error')
    })
  })

  describe('PUT /api/reservations/:id', () => {
    const updateData = {
      customer_name: 'Jane Smith',
      special_requests: 'Updated special request',
    }

    test('updates reservation successfully', async () => {
      // Mock reservation fetch
      mockClient.query.mockResolvedValueOnce({
        rows: [mockReservation],
        rowCount: 1,
      })
      
      // Mock update
      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...mockReservation, ...updateData }],
        rowCount: 1,
      })
      
      const response = await request(app)
        .put('/api/reservations/1')
        .send(updateData)
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.reservation.customer_name).toBe('Jane Smith')
      expect(response.body.reservation.special_requests).toBe('Updated special request')
    })

    test('validates update data', async () => {
      const invalidUpdateData = {
        customer_email: 'invalid-email',
        number_of_guests: 25,
      }
      
      const response = await request(app)
        .put('/api/reservations/1')
        .send(invalidUpdateData)
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    test('returns 404 for non-existent reservation', async () => {
      // Mock no reservation found
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      })
      
      const response = await request(app)
        .put('/api/reservations/999')
        .send(updateData)
        .expect(404)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Reservation not found')
    })
  })

  describe('DELETE /api/reservations/:id', () => {
    test('cancels reservation successfully', async () => {
      // Mock reservation fetch
      mockClient.query.mockResolvedValueOnce({
        rows: [mockReservation],
        rowCount: 1,
      })
      
      // Mock cancellation
      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...mockReservation, status: 'cancelled' }],
        rowCount: 1,
      })
      
      const response = await request(app)
        .delete('/api/reservations/1')
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.reservation.status).toBe('cancelled')
    })

    test('returns 404 for non-existent reservation', async () => {
      // Mock no reservation found
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      })
      
      const response = await request(app)
        .delete('/api/reservations/999')
        .expect(404)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Reservation not found')
    })
  })

  describe('Business Logic Tests', () => {
    test('prevents overlapping reservations on same table', async () => {
      // Mock existing reservation at the same time
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            table_id: 2,
            reservation_time: '19:00:00',
            reservation_end_time: '20:45:00',
            status: 'confirmed',
          },
        ],
        rowCount: 1,
      })
      
      const response = await request(app)
        .post('/api/reservations')
        .send({
          ...validReservationData,
          reservation_time: '19:30:00', // Overlaps with existing
        })
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Table not available')
    })

    test('enforces grace period logic', async () => {
      const now = new Date()
      const reservationTime = new Date(now.getTime() + 10 * 60000) // 10 minutes from now
      
      // Mock reservation creation
      mockClient.query.mockResolvedValueOnce({
        rows: [mockTable],
        rowCount: 1,
      })
      
      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...mockReservation, id: 123 }],
        rowCount: 1,
      })
      
      const response = await request(app)
        .post('/api/reservations')
        .send({
          ...validReservationData,
          reservation_date: reservationTime.toISOString().split('T')[0],
          reservation_time: reservationTime.toTimeString().split(' ')[0],
        })
        .expect(201)
      
      // Should include grace period information
      expect(response.body.reservation.gracePeriodMinutes).toBe(15)
      expect(response.body.reservation.gracePeriodEndTime).toBeDefined()
    })

    test('calculates maximum sitting time correctly', async () => {
      // Mock reservation creation
      mockClient.query.mockResolvedValueOnce({
        rows: [mockTable],
        rowCount: 1,
      })
      
      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...mockReservation, id: 123 }],
        rowCount: 1,
      })
      
      const response = await request(app)
        .post('/api/reservations')
        .send(validReservationData)
        .expect(201)
      
      // Should include max sitting time information
      expect(response.body.reservation.maxSittingMinutes).toBe(120)
      expect(response.body.reservation.maxSittingEndTime).toBeDefined()
    })
  })

  describe('Database Transaction Tests', () => {
    test('rolls back transaction on error', async () => {
      // Mock table availability check
      mockClient.query.mockResolvedValueOnce({
        rows: [mockTable],
        rowCount: 1,
      })
      
      // Mock reservation creation error
      mockClient.query.mockRejectedValueOnce(new Error('Insert failed'))
      
      const response = await request(app)
        .post('/api/reservations')
        .send(validReservationData)
        .expect(500)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Insert failed')
      
      // Verify that rollback was called
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
    })

    test('commits transaction on success', async () => {
      // Mock table availability check
      mockClient.query.mockResolvedValueOnce({
        rows: [mockTable],
        rowCount: 1,
      })
      
      // Mock reservation creation
      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...mockReservation, id: 123 }],
        rowCount: 1,
      })
      
      const response = await request(app)
        .post('/api/reservations')
        .send(validReservationData)
        .expect(201)
      
      expect(response.body.success).toBe(true)
      
      // Verify that commit was called
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })
  })

  describe('Performance Tests', () => {
    test('handles multiple concurrent reservation requests', async () => {
      // Mock successful responses for all requests
      mockClient.query.mockResolvedValue({
        rows: [mockTable],
        rowCount: 1,
      })
      
      const requests = Array(10).fill().map(() =>
        request(app)
          .post('/api/reservations')
          .send(validReservationData)
      )
      
      const responses = await Promise.all(requests)
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
      })
    })

    test('efficiently queries database for availability', async () => {
      // Mock database responses
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      })
      
      mockClient.query.mockResolvedValueOnce({
        rows: [mockTable],
        rowCount: 1,
      })
      
      const startTime = Date.now()
      
      await request(app)
        .get('/api/reservations/availability/2024-01-15')
        .expect(200)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      // Response should be under 100ms for availability check
      expect(responseTime).toBeLessThan(100)
    })
  })

  describe('Error Handling Tests', () => {
    test('handles malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/reservations')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid JSON')
    })

    test('handles missing content-type header', async () => {
      const response = await request(app)
        .post('/api/reservations')
        .send(validReservationData)
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Content-Type must be application/json')
    })

    test('handles database connection failures', async () => {
      mockPool.connect.mockRejectedValueOnce(new Error('Connection failed'))
      
      const response = await request(app)
        .get('/api/reservations/availability/2024-01-15')
        .expect(500)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Connection failed')
    })

    test('handles query timeout gracefully', async () => {
      mockClient.query.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 100)
        )
      )
      
      const response = await request(app)
        .get('/api/reservations/availability/2024-01-15')
        .expect(500)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Query timeout')
    })
  })
})
