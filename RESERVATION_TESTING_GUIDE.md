# 🧪 OrderFlow Reservation System Comprehensive Testing Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Test Architecture](#test-architecture)
3. [Test Categories](#test-categories)
4. [Running Tests](#running-tests)
5. [Test Coverage](#test-coverage)
6. [Default Settings Testing](#default-settings-testing)
7. [Business Logic Testing](#business-logic-testing)
8. [Performance Testing](#performance-testing)
9. [Accessibility Testing](#accessibility-testing)
10. [Error Handling Testing](#error-handling-testing)
11. [Integration Testing](#integration-testing)
12. [Test Data and Mocking](#test-data-and-mocking)
13. [Continuous Integration](#continuous-integration)
14. [Troubleshooting](#troubleshooting)
15. [Best Practices](#best-practices)

---

## 🎯 Overview

This guide covers the comprehensive testing implementation for the OrderFlow Reservation System. The testing suite covers all aspects of the reservation system including frontend components, backend APIs, admin interfaces, and business logic validation.

### What's Tested

- **Frontend**: Customer reservation interface, form validation, time slot selection
- **Backend**: Reservation API endpoints, database operations, business logic
- **Admin Dashboard**: Reservation management, table management, analytics
- **Admin Backend**: Admin API endpoints, staff operations, reporting
- **Business Logic**: Duration calculations, availability checks, conflict resolution
- **Performance**: Database queries, API response times, concurrent operations
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

---

## 🏗️ Test Architecture

### Test Structure

```
project-root/
├── frontend/
│   ├── __tests__/
│   │   └── reservation-system.test.js    # Frontend reservation tests
│   ├── jest.config.js                     # Jest configuration
│   └── jest.setup.js                      # Test setup and mocks
├── admin-dashboard/
│   ├── __tests__/
│   │   └── reservation-admin.test.js      # Admin dashboard tests
│   ├── jest.config.js                     # Jest configuration
│   └── jest.setup.js                      # Test setup and mocks
├── backend/
│   ├── __tests__/
│   │   └── reservation-backend.test.js    # Backend API tests
│   ├── jest.config.js                     # Jest configuration
│   └── jest.setup.js                      # Test setup and mocks
├── admin-backend/
│   ├── __tests__/
│   │   └── reservation-admin-backend.test.js # Admin backend tests
│   ├── jest.config.js                     # Jest configuration
│   └── jest.setup.js                      # Test setup and mocks
└── run-reservation-tests.sh               # Test runner script
```

### Testing Technologies

- **Jest**: Primary testing framework
- **React Testing Library**: Frontend component testing
- **Supertest**: Backend API testing
- **MSW**: API mocking and service worker simulation
- **Jest Extended**: Additional Jest matchers

---

## 🧪 Test Categories

### 1. Unit Tests

#### Frontend Components
- Component rendering and state management
- User interaction handling
- Form validation and submission
- Props and context usage
- Event handling and callbacks

#### Backend Services
- API endpoint functionality
- Business logic validation
- Database query execution
- Error handling and responses
- Input validation and sanitization

### 2. Integration Tests

#### API Integration
- End-to-end API testing
- Database integration
- External service integration
- Authentication and authorization
- Request/response flow

#### Component Integration
- Component interaction
- Context provider integration
- API service integration
- State management integration

### 3. Business Logic Tests

#### Reservation Logic
- Time slot availability calculation
- Table assignment algorithms
- Duration and grace period handling
- Conflict detection and resolution
- Business rule enforcement

#### Validation Logic
- Input validation rules
- Business constraint checking
- Data integrity validation
- Error condition handling

### 4. Performance Tests

#### Database Performance
- Query execution time
- Connection pool efficiency
- Transaction handling
- Concurrent operation handling

#### API Performance
- Response time measurement
- Throughput testing
- Memory usage monitoring
- Load testing scenarios

### 5. Accessibility Tests

#### ARIA Compliance
- Proper ARIA labels
- Role definitions
- State announcements
- Screen reader compatibility

#### Navigation Testing
- Keyboard navigation
- Focus management
- Tab order validation
- Skip link functionality

### 6. Error Handling Tests

#### Exception Scenarios
- Database connection failures
- Invalid input handling
- Network error simulation
- Concurrent conflict resolution
- Graceful degradation

---

## 🚀 Running Tests

### Quick Start

```bash
# Ensure Docker environment is running first
./setup.sh

# Run all reservation tests
./run-reservation-tests.sh

# Install dependencies and run all tests
./run-reservation-tests.sh --install

# Run specific test categories
./run-reservation-tests.sh --frontend
./run-reservation-tests.sh --backend
./run-reservation-tests.sh --admin-dashboard
./run-reservation-tests.sh --admin-backend
```

### Individual Component Testing

#### Frontend Tests
```bash
cd frontend
npm run test:reservation        # Reservation-specific tests
npm run test:coverage          # All tests with coverage
npm run test:watch             # Watch mode for development
```

#### Admin Dashboard Tests
```bash
cd admin-dashboard
npm run test:reservation       # Reservation admin tests
npm run test:coverage          # All tests with coverage
npm run test:watch             # Watch mode for development
```

#### Backend Tests
```bash
cd backend
npm run test:reservation       # Reservation API tests
npm run test:coverage          # All tests with coverage
npm run test:watch             # Watch mode for development
```

#### Admin Backend Tests
```bash
cd admin-backend
npm run test:reservation       # Admin reservation API tests
npm run test:coverage          # All tests with coverage
npm run test:watch             # Watch mode for development
```

### Test Runner Options

```bash
# Show help
./run-reservation-tests.sh --help

# Run specific test types
./run-reservation-tests.sh --performance
./run-reservation-tests.sh --accessibility
./run-reservation-tests.sh --integration

# Combine options
./run-reservation-tests.sh --frontend --backend --coverage
```

---

## 📊 Test Coverage

### Coverage Targets

- **Frontend**: 80%+ (Components, Hooks, Utils)
- **Backend**: 80%+ (API Endpoints, Services, Utils)
- **Admin Dashboard**: 80%+ (Components, Pages, Utils)
- **Admin Backend**: 80%+ (API Endpoints, Services, Utils)

### Coverage Reports

After running tests, coverage reports are generated in:

```
frontend/coverage/lcov-report/index.html
admin-dashboard/coverage/lcov-report/index.html
backend/coverage/lcov-report/index.html
admin-backend/coverage/lcov-report/index.html
```

### Coverage Categories

- **Statements**: Code execution coverage
- **Branches**: Conditional logic coverage
- **Functions**: Function call coverage
- **Lines**: Line-by-line coverage

---

## ⚙️ Default Settings Testing

### Reservation Duration Settings

The system tests the following default configurations:

#### Time Parameters
- **Dining Time**: 90 minutes
- **Buffer Time**: 15 minutes
- **Total Slot**: 105 minutes
- **Grace Period**: 15 minutes
- **Max Sitting**: 120 minutes

#### Business Hours
- **Lunch Service**: 12:00 PM - 3:00 PM
- **Dinner Service**: 7:00 PM - 10:30 PM
- **Time Slots**: 30-minute intervals
- **Last Seating**: 10:00 PM

#### Table Constraints
- **Capacity Range**: 2-20 guests
- **Minimum Party**: 1 guest
- **Advance Booking**: Up to 30 days
- **Same-day Cutoff**: 2 hours before

### Test Scenarios

#### Duration Calculation Tests
```javascript
test('calculates reservation end time correctly', () => {
  // 19:00 + 105 minutes = 20:45
  expect(reservation.reservationEndTime).toBe('20:45:00')
  expect(reservation.durationMinutes).toBe(105)
})
```

#### Grace Period Tests
```javascript
test('detects late arrival correctly', () => {
  // Arrival at 19:20 (20 minutes late)
  expect(response.body.isOnTime).toBe(false)
  expect(response.body.delayMinutes).toBe(20)
  expect(response.body.newStatus).toBe('late_arrival')
})
```

#### Time Slot Validation Tests
```javascript
test('prevents reservations outside business hours', () => {
  const outsideHoursData = {
    reservation_time: '23:00:00' // After closing
  }
  expect(response.body.error).toContain('outside business hours')
})
```

---

## 🧠 Business Logic Testing

### Availability Calculation

#### Overlap Detection
```javascript
test('prevents overlapping reservations on same table', () => {
  // Existing reservation: 19:00-20:45
  // New reservation: 19:30 (overlaps)
  expect(response.body.error).toContain('Table not available')
})
```

#### Table Assignment Logic
```javascript
test('assigns table based on guest count and availability', () => {
  // 4 guests should get table with capacity >= 4
  expect(response.body.reservation.tableCapacity).toBeGreaterThanOrEqual(4)
})
```

### Validation Rules

#### Guest Count Limits
```javascript
test('enforces guest count limits', () => {
  // Below minimum
  expect(guestInput.value).toBe('1') // Should default to minimum
  
  // Above maximum
  expect(guestInput.value).toBe('20') // Should cap at maximum
})
```

#### Date Validation
```javascript
test('validates date format and future dates', () => {
  const pastDateData = {
    reservation_date: '2020-01-15' // Past date
  }
  expect(response.body.error).toContain('future date')
})
```

### Business Rule Enforcement

#### Advance Booking Limits
```javascript
test('enforces advance booking limits', () => {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 31) // 31 days in future
  
  expect(response.body.error).toContain('30 days in advance')
})
```

#### Capacity Constraints
```javascript
test('enforces maximum reservation capacity per table', () => {
  // Table already has 4 guests at 19:00
  // Cannot add another 4 guests at same time
  expect(response.body.error).toContain('Table not available')
})
```

---

## ⚡ Performance Testing

### Database Performance

#### Query Efficiency
```javascript
test('efficiently queries database for availability', () => {
  const startTime = Date.now()
  
  await request(app)
    .get('/api/reservations/availability/2024-01-15')
    .expect(200)
  
  const endTime = Date.now()
  const responseTime = endTime - startTime
  
  // Response should be under 100ms for availability check
  expect(responseTime).toBeLessThan(100)
})
```

#### Concurrent Operations
```javascript
test('handles multiple concurrent reservation requests', async () => {
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
```

### API Performance

#### Response Time Testing
```javascript
test('maintains performance with large datasets', async () => {
  // Mock large dataset (1000 reservations)
  const largeReservationsList = Array(1000).fill().map(/* ... */)
  
  const startTime = Date.now()
  
  const response = await request(app)
    .get('/api/admin/reservations?page=1&limit=50')
    .expect(200)
  
  const endTime = Date.now()
  const responseTime = endTime - startTime
  
  // Response should be under 200ms for large datasets
  expect(responseTime).toBeLessThan(200)
})
```

---

## ♿ Accessibility Testing

### ARIA Compliance

#### Label Testing
```javascript
test('has proper ARIA labels', () => {
  expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/invitados/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
})
```

#### Role Testing
```javascript
test('has proper ARIA roles', () => {
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
})
```

### Keyboard Navigation

#### Tab Order Testing
```javascript
test('supports keyboard navigation', async () => {
  const user = userEvent.setup()
  
  // Tab through form elements
  await user.tab()
  expect(screen.getByLabelText(/fecha/i)).toHaveFocus()
  
  await user.tab()
  expect(screen.getByLabelText(/invitados/i)).toHaveFocus()
})
```

#### Focus Management
```javascript
test('manages focus correctly', () => {
  // Modal should trap focus
  const modal = screen.getByRole('dialog')
  expect(modal).toHaveAttribute('aria-modal', 'true')
})
```

### Screen Reader Support

#### Loading States
```javascript
test('shows loading states for screen readers', async () => {
  // Should have aria-live for loading state
  const loadingElement = screen.getByText(/cargando/i)
  expect(loadingElement).toHaveAttribute('aria-live', 'polite')
})
```

#### Status Announcements
```javascript
test('announces status changes', () => {
  // Status changes should be announced
  const statusElement = screen.getByText(/status/i)
  expect(statusElement).toHaveAttribute('aria-live', 'polite')
})
```

---

## 🚨 Error Handling Testing

### Database Errors

#### Connection Failures
```javascript
test('handles database connection failures', async () => {
  mockPool.connect.mockRejectedValueOnce(new Error('Connection failed'))
  
  const response = await request(app)
    .get('/api/reservations/availability/2024-01-15')
    .expect(500)
  
  expect(response.body.success).toBe(false)
  expect(response.body.error).toContain('Connection failed')
})
```

#### Query Failures
```javascript
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
```

### Input Validation Errors

#### Malformed Data
```javascript
test('handles malformed JSON gracefully', async () => {
  const response = await request(app)
    .post('/api/reservations')
    .set('Content-Type', 'application/json')
    .send('invalid json')
    .expect(400)
  
  expect(response.body.success).toBe(false)
  expect(response.body.error).toContain('Invalid JSON')
})
```

#### Missing Headers
```javascript
test('handles missing content-type header', async () => {
  const response = await request(app)
    .post('/api/reservations')
    .send(validReservationData)
    .expect(400)
  
  expect(response.body.success).toBe(false)
  expect(response.body.error).toContain('Content-Type must be application/json')
})
```

### Concurrent Conflicts

#### Race Conditions
```javascript
test('handles concurrent reservation conflicts', async () => {
  // Mock that table becomes unavailable between check and insert
  mockClient.query.mockResolvedValueOnce({
    rows: [mockTable],
    rowCount: 1,
  })
  
  mockClient.query.mockRejectedValueOnce(new Error('Table already reserved'))
  
  const response = await request(app)
    .post('/api/reservations')
    .send(validReservationData)
    .expect(409)
  
  expect(response.body.success).toBe(false)
  expect(response.body.error).toContain('Table already reserved')
})
```

---

## 🔗 Integration Testing

### API Integration

#### End-to-End Flow
```javascript
test('complete reservation flow works end-to-end', async () => {
  // 1. Check availability
  const availabilityResponse = await request(app)
    .get('/api/reservations/availability/2024-01-15')
    .expect(200)
  
  // 2. Create reservation
  const reservationResponse = await request(app)
    .post('/api/reservations')
    .send(validReservationData)
    .expect(201)
  
  // 3. Verify reservation exists
  const getResponse = await request(app)
    .get(`/api/reservations/${reservationResponse.body.reservation.id}`)
    .expect(200)
  
  expect(getResponse.body.reservation.id).toBe(reservationResponse.body.reservation.id)
})
```

#### Database Integration
```javascript
test('reservation data is properly stored in database', async () => {
  // Create reservation
  const createResponse = await request(app)
    .post('/api/reservations')
    .send(validReservationData)
    .expect(201)
  
  // Verify database record
  const dbRecord = await mockClient.query.mock.results[0].value
  expect(dbRecord.rows[0].customer_name).toBe(validReservationData.customer_name)
  expect(dbRecord.rows[0].reservation_end_time).toBe('20:45:00')
})
```

### Component Integration

#### Context Integration
```javascript
test('components integrate with auth context', () => {
  const authenticatedContext = {
    isAuthenticated: true,
    user: { firstName: 'John', lastName: 'Doe' }
  }
  
  renderWithAuth(<ReservationSystem />, authenticatedContext)
  
  // Should pre-fill user data
  expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
})
```

#### API Service Integration
```javascript
test('components use API services correctly', async () => {
  const user = userEvent.setup()
  
  // Select date should trigger API call
  const dateInput = screen.getByLabelText(/fecha/i)
  await user.type(dateInput, '2024-01-15')
  
  await waitFor(() => {
    expect(api.reservations.getAvailability).toHaveBeenCalledWith('2024-01-15')
  })
})
```

---

## 🎭 Test Data and Mocking

### Mock Data Structure

#### Reservation Mock
```javascript
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
  updated_at: '2024-01-01T00:00:00Z'
}
```

#### Table Mock
```javascript
const mockTable = {
  id: 2,
  table_number: 2,
  name: 'Table 2',
  capacity: 4,
  min_party_size: 2,
  is_active: true,
  table_type: 'standard',
  location_description: 'Near window'
}
```

### Mocking Strategies

#### API Mocking
```javascript
// Mock the API module
jest.mock('../lib/api', () => ({
  reservations: {
    getAvailability: jest.fn(),
    create: jest.fn(),
  },
}))

// Setup mock responses
beforeEach(() => {
  api.reservations.getAvailability.mockResolvedValue({
    success: true,
    data: mockAvailableSlots,
  })
  api.reservations.create.mockResolvedValue(mockReservationResponse)
})
```

#### Database Mocking
```javascript
// Mock PostgreSQL
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  })),
}))

// Setup mock client
beforeEach(() => {
  mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  }
  mockPool.connect.mockResolvedValue(mockClient)
})
```

#### Component Mocking
```javascript
// Mock external components
jest.mock('../components/CAPTCHA', () => {
  return function MockCAPTCHA({ onVerify }) {
    return (
      <div data-testid="captcha">
        <button onClick={() => onVerify('test-captcha-token')}>
          Verify CAPTCHA
        </button>
      </div>
    )
  }
})
```

---

## 🔄 Continuous Integration

### CI/CD Pipeline

#### GitHub Actions Example
```yaml
name: Reservation System Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        cd frontend && npm ci
        cd ../admin-dashboard && npm ci
        cd ../backend && npm ci
        cd ../admin-backend && npm ci
    
    - name: Run frontend tests
      run: cd frontend && npm run test:coverage
    
    - name: Run admin dashboard tests
      run: cd admin-dashboard && npm run test:coverage
    
    - name: Run backend tests
      run: cd backend && npm run test:coverage
    
    - name: Run admin backend tests
      run: cd admin-backend && npm run test:coverage
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v2
```

### Test Automation

#### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:quick",
      "pre-push": "npm run test:coverage"
    }
  }
}
```

#### Scheduled Testing
```yaml
# Run tests daily at 2 AM
on:
  schedule:
    - cron: '0 2 * * *'
```

---

## 🛠️ Troubleshooting

### Common Issues

#### Test Environment Setup
```bash
# Use automated setup to reset everything
./setup.sh

# Clear Jest cache if needed
npm run test -- --clearCache

# Reset node_modules if needed
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version
npm --version
```

#### Database Connection Issues
```bash
# Check if all services are running and healthy
docker-compose ps

# Restart database
docker-compose restart db

# Check database logs
docker-compose logs db

# Full restart if needed
docker-compose down && ./setup.sh
```

#### Test Failures
```bash
# Run tests with verbose output
npm run test -- --verbose

# Run specific failing test
npm run test -- --testNamePattern="specific test name"

# Debug Jest configuration
npm run test -- --showConfig
```

### Performance Issues

#### Slow Test Execution
```bash
# Run tests in parallel
npm run test -- --maxWorkers=4

# Use Jest cache
npm run test -- --cache

# Profile test execution
npm run test -- --verbose --detectOpenHandles
```

#### Memory Issues
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run test

# Run tests with garbage collection
npm run test -- --runInBand --logHeapUsage
```

---

## 📚 Best Practices

### Test Organization

#### File Naming
- Use descriptive test file names: `reservation-system.test.js`
- Group related tests in describe blocks
- Use clear test names that explain the scenario

#### Test Structure
```javascript
describe('ReservationSystem Component', () => {
  describe('Initial Rendering', () => {
    test('renders reservation system with initial step', () => {
      // Test implementation
    })
  })
  
  describe('User Interaction', () => {
    test('allows user to select a date', async () => {
      // Test implementation
    })
  })
})
```

### Mocking Best Practices

#### Minimal Mocking
```javascript
// Good: Mock only what's necessary
jest.mock('../lib/api', () => ({
  reservations: { getAvailability: jest.fn() }
}))

// Avoid: Over-mocking
jest.mock('react', () => ({ ...jest.requireActual('react') }))
```

#### Consistent Mock Data
```javascript
// Use factory functions for mock data
const createMockReservation = (overrides = {}) => ({
  id: 1,
  customer_name: 'John Doe',
  // ... other defaults
  ...overrides
})

// Use in tests
const reservation = createMockReservation({ status: 'cancelled' })
```

### Assertion Best Practices

#### Specific Assertions
```javascript
// Good: Specific assertions
expect(response.body.reservation.customer_name).toBe('John Doe')
expect(response.body.reservation.duration_minutes).toBe(105)

// Avoid: Generic assertions
expect(response.body).toBeDefined()
expect(response.status).toBe(200)
```

#### Async Testing
```javascript
// Good: Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Reservation confirmed')).toBeInTheDocument()
})

// Avoid: Arbitrary timeouts
await new Promise(resolve => setTimeout(resolve, 1000))
```

### Coverage Best Practices

#### Meaningful Coverage
- Aim for 80%+ coverage but focus on critical paths
- Test business logic thoroughly
- Don't test implementation details
- Focus on user-facing functionality

#### Coverage Exclusions
```javascript
// Exclude test files and utilities from coverage
collectCoverageFrom: [
  'components/**/*.{js,jsx}',
  '!**/*.test.{js,jsx}',
  '!**/test-utils/**',
  '!**/coverage/**'
]
```

---

## 🎉 Conclusion

This comprehensive testing guide covers all aspects of testing the OrderFlow Reservation System. By following these practices and running the provided test suite, you can ensure:

- **Reliability**: All components work as expected
- **Performance**: System meets performance requirements
- **Accessibility**: System is usable by all users
- **Maintainability**: Code changes don't break existing functionality
- **Quality**: High test coverage and thorough validation

### Next Steps

1. **Run the test suite**: Use `./run-reservation-tests.sh` to execute all tests
2. **Review coverage reports**: Identify areas needing additional testing
3. **Integrate with CI/CD**: Automate testing in your deployment pipeline
4. **Monitor test performance**: Optimize slow tests and improve execution time
5. **Add edge cases**: Expand test coverage based on real-world usage patterns

### Support

For questions or issues with the testing suite:

- Check the troubleshooting section above
- Review Jest and Testing Library documentation
- Consult the test runner script help: `./run-reservation-tests.sh --help`
- Review generated test reports for detailed information

---

**Happy Testing! 🧪✨**

*This guide covers the complete testing implementation for the OrderFlow Reservation System. For technical support, contact the development team.*
