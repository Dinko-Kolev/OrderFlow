require('jest-extended')

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.STRIPE_SECRET_KEY = 'test-stripe-secret-key'
process.env.EMAIL_HOST = 'test-email-host'
process.env.EMAIL_USER = 'test-email-user'
process.env.EMAIL_PASS = 'test-email-pass'

// Mock console methods in tests
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}

// Global test timeout
jest.setTimeout(10000)

// Mock pg (PostgreSQL)
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  })),
}))

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn((password, hash) => Promise.resolve(hash === `hashed_${password}`)),
}))

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret) => `token_${payload.id}_${secret}`),
  verify: jest.fn((token, secret) => {
    if (token.startsWith('token_')) {
      return { id: token.split('_')[1] }
    }
    throw new Error('Invalid token')
  }),
}))

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-message-id' })),
    verify: jest.fn(() => Promise.resolve(true)),
  })),
}))

// Mock stripe
jest.mock('stripe', () => jest.fn(() => ({
  paymentIntents: {
    create: jest.fn(() => Promise.resolve({ id: 'pi_test_123', client_secret: 'pi_test_secret_123' })),
    retrieve: jest.fn(() => Promise.resolve({ id: 'pi_test_123', status: 'succeeded' })),
  },
  customers: {
    create: jest.fn(() => Promise.resolve({ id: 'cus_test_123' })),
  },
})))

// Mock socket.io
jest.mock('socket.io', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
  })),
}))

// Mock helmet
jest.mock('helmet', () => jest.fn())

// Mock express-rate-limit
jest.mock('express-rate-limit', () => jest.fn(() => (req, res, next) => next()))

// Global test utilities
global.testUtils = {
  // Helper to create mock database responses
  createMockDbResponse: (rows = [], rowCount = 0) => ({
    rows,
    rowCount,
    command: 'SELECT',
    oid: null,
    fields: [],
  }),

  // Helper to create mock user data
  createMockUser: (overrides = {}) => ({
    id: 1,
    email: 'test@example.com',
    phone: '+1234567890',
    first_name: 'Test',
    last_name: 'User',
    password_hash: 'hashed_password',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }),

  // Helper to create mock reservation data
  createMockReservation: (overrides = {}) => ({
    id: 1,
    user_id: 1,
    customer_name: 'Test Customer',
    customer_email: 'customer@example.com',
    customer_phone: '+1234567890',
    reservation_date: '2024-01-15',
    reservation_time: '19:00:00',
    number_of_guests: 4,
    special_requests: 'Window table preferred',
    table_id: 1,
    status: 'confirmed',
    duration_minutes: 105,
    grace_period_minutes: 15,
    max_sitting_minutes: 120,
    reservation_end_time: '20:45:00',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }),

  // Helper to create mock table data
  createMockTable: (overrides = {}) => ({
    id: 1,
    table_number: 1,
    name: 'Table 1',
    capacity: 4,
    min_party_size: 2,
    is_active: true,
    table_type: 'standard',
    location_description: 'Near entrance',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }),

  // Helper to create mock admin user data
  createMockAdminUser: (overrides = {}) => ({
    id: 1,
    email: 'admin@example.com',
    phone: '+1234567890',
    first_name: 'Admin',
    last_name: 'User',
    password_hash: 'hashed_password',
    role: 'admin',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }),
}
