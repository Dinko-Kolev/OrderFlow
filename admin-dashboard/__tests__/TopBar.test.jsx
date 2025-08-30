import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TopBar from '../components/TopBar';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      pathname: '/dashboard',
    };
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

describe('TopBar', () => {
  const defaultProps = {
    onMenuToggle: jest.fn(),
    onNotificationClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders top bar with menu toggle button', () => {
      render(<TopBar {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /toggle menu/i })).toBeInTheDocument();
      expect(screen.getByText(/bella vista/i)).toBeInTheDocument();
    });

    test('renders user information', () => {
      render(<TopBar {...defaultProps} />);
      
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });

    test('renders notification bell icon', () => {
      render(<TopBar {...defaultProps} />);
      
      expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    });

    test('renders user avatar', () => {
      render(<TopBar {...defaultProps} />);
      
      const avatar = screen.getByAltText(/avatar/i);
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Menu Toggle', () => {
    test('calls onMenuToggle when menu button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnMenuToggle = jest.fn();
      
      render(<TopBar {...defaultProps} onMenuToggle={mockOnMenuToggle} />);
      
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      await user.click(menuButton);
      
      expect(mockOnMenuToggle).toHaveBeenCalled();
    });

    test('menu button has proper accessibility attributes', () => {
      render(<TopBar {...defaultProps} />);
      
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      expect(menuButton).toHaveAttribute('aria-label', 'Toggle menu');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('menu button icon changes based on state', () => {
      const { rerender } = render(<TopBar {...defaultProps} />);
      
      // Initially closed
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
      
      // Change to open state
      rerender(<TopBar {...defaultProps} isMenuOpen={true} />);
      expect(screen.getByTestId('close-icon')).toBeInTheDocument();
    });
  });

  describe('User Menu', () => {
    test('shows user dropdown when avatar is clicked', async () => {
      const user = userEvent.setup();
      render(<TopBar {...defaultProps} />);
      
      const avatar = screen.getByAltText(/avatar/i);
      await user.click(avatar);
      
      // Should show dropdown menu
      expect(screen.getByText(/perfil/i)).toBeInTheDocument();
      expect(screen.getByText(/configuración/i)).toBeInTheDocument();
      expect(screen.getByText(/cerrar sesión/i)).toBeInTheDocument();
    });

    test('user dropdown has proper positioning', async () => {
      const user = userEvent.setup();
      render(<TopBar {...defaultProps} />);
      
      const avatar = screen.getByAltText(/avatar/i);
      await user.click(avatar);
      
      const dropdown = screen.getByTestId('user-dropdown');
      expect(dropdown).toHaveClass('absolute', 'right-0', 'top-full');
    });

    test('can navigate to user profile', async () => {
      const user = userEvent.setup();
      render(<TopBar {...defaultProps} />);
      
      const avatar = screen.getByAltText(/avatar/i);
      await user.click(avatar);
      
      const profileLink = screen.getByText(/perfil/i);
      await user.click(profileLink);
      
      expect(profileLink).toHaveAttribute('href', '/profile');
    });

    test('can access settings', async () => {
      const user = userEvent.setup();
      render(<TopBar {...defaultProps} />);
      
      const avatar = screen.getByAltText(/avatar/i);
      await user.click(avatar);
      
      const settingsLink = screen.getByText(/configuración/i);
      await user.click(settingsLink);
      
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    test('can logout user', async () => {
      const user = userEvent.setup();
      const mockLogout = jest.fn();
      
      // Mock the logout function
      jest.doMock('../contexts/AuthContext', () => ({
        useAuth: () => ({
          user: {
            id: 1,
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin'
          },
          logout: mockLogout,
        }),
      }));
      
      render(<TopBar {...defaultProps} />);
      
      const avatar = screen.getByAltText(/avatar/i);
      await user.click(avatar);
      
      const logoutButton = screen.getByText(/cerrar sesión/i);
      await user.click(logoutButton);
      
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Notifications', () => {
    test('shows notification count badge', () => {
      render(<TopBar {...defaultProps} notificationCount={5} />);
      
      const badge = screen.getByTestId('notification-badge');
      expect(badge).toHaveTextContent('5');
    });

    test('hides notification badge when count is zero', () => {
      render(<TopBar {...defaultProps} notificationCount={0} />);
      
      const badge = screen.queryByTestId('notification-badge');
      expect(badge).not.toBeInTheDocument();
    });

    test('calls onNotificationClick when notification bell is clicked', async () => {
      const user = userEvent.setup();
      const mockOnNotificationClick = jest.fn();
      
      render(<TopBar {...defaultProps} onNotificationClick={mockOnNotificationClick} />);
      
      const notificationBell = screen.getByTestId('notification-bell');
      await user.click(notificationBell);
      
      expect(mockOnNotificationClick).toHaveBeenCalled();
    });

    test('notification bell has proper accessibility attributes', () => {
      render(<TopBar {...defaultProps} />);
      
      const notificationBell = screen.getByTestId('notification-bell');
      expect(notificationBell).toHaveAttribute('aria-label', 'Notifications');
    });
  });

  describe('Search Functionality', () => {
    test('renders search input when search is enabled', () => {
      render(<TopBar {...defaultProps} showSearch={true} />);
      
      const searchInput = screen.getByPlaceholderText(/buscar/i);
      expect(searchInput).toBeInTheDocument();
    });

    test('does not render search input when search is disabled', () => {
      render(<TopBar {...defaultProps} showSearch={false} />);
      
      const searchInput = screen.queryByPlaceholderText(/buscar/i);
      expect(searchInput).not.toBeInTheDocument();
    });

    test('can type in search input', async () => {
      const user = userEvent.setup();
      render(<TopBar {...defaultProps} showSearch={true} />);
      
      const searchInput = screen.getByPlaceholderText(/buscar/i);
      await user.type(searchInput, 'test search');
      
      expect(searchInput).toHaveValue('test search');
    });

    test('calls onSearch when search is submitted', async () => {
      const user = userEvent.setup();
      const mockOnSearch = jest.fn();
      
      render(<TopBar {...defaultProps} showSearch={true} onSearch={mockOnSearch} />);
      
      const searchInput = screen.getByPlaceholderText(/buscar/i);
      await user.type(searchInput, 'test search');
      await user.keyboard('{Enter}');
      
      expect(mockOnSearch).toHaveBeenCalledWith('test search');
    });
  });

  describe('Responsive Behavior', () => {
    test('applies responsive classes', () => {
      render(<TopBar {...defaultProps} />);
      
      const topBar = screen.getByTestId('top-bar');
      expect(topBar).toHaveClass('flex', 'items-center', 'justify-between');
    });

    test('handles mobile layout', () => {
      render(<TopBar {...defaultProps} />);
      
      const topBar = screen.getByTestId('top-bar');
      expect(topBar).toHaveClass('px-4', 'py-2');
    });

    test('supports dark mode', () => {
      render(<TopBar {...defaultProps} />);
      
      const topBar = screen.getByTestId('top-bar');
      expect(topBar).toHaveClass('bg-white', 'dark:bg-gray-800');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<TopBar {...defaultProps} />);
      
      expect(screen.getByLabelText(/toggle menu/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/user menu/i)).toBeInTheDocument();
    });

    test('supports keyboard navigation', () => {
      render(<TopBar {...defaultProps} />);
      
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      expect(menuButton).toHaveAttribute('tabIndex', '0');
      
      const notificationBell = screen.getByTestId('notification-bell');
      expect(notificationBell).toHaveAttribute('tabIndex', '0');
    });

    test('has proper focus management', () => {
      render(<TopBar {...defaultProps} />);
      
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      menuButton.focus();
      
      expect(menuButton).toHaveFocus();
    });
  });

  describe('State Management', () => {
    test('tracks menu open state', () => {
      const { rerender } = render(<TopBar {...defaultProps} />);
      
      // Initially closed
      const menuButton = screen.getByRole('button', { name: /toggle menu/i });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      
      // Change to open state
      rerender(<TopBar {...defaultProps} isMenuOpen={true} />);
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });

    test('tracks user dropdown state', async () => {
      const user = userEvent.setup();
      render(<TopBar {...defaultProps} />);
      
      const avatar = screen.getByAltText(/avatar/i);
      await user.click(avatar);
      
      const dropdown = screen.getByTestId('user-dropdown');
      expect(dropdown).toHaveClass('block');
      
      // Click outside to close
      await user.click(document.body);
      expect(dropdown).toHaveClass('hidden');
    });
  });

  describe('Error Handling', () => {
    test('handles missing user data gracefully', () => {
      jest.doMock('../contexts/AuthContext', () => ({
        useAuth: () => ({
          user: null,
          logout: jest.fn(),
        }),
      }));
      
      render(<TopBar {...defaultProps} />);
      
      // Should not crash and show fallback content
      expect(screen.getByText(/usuario/i)).toBeInTheDocument();
    });

    test('handles notification errors gracefully', () => {
      render(<TopBar {...defaultProps} notificationCount={-1} />);
      
      // Should not show negative notification count
      const badge = screen.queryByTestId('notification-badge');
      expect(badge).not.toBeInTheDocument();
    });
  });
});
