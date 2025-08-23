import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReservationSystem from '../components/ReservationSystem'
import { AuthContext } from '../contexts/AuthContext'

// Mock the API module
jest.mock('../lib/api', () => ({
  reservations: {
    getAvailability: jest.fn(),
    create: jest.fn(),
  },
}))

// Mock CAPTCHA component
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

// Mock the AuthContext
const mockAuthContext = {
  isAuthenticated: false,
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
}

// Test data
const mockAvailableSlots = [
  { time: '12:00', available: true, availableTables: [1, 2, 3] },
  { time: '12:30', available: true, availableTables: [1, 3] },
  { time: '13:00', available: false, availableTables: [] },
  { time: '19:00', available: true, availableTables: [1, 2, 3, 4, 5] },
  { time: '19:30', available: true, availableTables: [2, 3, 4] },
  { time: '20:00', available: true, availableTables: [1, 2, 3] },
]

const mockReservationResponse = {
  success: true,
  reservation: {
    id: 123,
    tableNumber: 5,
    reservationEndTime: '20:45:00',
    durationMinutes: 105,
  },
}

// Helper function to render with context
const renderWithAuth = (ui, contextValue = mockAuthContext) => {
  return render(
    <AuthContext.Provider value={contextValue}>
      {ui}
    </AuthContext.Provider>
  )
}

