const request = require('supertest')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { Pool } = require('pg')

// Mock the database pool
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  })),
}))

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.NODE_ENV = 'test'

// Import the app after mocking
let app
let mockPool

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset mock pool
    mockPool = {
      connect: jest.fn(),
      query: jest.fn(),
      end: jest.fn(),
    }
    Pool.mockImplementation(() => mockPool)
    
    // Import app after mocking
    delete require.cache[require.resolve('../server')]
    app = require('../server')
  })

  afterEach(() => {
    jest.resetModules()
  })

  describe('POST /api/auth/register', () => {
    const validUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      password: 'Password123'
    }

    test('registers new user successfully', async () => {
      // Mock database responses
      mockPool.query
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            created_at: new Date(),
            updated_at: new Date()
          }],
          rowCount: 1
        })

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.user.email).toBe('john@example.com')
      expect(response.body.data.user.firstName).toBe('John')
      expect(response.body.data.user.lastName).toBe('Doe')
    })

    test('returns error for existing email', async () => {
      // Mock database to return existing user
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'john@example.com' }],
        rowCount: 1
      })

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('already exists')
    })

    test('validates required fields', async () => {
      const invalidData = {
        firstName: '',
        lastName: '',
        email: 'invalid-email',
        phone: '',
        password: '123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('validation')
    })

    test('validates email format', async () => {
      const invalidEmailData = {
        ...validUserData,
        email: 'invalid-email-format'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidEmailData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('email')
    })

    test('validates phone format', async () => {
      const invalidPhoneData = {
        ...validUserData,
        phone: '123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidPhoneData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('phone')
    })

    test('validates password strength', async () => {
      const weakPasswordData = {
        ...validUserData,
        password: 'weak'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('password')
    })

    test('handles database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'))

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Internal server error')
    })

    test('hashes password before storing', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            created_at: new Date(),
            updated_at: new Date()
          }],
          rowCount: 1
        })

      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201)

      // Check that password was hashed
      const insertCall = mockPool.query.mock.calls.find(call => 
        call[0].includes('INSERT INTO users')
      )
      expect(insertCall).toBeDefined()
      
      const hashedPassword = insertCall[1][4] // password is 5th parameter
      expect(hashedPassword).not.toBe('Password123')
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d{1,2}\$/)
    })
  })

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'john@example.com',
      password: 'Password123'
    }

    test('logs in user successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123', 10)
      
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          password_hash: hashedPassword,
          created_at: new Date(),
          updated_at: new Date()
        }],
        rowCount: 1
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.user.email).toBe('john@example.com')
    })

    test('returns error for non-existent user', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid credentials')
    })

    test('returns error for incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('WrongPassword', 10)
      
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          password_hash: hashedPassword,
          created_at: new Date(),
          updated_at: new Date()
        }],
        rowCount: 1
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid credentials')
    })

    test('validates required fields', async () => {
      const invalidData = {
        email: '',
        password: ''
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('validation')
    })

    test('validates email format', async () => {
      const invalidEmailData = {
        email: 'invalid-email',
        password: 'Password123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidEmailData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('email')
    })

    test('handles database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'))

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Internal server error')
    })

    test('generates valid JWT token', async () => {
      const hashedPassword = await bcrypt.hash('Password123', 10)
      
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          password_hash: hashedPassword,
          created_at: new Date(),
          updated_at: new Date()
        }],
        rowCount: 1
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(200)

      const token = response.body.data.token
      expect(token).toBeDefined()
      
      // Verify token can be decoded
      const decoded = jwt.verify(token, 'test-jwt-secret')
      expect(decoded.id).toBe(1)
      expect(decoded.email).toBe('john@example.com')
    })
  })

  describe('GET /api/auth/profile', () => {
    const validToken = jwt.sign(
      { id: 1, email: 'john@example.com' },
      'test-jwt-secret',
      { expiresIn: '1h' }
    )

    test('returns user profile with valid token', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          created_at: new Date(),
          updated_at: new Date()
        }],
        rowCount: 1
      })

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.user.email).toBe('john@example.com')
      expect(response.body.data.user.firstName).toBe('John')
      expect(response.body.data.user.lastName).toBe('Doe')
    })

    test('returns error without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('No token provided')
    })

    test('returns error with invalid token', async () => {
      const invalidToken = 'invalid-token'

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid token')
    })

    test('returns error with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: 1, email: 'john@example.com' },
        'test-jwt-secret',
        { expiresIn: '0s' }
      )

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Token expired')
    })

    test('returns error for non-existent user', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      })

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('User not found')
    })

    test('handles database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'))

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Internal server error')
    })
  })

  describe('PUT /api/auth/profile', () => {
    const validToken = jwt.sign(
      { id: 1, email: 'john@example.com' },
      'test-jwt-secret',
      { expiresIn: '1h' }
    )

    const validUpdateData = {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+0987654321'
    }

    test('updates user profile successfully', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            created_at: new Date(),
            updated_at: new Date()
          }],
          rowCount: 1
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'john@example.com',
            phone: '+0987654321',
            created_at: new Date(),
            updated_at: new Date()
          }],
          rowCount: 1
        })

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send(validUpdateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.firstName).toBe('Jane')
      expect(response.body.data.user.lastName).toBe('Smith')
      expect(response.body.data.user.phone).toBe('+0987654321')
    })

    test('returns error without token', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send(validUpdateData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('No token provided')
    })

    test('validates update data', async () => {
      const invalidData = {
        firstName: '',
        lastName: '',
        phone: 'invalid-phone'
      }

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('validation')
    })

    test('prevents email update', async () => {
      const updateDataWithEmail = {
        ...validUpdateData,
        email: 'newemail@example.com'
      }

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateDataWithEmail)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Email cannot be changed')
    })

    test('handles database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'))

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send(validUpdateData)
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Internal server error')
    })
  })

  describe('POST /api/auth/logout', () => {
    const validToken = jwt.sign(
      { id: 1, email: 'john@example.com' },
      'test-jwt-secret',
      { expiresIn: '1h' }
    )

    test('logs out user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('logged out')
    })

    test('returns error without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('No token provided')
    })

    test('returns error with invalid token', async () => {
      const invalidToken = 'invalid-token'

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid token')
    })
  })

  describe('POST /api/auth/change-password', () => {
    const validToken = jwt.sign(
      { id: 1, email: 'john@example.com' },
      'test-jwt-secret',
      { expiresIn: '1h' }
    )

    const validPasswordData = {
      currentPassword: 'Password123',
      newPassword: 'NewPassword456'
    }

    test('changes password successfully', async () => {
      const hashedCurrentPassword = await bcrypt.hash('Password123', 10)
      
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            password_hash: hashedCurrentPassword
          }],
          rowCount: 1
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            created_at: new Date(),
            updated_at: new Date()
          }],
          rowCount: 1
        })

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send(validPasswordData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Password changed')
    })

    test('returns error for incorrect current password', async () => {
      const hashedWrongPassword = await bcrypt.hash('WrongPassword', 10)
      
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          password_hash: hashedWrongPassword
        }],
        rowCount: 1
      })

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send(validPasswordData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Current password is incorrect')
    })

    test('validates new password strength', async () => {
      const weakPasswordData = {
        currentPassword: 'Password123',
        newPassword: 'weak'
      }

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send(weakPasswordData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('password')
    })

    test('returns error without token', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send(validPasswordData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('No token provided')
    })

    test('handles database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'))

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send(validPasswordData)
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Internal server error')
    })
  })

  describe('Middleware Tests', () => {
    test('authenticateToken middleware works correctly', async () => {
      const validToken = jwt.sign(
        { id: 1, email: 'john@example.com' },
        'test-jwt-secret',
        { expiresIn: '1h' }
      )

      // Test a protected endpoint
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    test('authenticateToken middleware rejects invalid tokens', async () => {
      const invalidToken = 'invalid-token'

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid token')
    })

    test('authenticateToken middleware rejects expired tokens', async () => {
      const expiredToken = jwt.sign(
        { id: 1, email: 'john@example.com' },
        'test-jwt-secret',
        { expiresIn: '0s' }
      )

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Token expired')
    })
  })
})
