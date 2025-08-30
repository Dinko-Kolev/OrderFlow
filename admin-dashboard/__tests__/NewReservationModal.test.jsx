import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewReservationModal from '../components/NewReservationModal';

// Mock the API client
jest.mock('../lib/api', () => ({
  reservations: {
    getAvailability: jest.fn(),
    create: jest.fn(),
  },
  tables: {
    getAll: jest.fn(),
  },
}));

// Mock the Toast component
jest.mock('../components/Toast', () => {
  return function MockToast({ message, type, onClose }) {
    return (
      <div data-testid={`toast-${type}`} onClick={onClose}>
        {message}
      </div>
    );
  };
});

describe('NewReservationModal', () => {
  const mockOnClose = jest.fn();
  const mockOnReservationCreated = jest.fn();
  const mockApi = require('../lib/api');

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onReservationCreated: mockOnReservationCreated,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    mockApi.reservations.getAvailability.mockResolvedValue({
      success: true,
      data: [
        {
          time: '12:00',
          available: true,
          tables: [
            { id: 1, name: 'Table 1', capacity: 4, available: true },
            { id: 2, name: 'Table 2', capacity: 6, available: true }
          ]
        },
        {
          time: '13:00',
          available: true,
          tables: [
            { id: 3, name: 'Table 3', capacity: 8, available: true }
          ]
        }
      ]
    });

    mockApi.tables.getAll.mockResolvedValue({
      success: true,
      data: [
        { id: 1, name: 'Table 1', capacity: 4 },
        { id: 2, name: 'Table 2', capacity: 6 },
        { id: 3, name: 'Table 3', capacity: 8 }
      ]
    });

    mockApi.reservations.create.mockResolvedValue({
      success: true,
      data: { id: 1, reservation_number: 'RES-001' }
    });
  });

  const fillValidForm = async (user) => {
    // Select date
    const dateInput = screen.getByLabelText(/fecha/i);
    await user.clear(dateInput);
    await user.type(dateInput, '2025-01-15');

    // Select time
    const timeSelect = screen.getByLabelText(/hora/i);
    await user.selectOptions(timeSelect, '12:00');

    // Select guests
    const guestsSelect = screen.getByLabelText(/número de invitados/i);
    await user.selectOptions(guestsSelect, '4');

    // Fill customer details
    const nameInput = screen.getByLabelText(/nombre/i);
    await user.type(nameInput, 'John Doe');

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'john@example.com');

    const phoneInput = screen.getByLabelText(/teléfono/i);
    await user.type(phoneInput, '+1234567890');

    const notesInput = screen.getByLabelText(/notas/i);
    await user.type(notesInput, 'Window seat preferred');
  };

  describe('Initial Rendering', () => {
    test('renders modal when open', () => {
      render(<NewReservationModal {...defaultProps} />);
      
      expect(screen.getByText(/nueva reserva/i)).toBeInTheDocument();
      expect(screen.getByText(/crear reserva/i)).toBeInTheDocument();
    });

    test('does not render when closed', () => {
      render(<NewReservationModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText(/nueva reserva/i)).not.toBeInTheDocument();
    });

    test('renders all form fields', () => {
      render(<NewReservationModal {...defaultProps} />);
      
      expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hora/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/número de invitados/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notas/i)).toBeInTheDocument();
    });

    test('renders action buttons', () => {
      render(<NewReservationModal {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /crear reserva/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('submit button is disabled initially', () => {
      render(<NewReservationModal {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /crear reserva/i });
      expect(submitButton).toBeDisabled();
    });

    test('submit button is disabled with invalid form data', async () => {
      const user = userEvent.setup();
      render(<NewReservationModal {...defaultProps} />);
      
      // Fill only some fields
      const nameInput = screen.getByLabelText(/nombre/i);
      await user.type(nameInput, 'John Doe');
      
      const submitButton = screen.getByRole('button', { name: /crear reserva/i });
      expect(submitButton).toBeDisabled();
    });

    test('submit button is enabled with valid form data', async () => {
      const user = userEvent.setup();
      render(<NewReservationModal {...defaultProps} />);
      
      await fillValidForm(user);
      
      const submitButton = screen.getByRole('button', { name: /crear reserva/i });
      expect(submitButton).toBeEnabled();
    });

    test('validates required fields', async () => {
      const user = userEvent.setup();
      render(<NewReservationModal {...defaultProps} />);
      
      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /crear reserva/i });
      await user.click(submitButton);
      
      // Should show validation errors or remain disabled
      expect(submitButton).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    test('can select date', async () => {
      const user = userEvent.setup();
      render(<NewReservationModal {...defaultProps} />);
      
      const dateInput = screen.getByLabelText(/fecha/i);
      await user.clear(dateInput);
      await user.type(dateInput, '2025-01-15');
      
      expect(dateInput).toHaveValue('2025-01-15');
    });

    test('can select time', async () => {
      const user = userEvent.setup();
      render(<NewReservationModal {...defaultProps} />);
      
      const timeSelect = screen.getByLabelText(/hora/i);
      await user.selectOptions(timeSelect, '12:00');
      
      expect(timeSelect).toHaveValue('12:00');
    });

    test('can select number of guests', async () => {
      const user = userEvent.setup();
      render(<NewReservationModal {...defaultProps} />);
      
      const guestsSelect = screen.getByLabelText(/número de invitados/i);
      await user.selectOptions(guestsSelect, '4');
      
      expect(guestsSelect).toHaveValue('4');
    });

    test('can fill customer details', async () => {
      const user = userEvent.setup();
      render(<NewReservationModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/nombre/i);
      await user.type(nameInput, 'John Doe');
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'john@example.com');
      
      const phoneInput = screen.getByLabelText(/teléfono/i);
      await user.type(phoneInput, '+1234567890');
      
      expect(nameInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('john@example.com');
      expect(phoneInput).toHaveValue('+1234567890');
    });

    test('can add notes', async () => {
      const user = userEvent.setup();
      render(<NewReservationModal {...defaultProps} />);
      
      const notesInput = screen.getByLabelText(/notas/i);
      await user.type(notesInput, 'Window seat preferred');
      
      expect(notesInput).toHaveValue('Window seat preferred');
    });
  });

  describe('API Integration', () => {
    test('fetches available time slots on mount', async () => {
      render(<NewReservationModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockApi.reservations.getAvailability).toHaveBeenCalled();
      });
    });

    test('fetches tables on mount', async () => {
      render(<NewReservationModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockApi.tables.getAll).toHaveBeenCalled();
      });
    });

    test('creates reservation successfully', async () => {
      const user = userEvent.setup();
      render(<NewReservationModal {...defaultProps} />);
      
      await fillValidForm(user);
      
      const submitButton = screen.getByRole('button', { name: /crear reserva/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockApi.reservations.create).toHaveBeenCalledWith({
          date: '2025-01-15',
          time: '12:00',
          guests: 4,
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          customer_phone: '+1234567890',
          notes: 'Window seat preferred',
          table_id: expect.any(Number)
        });
      });
    });

    test('calls onReservationCreated after successful creation', async () => {
      const user = userEvent.setup();
      render(<NewReservationModal {...defaultProps} />);
      
      await fillValidForm(user);
      
      const submitButton = screen.getByRole('button', { name: /crear reserva/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnReservationCreated).toHaveBeenCalledWith({
          id: 1,
          reservation_number: 'RES-001'
        });
      });
    });

    test('closes modal after successful creation', async () => {
      const user = userEvent.setup();
      render(<NewReservationModal {...defaultProps} />);
      
      await fillValidForm(user);
      
      const submitButton = screen.getByRole('button', { name: /crear reserva/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      mockApi.reservations.create.mockRejectedValue(new Error('API Error'));
      
      const user = userEvent.setup();
      render(<NewReservationModal {...defaultProps} />);
      
      await fillValidForm(user);
      
      const submitButton = screen.getByRole('button', { name: /crear reserva/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    test('handles validation errors', async () => {
      mockApi.reservations.create.mockResolvedValue({
        success: false,
        error: 'Validation failed'
      });
      
      const user = userEvent.setup();
      render(<NewReservationModal {...defaultProps} />);
      
      await fillValidForm(user);
      
      const submitButton = screen.getByRole('button', { name: /crear reserva/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Modal Behavior', () => {
    test('closes modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<NewReservationModal {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('closes modal when clicking outside', async () => {
      const user = userEvent.setup();
      render(<NewReservationModal {...defaultProps} />);
      
      const modal = screen.getByRole('dialog');
      await user.click(modal);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('resets form when modal is closed and reopened', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<NewReservationModal {...defaultProps} />);
      
      // Fill form
      await fillValidForm(user);
      
      // Close modal
      rerender(<NewReservationModal {...defaultProps} isOpen={false} />);
      
      // Reopen modal
      rerender(<NewReservationModal {...defaultProps} isOpen={true} />);
      
      // Form should be reset
      expect(screen.getByLabelText(/nombre/i)).toHaveValue('');
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<NewReservationModal {...defaultProps} />);
      
      expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hora/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/número de invitados/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notas/i)).toBeInTheDocument();
    });

    test('has proper form structure', () => {
      render(<NewReservationModal {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    test('submit button has proper disabled state', () => {
      render(<NewReservationModal {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /crear reserva/i });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('aria-disabled', 'true');
    });
  });
});