describe('ReservationSystem Component', () => {
  let api

  beforeEach(() => {
    api = require('../lib/api')
    jest.clearAllMocks()
    
    // Default API mock responses
    api.reservations.getAvailability.mockResolvedValue({
      success: true,
      data: mockAvailableSlots,
    })
    api.reservations.create.mockResolvedValue(mockReservationResponse)
  })

  describe('Initial Rendering', () => {
    test('renders reservation system with initial step', () => {
      renderWithAuth(<ReservationSystem />)
      
      expect(screen.getByText('Fecha y Hora')).toBeInTheDocument()
      expect(screen.getByText('Detalles')).toBeInTheDocument()
      expect(screen.getByText('Confirmación')).toBeInTheDocument()
      expect(screen.getByText('📅')).toBeInTheDocument()
    })

    test('shows date and time selection as first step', () => {
      renderWithAuth(<ReservationSystem />)
      
      expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument()
      expect(screen.getByText('12:00')).toBeInTheDocument()
      expect(screen.getByText('19:00')).toBeInTheDocument()
    })

    test('displays all available time slots', () => {
      renderWithAuth(<ReservationSystem />)
      
      // Check for lunch slots
      expect(screen.getByText('12:00')).toBeInTheDocument()
      expect(screen.getByText('12:30')).toBeInTheDocument()
      expect(screen.getByText('13:00')).toBeInTheDocument()
      expect(screen.getByText('14:00')).toBeInTheDocument()
      expect(screen.getByText('14:30')).toBeInTheDocument()
      
      // Check for dinner slots
      expect(screen.getByText('19:00')).toBeInTheDocument()
      expect(screen.getByText('19:30')).toBeInTheDocument()
      expect(screen.getByText('20:00')).toBeInTheDocument()
      expect(screen.getByText('20:30')).toBeInTheDocument()
      expect(screen.getByText('21:00')).toBeInTheDocument()
      expect(screen.getByText('21:30')).toBeInTheDocument()
      expect(screen.getByText('22:00')).toBeInTheDocument()
    })
  })

  describe('Date and Time Selection', () => {
    test('allows user to select a date', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      expect(dateInput.value).toBe('2024-01-15')
    })

    test('fetches availability when date is selected', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      await waitFor(() => {
        expect(api.reservations.getAvailability).toHaveBeenCalledWith('2024-01-15')
      })
    })

    test('shows loading state while fetching availability', async () => {
      // Mock a delayed response
      api.reservations.getAvailability.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: mockAvailableSlots,
        }), 100))
      )
      
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      // Should show loading state
      expect(screen.getByText(/cargando/i)).toBeInTheDocument()
    })

    test('allows user to select an available time slot', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      // Select a date first
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      await waitFor(() => {
        expect(api.reservations.getAvailability).toHaveBeenCalled()
      })
      
      // Select an available time slot
      const timeSlot = screen.getByText('19:00')
      await user.click(timeSlot)
      
      expect(timeSlot).toHaveClass('selected')
    })

    test('prevents selection of unavailable time slots', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      // Select a date first
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      await waitFor(() => {
        expect(api.reservations.getAvailability).toHaveBeenCalled()
      })
      
      // Try to select an unavailable time slot
      const unavailableSlot = screen.getByText('13:00')
      expect(unavailableSlot).toHaveClass('unavailable')
      
      await user.click(unavailableSlot)
      expect(unavailableSlot).not.toHaveClass('selected')
    })

    test('resets time selection when date changes', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      // Select a date and time
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      await waitFor(() => {
        expect(api.reservations.getAvailability).toHaveBeenCalled()
      })
      
      const timeSlot = screen.getByText('19:00')
      await user.click(timeSlot)
      expect(timeSlot).toHaveClass('selected')
      
      // Change date
      await user.clear(dateInput)
      await user.type(dateInput, '2024-01-16')
      
      // Time selection should be reset
      expect(timeSlot).not.toHaveClass('selected')
    })
  })

  describe('Guest Count Selection', () => {
    test('allows user to select number of guests', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      const guestInput = screen.getByLabelText(/invitados/i)
      await user.clear(guestInput)
      await user.type(guestInput, '6')
      
      expect(guestInput.value).toBe('6')
    })

    test('enforces minimum guest count of 1', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      const guestInput = screen.getByLabelText(/invitados/i)
      await user.clear(guestInput)
      await user.type(guestInput, '0')
      
      // Should not allow 0 guests
      expect(guestInput.value).toBe('2') // Default value
    })

    test('enforces maximum guest count of 20', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      const guestInput = screen.getByLabelText(/invitados/i)
      await user.clear(guestInput)
      await user.type(guestInput, '25')
      
      // Should cap at 20
      expect(guestInput.value).toBe('20')
    })

    test('shows guest count validation message', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      const guestInput = screen.getByLabelText(/invitados/i)
      await user.clear(guestInput)
      await user.type(guestInput, '0')
      
      expect(screen.getByText(/mínimo 1 invitado/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    test('requires all mandatory fields to be filled', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      // Try to proceed without filling required fields
      const nextButton = screen.getByText(/siguiente/i)
      await user.click(nextButton)
      
      // Should show validation errors
      expect(screen.getByText(/fecha es requerida/i)).toBeInTheDocument()
      expect(screen.getByText(/hora es requerida/i)).toBeInTheDocument()
    })

    test('validates email format', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      // Fill required fields first
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      await waitFor(() => {
        expect(api.reservations.getAvailability).toHaveBeenCalled()
      })
      
      const timeSlot = screen.getByText('19:00')
      await user.click(timeSlot)
      
      // Try to proceed to next step
      const nextButton = screen.getByText(/siguiente/i)
      await user.click(nextButton)
      
      // Fill invalid email
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'invalid-email')
      
      // Should show email validation error
      expect(screen.getByText(/email válido/i)).toBeInTheDocument()
    })

    test('validates phone number format', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      // Fill required fields first
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      await waitFor(() => {
        expect(api.reservations.getAvailability).toHaveBeenCalled()
      })
      
      const timeSlot = screen.getByText('19:00')
      await user.click(timeSlot)
      
      // Try to proceed to next step
      const nextButton = screen.getByText(/siguiente/i)
      await user.click(nextButton)
      
      // Fill invalid phone
      const phoneInput = screen.getByLabelText(/teléfono/i)
      await user.type(phoneInput, '123')
      
      // Should show phone validation error
      expect(screen.getByText(/teléfono válido/i)).toBeInTheDocument()
    })
  })

  describe('Step Navigation', () => {
    test('allows navigation to next step when validation passes', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      // Fill required fields
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      await waitFor(() => {
        expect(api.reservations.getAvailability).toHaveBeenCalled()
      })
      
      const timeSlot = screen.getByText('19:00')
      await user.click(timeSlot)
      
      // Navigate to next step
      const nextButton = screen.getByText(/siguiente/i)
      await user.click(nextButton)
      
      // Should be on details step
      expect(screen.getByText('Detalles')).toBeInTheDocument()
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    test('allows navigation back to previous step', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      // Fill required fields and go to next step
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      await waitFor(() => {
        expect(api.reservations.getAvailability).toHaveBeenCalled()
      })
      
      const timeSlot = screen.getByText('19:00')
      await user.click(timeSlot)
      
      const nextButton = screen.getByText(/siguiente/i)
      await user.click(nextButton)
      
      // Go back
      const backButton = screen.getByText(/anterior/i)
      await user.click(backButton)
      
      // Should be back on first step
      expect(screen.getByText('Fecha y Hora')).toBeInTheDocument()
      expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument()
    })

    test('shows progress indicator with current step highlighted', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      // First step should be active
      const firstStep = screen.getByText('Fecha y Hora').closest('div')
      expect(firstStep).toHaveClass('active')
      
      // Fill required fields and go to next step
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      await waitFor(() => {
        expect(api.reservations.getAvailability).toHaveBeenCalled()
      })
      
      const timeSlot = screen.getByText('19:00')
      await user.click(timeSlot)
      
      const nextButton = screen.getByText(/siguiente/i)
      await user.click(nextButton)
      
      // Second step should be active
      const secondStep = screen.getByText('Detalles').closest('div')
      expect(secondStep).toHaveClass('active')
      expect(firstStep).not.toHaveClass('active')
    })
  })

  describe('Reservation Creation', () => {
    test('creates reservation with correct data', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      // Fill all required fields
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      await waitFor(() => {
        expect(api.reservations.getAvailability).toHaveBeenCalled()
      })
      
      const timeSlot = screen.getByText('19:00')
      await user.click(timeSlot)
      
      const nextButton = screen.getByText(/siguiente/i)
      await user.click(nextButton)
      
      // Fill customer details
      const nameInput = screen.getByLabelText(/nombre/i)
      await user.type(nameInput, 'John Doe')
      
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'john@example.com')
      
      const phoneInput = screen.getByLabelText(/teléfono/i)
      await user.type(phoneInput, '+1234567890')
      
      // Go to confirmation step
      const nextButton2 = screen.getByText(/siguiente/i)
      await user.click(nextButton2)
      
      // Verify CAPTCHA
      const captchaButton = screen.getByText('Verify CAPTCHA')
      await user.click(captchaButton)
      
      // Submit reservation
      const submitButton = screen.getByText(/confirmar reserva/i)
      await user.click(submitButton)
      
      // Verify API call
      expect(api.reservations.create).toHaveBeenCalledWith({
        date: '2024-01-15',
        time: '19:00',
        guests: 2,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        specialRequests: '',
      })
    })

    test('shows success message after reservation creation', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      // Complete the reservation flow
      // ... (similar to previous test)
      
      // Submit reservation
      const submitButton = screen.getByText(/confirmar reserva/i)
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/reserva confirmada/i)).toBeInTheDocument()
        expect(screen.getByText(/mesa 5/i)).toBeInTheDocument()
        expect(screen.getByText(/20:45/i)).toBeInTheDocument()
      })
    })

    test('handles reservation creation errors', async () => {
      // Mock API error
      api.reservations.create.mockRejectedValue(new Error('Network error'))
      
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      // Complete the reservation flow
      // ... (similar to previous test)
      
      // Submit reservation
      const submitButton = screen.getByText(/confirmar reserva/i)
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/error al crear la reserva/i)).toBeInTheDocument()
      })
    })
  })

  describe('Authenticated User Experience', () => {
    test('pre-fills user data for authenticated users', () => {
      const authenticatedContext = {
        ...mockAuthContext,
        isAuthenticated: true,
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
      }
      
      renderWithAuth(<ReservationSystem />, authenticatedContext)
      
      // Check if user data is pre-filled
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument()
    })

    test('allows authenticated users to modify pre-filled data', async () => {
      const user = userEvent.setup()
      const authenticatedContext = {
        ...mockAuthContext,
        isAuthenticated: true,
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
      }
      
      renderWithAuth(<ReservationSystem />, authenticatedContext)
      
      // Navigate to details step
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      await waitFor(() => {
        expect(api.reservations.getAvailability).toHaveBeenCalled()
      })
      
      const timeSlot = screen.getByText('19:00')
      await user.click(timeSlot)
      
      const nextButton = screen.getByText(/siguiente/i)
      await user.click(nextButton)
      
      // Modify pre-filled data
      const nameInput = screen.getByLabelText(/nombre/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Jane Smith')
      
      expect(nameInput.value).toBe('Jane Smith')
    })
  })

  describe('Special Requests', () => {
    test('allows users to add special requests', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      // Navigate to details step
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      await waitFor(() => {
        expect(api.reservations.getAvailability).toHaveBeenCalled()
      })
      
      const timeSlot = screen.getByText('19:00')
      await user.click(timeSlot)
      
      const nextButton = screen.getByText(/siguiente/i)
      await user.click(nextButton)
      
      // Add special request
      const specialRequestInput = screen.getByLabelText(/solicitudes especiales/i)
      await user.type(specialRequestInput, 'Window table preferred')
      
      expect(specialRequestInput.value).toBe('Window table preferred')
    })

    test('includes special requests in reservation submission', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      // Complete the reservation flow with special request
      // ... (similar to previous test)
      
      // Submit reservation
      const submitButton = screen.getByText(/confirmar reserva/i)
      await user.click(submitButton)
      
      // Verify special request is included
      expect(api.reservations.create).toHaveBeenCalledWith(
        expect.objectContaining({
          specialRequests: 'Window table preferred',
        })
      )
    })
  })

  describe('Error Handling', () => {
    test('handles API availability check errors gracefully', async () => {
      // Mock API error
      api.reservations.getAvailability.mockRejectedValue(new Error('Network error'))
      
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      await waitFor(() => {
        expect(screen.getByText(/error al verificar disponibilidad/i)).toBeInTheDocument()
      })
    })

    test('resets form when errors occur', async () => {
      // Mock API error
      api.reservations.getAvailability.mockRejectedValue(new Error('Network error'))
      
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      await waitFor(() => {
        expect(screen.getByText(/error al verificar disponibilidad/i)).toBeInTheDocument()
      })
      
      // Form should be reset
      expect(dateInput.value).toBe('')
    })
  })

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      renderWithAuth(<ReservationSystem />)
      
      expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/invitados/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
    })

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      // Tab through form elements
      await user.tab()
      expect(screen.getByLabelText(/fecha/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/invitados/i)).toHaveFocus()
    })

    test('shows loading states for screen readers', async () => {
      // Mock a delayed response
      api.reservations.getAvailability.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: mockAvailableSlots,
        }), 100))
      )
      
      const user = userEvent.setup()
      renderWithAuth(<ReservationSystem />)
      
      const dateInput = screen.getByLabelText(/fecha/i)
      await user.type(dateInput, '2024-01-15')
      
      // Should have aria-live for loading state
      const loadingElement = screen.getByText(/cargando/i)
      expect(loadingElement).toHaveAttribute('aria-live', 'polite')
    })
  })
})
