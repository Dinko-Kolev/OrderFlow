import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TableReservationsWidget from '../components/TableReservationsWidget';

// Mock the API client
jest.mock('../lib/api', () => ({
  tables: {
    getAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  reservations: {
    getByTable: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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

describe('TableReservationsWidget', () => {
  const mockOnTableUpdated = jest.fn();
  const mockOnReservationUpdated = jest.fn();
  const mockApi = require('../lib/api');

  const defaultProps = {
    onTableUpdated: mockOnTableUpdated,
    onReservationUpdated: mockOnReservationUpdated,
  };

  const mockTables = [
    {
      id: 1,
      name: 'Table 1',
      capacity: 4,
      status: 'available',
      location: 'Window',
      is_active: true
    },
    {
      id: 2,
      name: 'Table 2',
      capacity: 6,
      status: 'occupied',
      location: 'Center',
      is_active: true
    },
    {
      id: 3,
      name: 'Table 3',
      capacity: 8,
      status: 'reserved',
      location: 'Garden',
      is_active: true
    }
  ];

  const mockReservations = [
    {
      id: 1,
      table_id: 2,
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      date: '2025-01-15',
      time: '19:00',
      guests: 4,
      status: 'confirmed'
    },
    {
      id: 2,
      table_id: 3,
      customer_name: 'Jane Smith',
      customer_email: 'jane@example.com',
      date: '2025-01-15',
      time: '20:00',
      guests: 6,
      status: 'pending'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    mockApi.tables.getAll.mockResolvedValue({
      success: true,
      data: mockTables
    });

    mockApi.reservations.getByTable.mockResolvedValue({
      success: true,
      data: mockReservations
    });

    mockApi.tables.update.mockResolvedValue({
      success: true,
      data: { id: 1, status: 'updated' }
    });

    mockApi.reservations.update.mockResolvedValue({
      success: true,
      data: { id: 1, status: 'updated' }
    });
  });

  describe('Initial Rendering', () => {
    test('renders table management widget', () => {
      render(<TableReservationsWidget {...defaultProps} />);
      
      expect(screen.getByText(/gestión de mesas/i)).toBeInTheDocument();
      expect(screen.getByText(/reservas/i)).toBeInTheDocument();
    });

    test('renders table list', async () => {
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Table 1')).toBeInTheDocument();
        expect(screen.getByText('Table 2')).toBeInTheDocument();
        expect(screen.getByText('Table 3')).toBeInTheDocument();
      });
    });

    test('renders table information correctly', async () => {
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Capacity: 4')).toBeInTheDocument();
        expect(screen.getByText('Capacity: 6')).toBeInTheDocument();
        expect(screen.getByText('Capacity: 8')).toBeInTheDocument();
        expect(screen.getByText('Location: Window')).toBeInTheDocument();
        expect(screen.getByText('Location: Center')).toBeInTheDocument();
        expect(screen.getByText('Location: Garden')).toBeInTheDocument();
      });
    });

    test('renders table status indicators', async () => {
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Available')).toBeInTheDocument();
        expect(screen.getByText('Occupied')).toBeInTheDocument();
        expect(screen.getByText('Reserved')).toBeInTheDocument();
      });
    });
  });

  describe('Table Management', () => {
    test('can edit table details', async () => {
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Table 1')).toBeInTheDocument();
      });
      
      const editButton = screen.getAllByRole('button', { name: /editar/i })[0];
      await user.click(editButton);
      
      // Should show edit form or modal
      expect(screen.getByDisplayValue('Table 1')).toBeInTheDocument();
    });

    test('can update table status', async () => {
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Table 1')).toBeInTheDocument();
      });
      
      const statusSelect = screen.getAllByDisplayValue('Available')[0];
      await user.selectOptions(statusSelect, 'occupied');
      
      await waitFor(() => {
        expect(mockApi.tables.update).toHaveBeenCalledWith(1, {
          status: 'occupied'
        });
      });
    });

    test('can delete table', async () => {
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Table 1')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getAllByRole('button', { name: /eliminar/i })[0];
      await user.click(deleteButton);
      
      // Should show confirmation dialog
      expect(screen.getByText(/¿estás seguro/i)).toBeInTheDocument();
    });

    test('confirms table deletion', async () => {
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Table 1')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getAllByRole('button', { name: /eliminar/i })[0];
      await user.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockApi.tables.delete).toHaveBeenCalledWith(1);
      });
    });

    test('can add new table', async () => {
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      const addButton = screen.getByRole('button', { name: /agregar mesa/i });
      await user.click(addButton);
      
      // Should show add table form
      expect(screen.getByText(/nueva mesa/i)).toBeInTheDocument();
    });
  });

  describe('Reservation Management', () => {
    test('displays reservations for tables', async () => {
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('19:00')).toBeInTheDocument();
        expect(screen.getByText('20:00')).toBeInTheDocument();
      });
    });

    test('can edit reservation details', async () => {
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const editButton = screen.getAllByRole('button', { name: /editar/i })[0];
      await user.click(editButton);
      
      // Should show edit reservation form
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    test('can update reservation status', async () => {
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const statusSelect = screen.getAllByDisplayValue('confirmed')[0];
      await user.selectOptions(statusSelect, 'completed');
      
      await waitFor(() => {
        expect(mockApi.reservations.update).toHaveBeenCalledWith(1, {
          status: 'completed'
        });
      });
    });

    test('can cancel reservation', async () => {
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const cancelButton = screen.getAllByRole('button', { name: /cancelar/i })[0];
      await user.click(cancelButton);
      
      // Should show confirmation dialog
      expect(screen.getByText(/¿cancelar reserva/i)).toBeInTheDocument();
    });

    test('confirms reservation cancellation', async () => {
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const cancelButton = screen.getAllByRole('button', { name: /cancelar/i })[0];
      await user.click(cancelButton);
      
      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockApi.reservations.delete).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Filtering and Search', () => {
    test('can filter tables by status', async () => {
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Table 1')).toBeInTheDocument();
      });
      
      const statusFilter = screen.getByLabelText(/filtrar por estado/i);
      await user.selectOptions(statusFilter, 'available');
      
      // Should only show available tables
      expect(screen.getByText('Table 1')).toBeInTheDocument();
      expect(screen.queryByText('Table 2')).not.toBeInTheDocument();
    });

    test('can filter tables by capacity', async () => {
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Table 1')).toBeInTheDocument();
      });
      
      const capacityFilter = screen.getByLabelText(/filtrar por capacidad/i);
      await user.selectOptions(capacityFilter, '4');
      
      // Should only show tables with capacity 4
      expect(screen.getByText('Table 1')).toBeInTheDocument();
      expect(screen.queryByText('Table 2')).not.toBeInTheDocument();
    });

    test('can search tables by name', async () => {
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Table 1')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText(/buscar mesas/i);
      await user.type(searchInput, 'Table 1');
      
      // Should only show Table 1
      expect(screen.getByText('Table 1')).toBeInTheDocument();
      expect(screen.queryByText('Table 2')).not.toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    test('fetches tables on mount', async () => {
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockApi.tables.getAll).toHaveBeenCalled();
      });
    });

    test('fetches reservations for tables', async () => {
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockApi.reservations.getByTable).toHaveBeenCalled();
      });
    });

    test('calls onTableUpdated after successful update', async () => {
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Table 1')).toBeInTheDocument();
      });
      
      const statusSelect = screen.getAllByDisplayValue('Available')[0];
      await user.selectOptions(statusSelect, 'occupied');
      
      await waitFor(() => {
        expect(mockOnTableUpdated).toHaveBeenCalled();
      });
    });

    test('calls onReservationUpdated after successful update', async () => {
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const statusSelect = screen.getAllByDisplayValue('confirmed')[0];
      await user.selectOptions(statusSelect, 'completed');
      
      await waitFor(() => {
        expect(mockOnReservationUpdated).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      mockApi.tables.getAll.mockRejectedValue(new Error('API Error'));
      
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    test('handles table update errors', async () => {
      mockApi.tables.update.mockRejectedValue(new Error('Update failed'));
      
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Table 1')).toBeInTheDocument();
      });
      
      const statusSelect = screen.getAllByDisplayValue('Available')[0];
      await user.selectOptions(statusSelect, 'occupied');
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    test('handles reservation update errors', async () => {
      mockApi.reservations.update.mockRejectedValue(new Error('Update failed'));
      
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const statusSelect = screen.getAllByDisplayValue('confirmed')[0];
      await user.selectOptions(statusSelect, 'completed');
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state while fetching data', () => {
      mockApi.tables.getAll.mockImplementation(() => new Promise(() => {}));
      
      render(<TableReservationsWidget {...defaultProps} />);
      
      expect(screen.getByText(/cargando/i)).toBeInTheDocument();
    });

    test('shows loading state during updates', async () => {
      const user = userEvent.setup();
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Table 1')).toBeInTheDocument();
      });
      
      mockApi.tables.update.mockImplementation(() => new Promise(() => {}));
      
      const statusSelect = screen.getAllByDisplayValue('Available')[0];
      await user.selectOptions(statusSelect, 'occupied');
      
      expect(screen.getByText(/actualizando/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', async () => {
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/filtrar por estado/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/filtrar por capacidad/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/buscar mesas/i)).toBeInTheDocument();
      });
    });

    test('has proper table structure', async () => {
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getAllByRole('row')).toHaveLength(4); // Header + 3 tables
      });
    });

    test('buttons have proper labels', async () => {
      render(<TableReservationsWidget {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /editar/i })).toHaveLength(3);
        expect(screen.getAllByRole('button', { name: /eliminar/i })).toHaveLength(3);
      });
    });
  });
});
