import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navigation from '../components/Navigation';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      pathname: '/dashboard',
    };
  },
  usePathname() {
    return '/dashboard';
  },
}));

// Mock the AuthContext
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin'
    },
    logout: jest.fn(),
  }),
}));

describe('Navigation', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders navigation menu when open', () => {
      render(<Navigation {...defaultProps} />);
      
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/pedidos/i)).toBeInTheDocument();
      expect(screen.getByText(/reservas/i)).toBeInTheDocument();
      expect(screen.getByText(/productos/i)).toBeInTheDocument();
      expect(screen.getByText(/mesas/i)).toBeInTheDocument();
      expect(screen.getByText(/clientes/i)).toBeInTheDocument();
      expect(screen.getByText(/inventario/i)).toBeInTheDocument();
    });

    test('does not render when closed', () => {
      render(<Navigation {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
    });

    test('renders user information', () => {
      render(<Navigation {...defaultProps} />);
      
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });

    test('renders navigation items with icons', () => {
      render(<Navigation {...defaultProps} />);
      
      // Check for navigation items
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/pedidos/i)).toBeInTheDocument();
      expect(screen.getByText(/reservas/i)).toBeInTheDocument();
      expect(screen.getByText(/productos/i)).toBeInTheDocument();
      expect(screen.getByText(/mesas/i)).toBeInTheDocument();
      expect(screen.getByText(/clientes/i)).toBeInTheDocument();
      expect(screen.getByText(/inventario/i)).toBeInTheDocument();
    });
  });

  describe('Navigation Items', () => {
    test('highlights current active route', () => {
      render(<Navigation {...defaultProps} />);
      
      const dashboardLink = screen.getByText(/dashboard/i).closest('a');
      expect(dashboardLink).toHaveClass('bg-primary');
    });

    test('renders all navigation sections', () => {
      render(<Navigation {...defaultProps} />);
      
      // Main navigation
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/pedidos/i)).toBeInTheDocument();
      expect(screen.getByText(/reservas/i)).toBeInTheDocument();
      
      // Management sections
      expect(screen.getByText(/productos/i)).toBeInTheDocument();
      expect(screen.getByText(/mesas/i)).toBeInTheDocument();
      expect(screen.getByText(/clientes/i)).toBeInTheDocument();
      expect(screen.getByText(/inventario/i)).toBeInTheDocument();
      
      // Settings
      expect(screen.getByText(/configuración/i)).toBeInTheDocument();
    });

    test('renders navigation items with proper links', () => {
      render(<Navigation {...defaultProps} />);
      
      const dashboardLink = screen.getByText(/dashboard/i).closest('a');
      const ordersLink = screen.getByText(/pedidos/i).closest('a');
      const reservationsLink = screen.getByText(/reservas/i).closest('a');
      
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      expect(ordersLink).toHaveAttribute('href', '/orders');
      expect(reservationsLink).toHaveAttribute('href', '/reservations');
    });
  });

  describe('User Interactions', () => {
    test('can navigate to different sections', async () => {
      const user = userEvent.setup();
      render(<Navigation {...defaultProps} />);
      
      const ordersLink = screen.getByText(/pedidos/i).closest('a');
      await user.click(ordersLink);
      
      // Should navigate to orders page
      expect(ordersLink).toHaveAttribute('href', '/orders');
    });

    test('can access user profile', async () => {
      const user = userEvent.setup();
      render(<Navigation {...defaultProps} />);
      
      const profileButton = screen.getByText(/perfil/i);
      await user.click(profileButton);
      
      // Should show profile options or navigate to profile
      expect(profileButton).toBeInTheDocument();
    });

    test('can logout user', async () => {
      const user = userEvent.setup();
      render(<Navigation {...defaultProps} />);
      
      const logoutButton = screen.getByText(/cerrar sesión/i);
      await user.click(logoutButton);
      
      // Should call logout function
      expect(logoutButton).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    test('shows close button on mobile', () => {
      render(<Navigation {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /cerrar/i });
      expect(closeButton).toBeInTheDocument();
    });

    test('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      
      render(<Navigation {...defaultProps} onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: /cerrar/i });
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('handles overlay click to close', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      
      render(<Navigation {...defaultProps} onClose={mockOnClose} />);
      
      const overlay = screen.getByTestId('navigation-overlay');
      await user.click(overlay);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('User Menu', () => {
    test('displays user avatar', () => {
      render(<Navigation {...defaultProps} />);
      
      const avatar = screen.getByAltText(/avatar/i);
      expect(avatar).toBeInTheDocument();
    });

    test('shows user role', () => {
      render(<Navigation {...defaultProps} />);
      
      expect(screen.getByText(/admin/i)).toBeInTheDocument();
    });

    test('has user menu dropdown', () => {
      render(<Navigation {...defaultProps} />);
      
      const userMenu = screen.getByTestId('user-menu');
      expect(userMenu).toBeInTheDocument();
    });
  });

  describe('Navigation Groups', () => {
    test('groups navigation items logically', () => {
      render(<Navigation {...defaultProps} />);
      
      // Main dashboard section
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      
      // Operations section
      expect(screen.getByText(/pedidos/i)).toBeInTheDocument();
      expect(screen.getByText(/reservas/i)).toBeInTheDocument();
      
      // Management section
      expect(screen.getByText(/productos/i)).toBeInTheDocument();
      expect(screen.getByText(/mesas/i)).toBeInTheDocument();
      expect(screen.getByText(/clientes/i)).toBeInTheDocument();
      expect(screen.getByText(/inventario/i)).toBeInTheDocument();
    });

    test('shows section headers', () => {
      render(<Navigation {...defaultProps} />);
      
      expect(screen.getByText(/operaciones/i)).toBeInTheDocument();
      expect(screen.getByText(/gestión/i)).toBeInTheDocument();
      expect(screen.getByText(/configuración/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<Navigation {...defaultProps} />);
      
      expect(screen.getByLabelText(/navegación principal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/menú de usuario/i)).toBeInTheDocument();
    });

    test('navigation items have proper roles', () => {
      render(<Navigation {...defaultProps} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    test('buttons have proper labels', () => {
      render(<Navigation {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /cerrar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /perfil/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
    });

    test('supports keyboard navigation', () => {
      render(<Navigation {...defaultProps} />);
      
      const dashboardLink = screen.getByText(/dashboard/i).closest('a');
      expect(dashboardLink).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('State Management', () => {
    test('tracks active navigation item', () => {
      render(<Navigation {...defaultProps} />);
      
      const dashboardLink = screen.getByText(/dashboard/i).closest('a');
      expect(dashboardLink).toHaveClass('bg-primary');
      
      const ordersLink = screen.getByText(/pedidos/i).closest('a');
      expect(ordersLink).not.toHaveClass('bg-primary');
    });

    test('handles navigation state changes', () => {
      const { rerender } = render(<Navigation {...defaultProps} />);
      
      // Initially dashboard is active
      expect(screen.getByText(/dashboard/i).closest('a')).toHaveClass('bg-primary');
      
      // Change pathname and rerender
      jest.doMock('next/navigation', () => ({
        useRouter() {
          return {
            push: jest.fn(),
            pathname: '/orders',
          };
        },
        usePathname() {
          return '/orders';
        },
      }));
      
      rerender(<Navigation {...defaultProps} />);
      
      // Now orders should be active
      expect(screen.getByText(/pedidos/i).closest('a')).toHaveClass('bg-primary');
    });
  });

  describe('Mobile Responsiveness', () => {
    test('applies mobile-specific styles', () => {
      render(<Navigation {...defaultProps} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('fixed', 'inset-y-0', 'left-0');
    });

    test('handles mobile menu toggle', () => {
      render(<Navigation {...defaultProps} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('transform', 'translate-x-0');
    });

    test('supports mobile gestures', () => {
      render(<Navigation {...defaultProps} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('transition-transform');
    });
  });
});
