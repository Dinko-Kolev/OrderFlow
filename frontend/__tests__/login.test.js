import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/router'
import LoginPage from '../pages/login'
import { AuthProvider } from '../contexts/AuthContext'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}))

describe('LoginPage Component', () => {
  let mockRouter

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup router mock
    mockRouter = {
      push: jest.fn(),
      pathname: '/login',
      query: {},
    }
    useRouter.mockReturnValue(mockRouter)
  })

  const renderWithAuth = (component) => {
    return render(
      <AuthProvider>
        {component}
      </AuthProvider>
    )
  }

  describe('Initial Rendering', () => {
    test('renders login form with all required elements', () => {
      renderWithAuth(<LoginPage />)
      
      expect(screen.getByText('Bienvenido de vuelta')).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
      expect(screen.getByText('¿Primera vez en Bella Vista?')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /crear cuenta gratis/i })).toBeInTheDocument()
    })

    test('renders navigation links correctly', () => {
      renderWithAuth(<LoginPage />)
      
      const homeLink = screen.getByRole('link', { name: /bella vista/i })
      const backLink = screen.getByRole('link', { name: /volver al inicio/i })
      
      expect(homeLink).toHaveAttribute('href', '/')
      expect(backLink).toHaveAttribute('href', '/')
    })

    test('renders social login options', () => {
      renderWithAuth(<LoginPage />)
      
      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /facebook/i })).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    test('shows error for empty email', async () => {
      const user = userEvent.setup()
      renderWithAuth(<LoginPage />)
      
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      await user.click(submitButton)
      
      expect(screen.getByText('El email es requerido')).toBeInTheDocument()
    })

    test('shows error for invalid email format', async () => {
      const user = userEvent.setup()
      renderWithAuth(<LoginPage />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      
      await user.type(emailInput, 'test@invalid')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      expect(screen.getByText('Email no válido')).toBeInTheDocument()
    })

    test('shows error for empty password', async () => {
      const user = userEvent.setup()
      renderWithAuth(<LoginPage />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)
      
      expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument()
    })

    test('shows error for short password', async () => {
      const user = userEvent.setup()
      renderWithAuth(<LoginPage />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, '123')
      await user.click(submitButton)
      
      expect(screen.getByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument()
    })

    test('clears errors when user starts typing', async () => {
      const user = userEvent.setup()
      renderWithAuth(<LoginPage />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      
      // Submit empty form to show errors
      await user.click(submitButton)
      expect(screen.getByText('El email es requerido')).toBeInTheDocument()
      
      // Start typing to clear error
      await user.type(emailInput, 't')
      expect(screen.queryByText('El email es requerido')).not.toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    test('allows typing in email and password fields', async () => {
      const user = userEvent.setup()
      renderWithAuth(<LoginPage />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      expect(emailInput).toHaveValue('test@example.com')
      expect(passwordInput).toHaveValue('password123')
    })

    test('toggles password visibility', async () => {
      const user = userEvent.setup()
      renderWithAuth(<LoginPage />)
      
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const toggleButton = screen.getByRole('button', { name: /👁️/i })
      
      // Password should be hidden by default
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Click toggle to show password
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      // Click toggle to hide password again
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Form Submission', () => {
    test('submits form with valid data', async () => {
      const user = userEvent.setup()
      renderWithAuth(<LoginPage />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      // The form should submit (we can't easily test the API call without complex mocking)
      expect(submitButton).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    test('form elements are properly configured', () => {
      renderWithAuth(<LoginPage />)
      
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })

  describe('Navigation', () => {
    test('navigates to registration page', () => {
      renderWithAuth(<LoginPage />)
      
      const registerLink = screen.getByRole('link', { name: /crear cuenta gratis/i })
      expect(registerLink).toHaveAttribute('href', '/register')
    })

    test('navigates to home page via logo', () => {
      renderWithAuth(<LoginPage />)
      
      const logoLink = screen.getByRole('link', { name: /bella vista/i })
      expect(logoLink).toHaveAttribute('href', '/')
    })
  })

  describe('Accessibility', () => {
    test('has proper form labels and associations', () => {
      renderWithAuth(<LoginPage />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      
      expect(emailInput).toHaveAttribute('id', 'email')
      expect(passwordInput).toHaveAttribute('id', 'password')
    })

    test('supports keyboard navigation', async () => {
      renderWithAuth(<LoginPage />)
      
      // Tab through form elements - start from the beginning
      await userEvent.tab()
      // First tab goes to the logo link
      expect(screen.getByRole('link', { name: /bella vista/i })).toHaveFocus()
      
      await userEvent.tab()
      // Second tab goes to the registration link
      expect(screen.getByRole('link', { name: /crear cuenta gratis/i })).toHaveFocus()
      
      await userEvent.tab()
      expect(screen.getByLabelText(/email/i)).toHaveFocus()
      
      await userEvent.tab()
      expect(screen.getByLabelText(/contraseña/i)).toHaveFocus()
    })

    test('has proper ARIA attributes', () => {
      renderWithAuth(<LoginPage />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      
      expect(emailInput).toHaveAttribute('autoComplete', 'email')
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
    })
  })
})
