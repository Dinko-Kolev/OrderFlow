import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewReservationModal from '../components/NewReservationModal'
import EditReservationModal from '../components/EditReservationModal'
import { ToastProvider } from '../contexts/ToastContext'

// Mock the API module
jest.mock('../lib/api', () => ({
  reservations: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getById: jest.fn(),
  },
  tables: {
    getAll: jest.fn(),
  },
}))

// Mock the Toast context
const mockToastContext = {
  showToast: jest.fn(),
  hideToast: jest.fn(),
}

// Test data
const mockTables = [
  { id: 1, table_number: 1, name: 'Table 1', capacity: 2, is_active: true },
  { id: 2, table_number: 2, name: 'Table 2', capacity: 4, is_active: true },
  { id: 3, table_number: 3, name: 'Table 3', capacity: 6, is_active: true },
  { id: 4, table_number: 4, name: 'Table 4', capacity: 8, is_active: true },
  { id: 5, table_number: 5, name: 'Table 5', capacity: 10, is_active: true },
]

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

// Helper function to render with context
const renderWithToast = (ui, contextValue = mockToastContext) => {
  return render(
    <ToastProvider value={contextValue}>
      {ui}
    </ToastProvider>
  )
}

describe('NewReservationModal Component', () => {
  let api

  beforeEach(() => {
    api = require('../lib/api')
    jest.clearAllMocks()
    
    // Default API mock responses
    api.tables.getAll.mockResolvedValue({
      success: true,
      data: mockTables,
    })
    api.reservations.create.mockResolvedValue({
      success: true,
      reservation: mockReservation,
    })
  })

  describe('Initial Rendering', () => {
    test('renders modal when isOpen is true', () => {
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      expect(screen.getByText('New Reservation')).toBeInTheDocument()
      expect(screen.getByText('Customer Name *')).toBeInTheDocument()
      expect(screen.getByText('Email *')).toBeInTheDocument()
      expect(screen.getByText('Phone *')).toBeInTheDocument()
    })

    test('does not render when isOpen is false', () => {
      renderWithToast(
        <NewReservationModal 
          isOpen={false} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      expect(screen.queryByText('New Reservation')).not.toBeInTheDocument()
    })

    test('displays all form fields with proper labels', () => {
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      // Customer Information
      expect(screen.getByLabelText('Customer Name *')).toBeInTheDocument()
      expect(screen.getByLabelText('Email *')).toBeInTheDocument()
      expect(screen.getByLabelText('Phone *')).toBeInTheDocument()
      expect(screen.getByLabelText('Number of Guests *')).toBeInTheDocument()
      
      // Reservation Details
      expect(screen.getByLabelText('Date *')).toBeInTheDocument()
      expect(screen.getByLabelText('Time *')).toBeInTheDocument()
      expect(screen.getByLabelText('Table *')).toBeInTheDocument()
      expect(screen.getByLabelText('Special Requests')).toBeInTheDocument()
    })

    test('shows close button in header', () => {
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })
  })

  describe('Form Field Validation', () => {
    test('requires mandatory fields to be filled', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = jest.fn()
      
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={mockOnSubmit} 
          tables={mockTables}
        />
      )
      
      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)
      
      // Form should not submit
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    test('validates email format', async () => {
      const user = userEvent.setup()
      
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      const emailInput = screen.getByLabelText('Email *')
      await user.type(emailInput, 'invalid-email')
      
      // Should show validation error
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
    })

    test('validates phone number format', async () => {
      const user = userEvent.setup()
      
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      const phoneInput = screen.getByLabelText('Phone *')
      await user.type(phoneInput, '123')
      
      // Should show validation error
      expect(screen.getByText(/invalid phone format/i)).toBeInTheDocument()
    })

    test('enforces guest count limits', async () => {
      const user = userEvent.setup()
      
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      const guestInput = screen.getByLabelText('Number of Guests *')
      
      // Try to set below minimum
      await user.clear(guestInput)
      await user.type(guestInput, '0')
      expect(guestInput.value).toBe('1') // Should default to minimum
      
      // Try to set above maximum
      await user.clear(guestInput)
      await user.type(guestInput, '25')
      expect(guestInput.value).toBe('20') // Should cap at maximum
    })
  })

  describe('Table Selection', () => {
    test('populates table dropdown with available tables', () => {
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      const tableSelect = screen.getByLabelText('Table *')
      expect(tableSelect).toBeInTheDocument()
      
      // Check if all tables are available
      mockTables.forEach(table => {
        expect(screen.getByText(`Table ${table.table_number} (${table.capacity} seats)`)).toBeInTheDocument()
      })
    })

    test('filters tables based on guest count', async () => {
      const user = userEvent.setup()
      
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      // Set guest count to 6
      const guestInput = screen.getByLabelText('Number of Guests *')
      await user.clear(guestInput)
      await user.type(guestInput, '6')
      
      // Only tables with capacity >= 6 should be available
      const tableSelect = screen.getByLabelText('Table *')
      await user.click(tableSelect)
      
      // Should show appropriate tables
      expect(screen.getByText('Table 3 (6 seats)')).toBeInTheDocument()
      expect(screen.getByText('Table 4 (8 seats)')).toBeInTheDocument()
      expect(screen.getByText('Table 5 (10 seats)')).toBeInTheDocument()
      
      // Should not show tables with insufficient capacity
      expect(screen.queryByText('Table 1 (2 seats)')).not.toBeInTheDocument()
      expect(screen.queryByText('Table 2 (4 seats)')).not.toBeInTheDocument()
    })

    test('shows table capacity information', () => {
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      // Each table option should show capacity
      mockTables.forEach(table => {
        expect(screen.getByText(`Table ${table.table_number} (${table.capacity} seats)`)).toBeInTheDocument()
      })
    })
  })

  describe('Time Slot Selection', () => {
    test('displays all available time slots', () => {
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      const timeSelect = screen.getByLabelText('Time *')
      expect(timeSelect).toBeInTheDocument()
      
      // Check for lunch slots
      expect(screen.getByText('12:00 PM')).toBeInTheDocument()
      expect(screen.getByText('12:30 PM')).toBeInTheDocument()
      expect(screen.getByText('1:00 PM')).toBeInTheDocument()
      expect(screen.getByText('1:30 PM')).toBeInTheDocument()
      expect(screen.getByText('2:00 PM')).toBeInTheDocument()
      expect(screen.getByText('2:30 PM')).toBeInTheDocument()
      
      // Check for dinner slots
      expect(screen.getByText('7:00 PM')).toBeInTheDocument()
      expect(screen.getByText('7:30 PM')).toBeInTheDocument()
      expect(screen.getByText('8:00 PM')).toBeInTheDocument()
      expect(screen.getByText('8:30 PM')).toBeInTheDocument()
      expect(screen.getByText('9:00 PM')).toBeInTheDocument()
      expect(screen.getByText('9:30 PM')).toBeInTheDocument()
      expect(screen.getByText('10:00 PM')).toBeInTheDocument()
    })

    test('formats time slots in 12-hour format', () => {
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      // Time should be displayed in 12-hour format
      expect(screen.getByText('12:00 PM')).toBeInTheDocument()
      expect(screen.getByText('7:00 PM')).toBeInTheDocument()
      expect(screen.getByText('10:00 PM')).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    test('submits form with correct data when all fields are valid', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = jest.fn()
      
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={mockOnSubmit} 
          tables={mockTables}
        />
      )
      
      // Fill all required fields
      await user.type(screen.getByLabelText('Customer Name *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Phone *'), '+1234567890')
      await user.type(screen.getByLabelText('Number of Guests *'), '4')
      await user.type(screen.getByLabelText('Date *'), '2024-01-15')
      
      // Select time
      const timeSelect = screen.getByLabelText('Time *')
      await user.click(timeSelect)
      await user.click(screen.getByText('7:00 PM'))
      
      // Select table
      const tableSelect = screen.getByLabelText('Table *')
      await user.click(tableSelect)
      await user.click(screen.getByText('Table 2 (4 seats)'))
      
      // Add special request
      await user.type(screen.getByLabelText('Special Requests'), 'Window table preferred')
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)
      
      // Verify onSubmit was called with correct data
      expect(mockOnSubmit).toHaveBeenCalledWith({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '+1234567890',
        number_of_guests: '4',
        reservation_date: '2024-01-15',
        reservation_time: '19:00:00',
        table_id: '2',
        special_requests: 'Window table preferred',
      })
    })

    test('handles form submission errors gracefully', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'))
      
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={mockOnSubmit} 
          tables={mockTables}
        />
      )
      
      // Fill required fields
      await user.type(screen.getByLabelText('Customer Name *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Phone *'), '+1234567890')
      await user.type(screen.getByLabelText('Number of Guests *'), '4')
      await user.type(screen.getByLabelText('Date *'), '2024-01-15')
      
      // Select time and table
      const timeSelect = screen.getByLabelText('Time *')
      await user.click(timeSelect)
      await user.click(screen.getByText('7:00 PM'))
      
      const tableSelect = screen.getByLabelText('Table *')
      await user.click(tableSelect)
      await user.click(screen.getByText('Table 2 (4 seats)'))
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/error submitting form/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Reset and Close', () => {
    test('resets form when modal is closed and reopened', async () => {
      const user = userEvent.setup()
      const mockOnClose = jest.fn()
      
      const { rerender } = renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      // Fill some fields
      await user.type(screen.getByLabelText('Customer Name *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      
      // Close modal
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalled()
      
      // Reopen modal
      rerender(
        <NewReservationModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      // Form should be reset
      expect(screen.getByLabelText('Customer Name *').value).toBe('')
      expect(screen.getByLabelText('Email *').value).toBe('')
    })

    test('clears form when submit is successful', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = jest.fn().mockResolvedValue({ success: true })
      
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={mockOnSubmit} 
          tables={mockTables}
        />
      )
      
      // Fill and submit form
      await user.type(screen.getByLabelText('Customer Name *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Phone *'), '+1234567890')
      await user.type(screen.getByLabelText('Number of Guests *'), '4')
      await user.type(screen.getByLabelText('Date *'), '2024-01-15')
      
      const timeSelect = screen.getByLabelText('Time *')
      await user.click(timeSelect)
      await user.click(screen.getByText('7:00 PM'))
      
      const tableSelect = screen.getByLabelText('Table *')
      await user.click(tableSelect)
      await user.click(screen.getByText('Table 2 (4 seats)'))
      
      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)
      
      // Form should be cleared after successful submission
      await waitFor(() => {
        expect(screen.getByLabelText('Customer Name *').value).toBe('')
        expect(screen.getByLabelText('Email *').value).toBe('')
      })
    })
  })

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', () => {
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      // Check for proper labels
      expect(screen.getByLabelText('Customer Name *')).toBeInTheDocument()
      expect(screen.getByLabelText('Email *')).toBeInTheDocument()
      expect(screen.getByLabelText('Phone *')).toBeInTheDocument()
      expect(screen.getByLabelText('Number of Guests *')).toBeInTheDocument()
      expect(screen.getByLabelText('Date *')).toBeInTheDocument()
      expect(screen.getByLabelText('Time *')).toBeInTheDocument()
      expect(screen.getByLabelText('Table *')).toBeInTheDocument()
      expect(screen.getByLabelText('Special Requests')).toBeInTheDocument()
      
      // Check for proper roles
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      // Tab through form elements
      await user.tab()
      expect(screen.getByLabelText('Customer Name *')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText('Email *')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText('Phone *')).toHaveFocus()
    })

    test('shows required field indicators', () => {
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      // Required fields should have asterisk
      expect(screen.getByText('Customer Name *')).toBeInTheDocument()
      expect(screen.getByText('Email *')).toBeInTheDocument()
      expect(screen.getByText('Phone *')).toBeInTheDocument()
      expect(screen.getByText('Number of Guests *')).toBeInTheDocument()
      expect(screen.getByText('Date *')).toBeInTheDocument()
      expect(screen.getByText('Time *')).toBeInTheDocument()
      expect(screen.getByText('Table *')).toBeInTheDocument()
      
      // Optional fields should not have asterisk
      expect(screen.getByText('Special Requests')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    test('adapts layout for different screen sizes', () => {
      // Mock window resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768, // Tablet size
      })
      
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      // Should use responsive grid layout
      const form = screen.getByRole('form')
      expect(form).toHaveClass('grid-cols-1', 'md:grid-cols-2')
    })

    test('maintains usability on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile size
      })
      
      renderWithToast(
        <NewReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          tables={mockTables}
        />
      )
      
      // Form should be single column on mobile
      const form = screen.getByRole('form')
      expect(form).toHaveClass('grid-cols-1')
      
      // Modal should be scrollable
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveClass('overflow-y-auto')
    })
  })
})

describe('EditReservationModal Component', () => {
  let api

  beforeEach(() => {
    api = require('../lib/api')
    jest.clearAllMocks()
    
    // Default API mock responses
    api.reservations.getById.mockResolvedValue({
      success: true,
      data: mockReservation,
    })
    api.reservations.update.mockResolvedValue({
      success: true,
      reservation: { ...mockReservation, status: 'updated' },
    })
    api.tables.getAll.mockResolvedValue({
      success: true,
      data: mockTables,
    })
  })

  describe('Initial Rendering', () => {
    test('renders modal with existing reservation data', async () => {
      renderWithToast(
        <EditReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          reservationId={1}
          tables={mockTables}
        />
      )
      
      // Should show loading state initially
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument()
        expect(screen.getByDisplayValue('4')).toBeInTheDocument()
        expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument()
        expect(screen.getByDisplayValue('19:00:00')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Window table preferred')).toBeInTheDocument()
      })
    })

    test('shows edit title instead of new reservation', async () => {
      renderWithToast(
        <EditReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          reservationId={1}
          tables={mockTables}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText('Edit Reservation')).toBeInTheDocument()
      })
    })
  })

  describe('Data Loading', () => {
    test('fetches reservation data when modal opens', async () => {
      renderWithToast(
        <EditReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          reservationId={1}
          tables={mockTables}
        />
      )
      
      await waitFor(() => {
        expect(api.reservations.getById).toHaveBeenCalledWith(1)
      })
    })

    test('handles data loading errors gracefully', async () => {
      // Mock API error
      api.reservations.getById.mockRejectedValue(new Error('Failed to fetch'))
      
      renderWithToast(
        <EditReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          reservationId={1}
          tables={mockTables}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText(/error loading reservation/i)).toBeInTheDocument()
      })
    })

    test('shows loading spinner while fetching data', () => {
      renderWithToast(
        <EditReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          reservationId={1}
          tables={mockTables}
        />
      )
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Form Pre-population', () => {
    test('pre-fills all form fields with existing data', async () => {
      renderWithToast(
        <EditReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          reservationId={1}
          tables={mockTables}
        />
      )
      
      await waitFor(() => {
        // Customer information
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument()
        expect(screen.getByDisplayValue('4')).toBeInTheDocument()
        
        // Reservation details
        expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument()
        expect(screen.getByDisplayValue('19:00:00')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Window table preferred')).toBeInTheDocument()
        
        // Table selection
        expect(screen.getByDisplayValue('2')).toBeInTheDocument() // table_id
      })
    })

    test('allows editing of pre-filled data', async () => {
      const user = userEvent.setup()
      
      renderWithToast(
        <EditReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          reservationId={1}
          tables={mockTables}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })
      
      // Edit customer name
      const nameInput = screen.getByDisplayValue('John Doe')
      await user.clear(nameInput)
      await user.type(nameInput, 'Jane Smith')
      
      expect(nameInput.value).toBe('Jane Smith')
    })
  })

  describe('Update Functionality', () => {
    test('submits updated reservation data', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = jest.fn()
      
      renderWithToast(
        <EditReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={mockOnSubmit} 
          reservationId={1}
          tables={mockTables}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })
      
      // Update customer name
      const nameInput = screen.getByDisplayValue('John Doe')
      await user.clear(nameInput)
      await user.type(nameInput, 'Jane Smith')
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /update/i })
      await user.click(submitButton)
      
      // Verify onSubmit was called with updated data
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_name: 'Jane Smith',
          customer_email: 'john@example.com',
          customer_phone: '+1234567890',
          number_of_guests: '4',
          reservation_date: '2024-01-15',
          reservation_time: '19:00:00',
          table_id: '2',
          special_requests: 'Window table preferred',
        })
      )
    })

    test('handles update errors gracefully', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Update failed'))
      
      renderWithToast(
        <EditReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={mockOnSubmit} 
          reservationId={1}
          tables={mockTables}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /update/i })
      await user.click(submitButton)
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/error updating reservation/i)).toBeInTheDocument()
      })
    })
  })

  describe('Status Management', () => {
    test('shows current reservation status', async () => {
      renderWithToast(
        <EditReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          reservationId={1}
          tables={mockTables}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText('Status: confirmed')).toBeInTheDocument()
      })
    })

    test('allows status updates for staff', async () => {
      const user = userEvent.setup()
      
      renderWithToast(
        <EditReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          reservationId={1}
          tables={mockTables}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })
      
      // Status should be editable
      const statusSelect = screen.getByLabelText(/status/i)
      expect(statusSelect).toBeInTheDocument()
      
      // Change status
      await user.click(statusSelect)
      await user.click(screen.getByText('seated'))
      
      expect(statusSelect.value).toBe('seated')
    })
  })

  describe('Duration Information Display', () => {
    test('shows reservation duration details', async () => {
      renderWithToast(
        <EditReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          reservationId={1}
          tables={mockTables}
        />
      )
      
      await waitFor(() => {
        // Duration information should be displayed
        expect(screen.getByText(/duration: 105 minutes/i)).toBeInTheDocument()
        expect(screen.getByText(/grace period: 15 minutes/i)).toBeInTheDocument()
        expect(screen.getByText(/max sitting: 120 minutes/i)).toBeInTheDocument()
        expect(screen.getByText(/end time: 20:45/i)).toBeInTheDocument()
      })
    })

    test('displays time slot information', async () => {
      renderWithToast(
        <EditReservationModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onSubmit={jest.fn()} 
          reservationId={1}
          tables={mockTables}
        />
      )
      
      await waitFor(() => {
        // Time slot information
        expect(screen.getByText(/start time: 19:00/i)).toBeInTheDocument()
        expect(screen.getByText(/end time: 20:45/i)).toBeInTheDocument()
        expect(screen.getByText(/total duration: 1h 45m/i)).toBeInTheDocument()
      })
    })
  })
})
