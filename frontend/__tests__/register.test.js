import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterPage from '../pages/register'
import { AuthContext } from '../contexts/AuthContext'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      route: '/register',
      pathname: '/register',
      query: {},
      asPath: '/register',
    }
  },
}))

// Mock the AuthContext
const mockAuthContext = {
  register: jest.fn(),
  user: null,
  isAuthenticated: false,
}

// Helper function to render with context
const renderWithAuth = (ui, contextValue = mockAuthContext) => {
  return render(
    <AuthContext.Provider value={contextValue}>
      {ui}
    </AuthContext.Provider>
  )
}

describe('RegisterPage Component', () => {
  let user
  let mockRouter

  beforeEach(() => {
    user = userEvent.setup()
    jest.clearAllMocks()
    
    // Reset mock router
    const { useRouter } = require('next/router')
    mockRouter = useRouter()
  })

  describe('Initial Rendering', () => {
    test('renders registration form with all required elements', () => {
      renderWithAuth(<RegisterPage />)
      
      // Check main elements
      expect(screen.getByText('Bella Vista')).toBeInTheDocument()
      expect(screen.getByText('¡Únete a Bella Vista!')).toBeInTheDocument()
      expect(screen.getByText('Crea tu cuenta gratis y disfruta de entregas rápidas, ofertas exclusivas y un historial completo de tus pedidos favoritos.')).toBeInTheDocument()
      
      // Check form elements
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /acepto los términos/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument()
    })

    test('displays proper form labels and placeholders', () => {
      renderWithAuth(<RegisterPage />)
      
      const firstNameInput = screen.getByLabelText(/nombre/i)
      const lastNameInput = screen.getByLabelText(/apellido/i)
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/teléfono/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i)
      
      expect(firstNameInput).toHaveAttribute('placeholder', 'Juan')
      expect(lastNameInput).toHaveAttribute('placeholder', 'Pérez')
      expect(emailInput).toHaveAttribute('placeholder', 'juan@email.com')
      expect(phoneInput).toHaveAttribute('placeholder', '+34 123 456 789')
      expect(passwordInput).toHaveAttribute('placeholder', '••••••••')
      expect(confirmPasswordInput).toHaveAttribute('placeholder', '••••••••')
    })

    test('shows login link for existing users', () => {
      renderWithAuth(<RegisterPage />)
      
      expect(screen.getByText('¿Ya tienes cuenta?')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /inicia sesión aquí/i })).toBeInTheDocument()
    })

    test('shows social registration options', () => {
      renderWithAuth(<RegisterPage />)
      
      expect(screen.getByText('O regístrate con')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /🔍 google/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /📘 facebook/i })).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    describe('First Name Validation', () => {
      test('shows error for empty first name', async () => {
        renderWithAuth(<RegisterPage />)
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('El nombre es requerido')).toBeInTheDocument()
      })

      test('shows error for first name too short', async () => {
        renderWithAuth(<RegisterPage />)
        
        const firstNameInput = screen.getByLabelText(/nombre/i)
        await user.type(firstNameInput, 'A')
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('El nombre debe tener al menos 2 caracteres')).toBeInTheDocument()
      })

      test('shows error for first name with numbers', async () => {
        renderWithAuth(<RegisterPage />)
        
        const firstNameInput = screen.getByLabelText(/nombre/i)
        await user.type(firstNameInput, 'John123')
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('El nombre no puede contener números')).toBeInTheDocument()
      })

      test('shows error for first name with invalid characters', async () => {
        renderWithAuth(<RegisterPage />)
        
        const firstNameInput = screen.getByLabelText(/nombre/i)
        await user.type(firstNameInput, 'John@')
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('El nombre solo puede contener letras, espacios, guiones y apóstrofes')).toBeInTheDocument()
      })

      test('shows error for first name too long', async () => {
        renderWithAuth(<RegisterPage />)
        
        const firstNameInput = screen.getByLabelText(/nombre/i)
        await user.type(firstNameInput, 'A'.repeat(51))
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('El nombre no puede exceder 50 caracteres')).toBeInTheDocument()
      })
    })

    describe('Last Name Validation', () => {
      test('shows error for empty last name', async () => {
        renderWithAuth(<RegisterPage />)
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('El apellido es requerido')).toBeInTheDocument()
      })

      test('shows error for last name too short', async () => {
        renderWithAuth(<RegisterPage />)
        
        const lastNameInput = screen.getByLabelText(/apellido/i)
        await user.type(lastNameInput, 'B')
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('El apellido debe tener al menos 2 caracteres')).toBeInTheDocument()
      })

      test('shows error for last name with numbers', async () => {
        renderWithAuth(<RegisterPage />)
        
        const lastNameInput = screen.getByLabelText(/apellido/i)
        await user.type(lastNameInput, 'Doe123')
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('El apellido no puede contener números')).toBeInTheDocument()
      })
    })

    describe('Email Validation', () => {
      test('shows error for empty email', async () => {
        renderWithAuth(<RegisterPage />)
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('El email es requerido')).toBeInTheDocument()
      })

      test('shows error for invalid email format', async () => {
        renderWithAuth(<RegisterPage />)
        
        const emailInput = screen.getByLabelText(/email/i)
        await user.type(emailInput, 'invalid-email')
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('Email no válido')).toBeInTheDocument()
      })
    })

    describe('Phone Validation', () => {
      test('shows error for empty phone', async () => {
        renderWithAuth(<RegisterPage />)
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('El teléfono es requerido')).toBeInTheDocument()
      })

      test('shows error for invalid phone format', async () => {
        renderWithAuth(<RegisterPage />)
        
        const phoneInput = screen.getByLabelText(/teléfono/i)
        await user.type(phoneInput, '123')
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('Número de teléfono no válido')).toBeInTheDocument()
      })

      test('accepts valid phone formats', async () => {
        renderWithAuth(<RegisterPage />)
        
        const phoneInput = screen.getByLabelText(/teléfono/i)
        
        // Test various valid formats
        const validPhones = ['+34612345678', '+34 612 345 678', '612345678', '+34-612-345-678']
        
        for (const phone of validPhones) {
          await user.clear(phoneInput)
          await user.type(phoneInput, phone)
          
          // Should not show error for valid formats
          expect(screen.queryByText('Número de teléfono no válido')).not.toBeInTheDocument()
        }
      })
    })

    describe('Password Validation', () => {
      test('shows error for empty password', async () => {
        renderWithAuth(<RegisterPage />)
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument()
      })

      test('shows error for password too short', async () => {
        renderWithAuth(<RegisterPage />)
        
        const passwordInput = screen.getByLabelText(/contraseña/i)
        await user.type(passwordInput, '123')
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument()
      })

      test('shows error for password without required character types', async () => {
        renderWithAuth(<RegisterPage />)
        
        const passwordInput = screen.getByLabelText(/contraseña/i)
        await user.type(passwordInput, 'password123') // No uppercase
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('La contraseña debe contener mayúsculas, minúsculas y números')).toBeInTheDocument()
      })
    })

    describe('Confirm Password Validation', () => {
      test('shows error for empty confirm password', async () => {
        renderWithAuth(<RegisterPage />)
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('Confirma tu contraseña')).toBeInTheDocument()
      })

      test('shows error for mismatched passwords', async () => {
        renderWithAuth(<RegisterPage />)
        
        const passwordInput = screen.getByLabelText(/contraseña/i)
        const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i)
        
        await user.type(passwordInput, 'Password123')
        await user.type(confirmPasswordInput, 'DifferentPassword123')
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
      })
    })

    describe('Terms and Conditions', () => {
      test('shows error for unchecked terms', async () => {
        renderWithAuth(<RegisterPage />)
        
        const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
        await user.click(submitButton)
        
        expect(screen.getByText('Debes aceptar los términos y condiciones')).toBeInTheDocument()
      })
    })
  })

  describe('Password Strength Indicator', () => {
    test('shows password strength indicator when typing', async () => {
      renderWithAuth(<RegisterPage />)
      
      const passwordInput = screen.getByLabelText(/contraseña/i)
      await user.type(passwordInput, 'weak')
      
      // Should show strength indicator
      expect(screen.getByText('Seguridad:')).toBeInTheDocument()
      expect(screen.getByText('Débil')).toBeInTheDocument()
    })

    test('updates password strength as user types', async () => {
      renderWithAuth(<RegisterPage />)
      
      const passwordInput = screen.getByLabelText(/contraseña/i)
      
      // Start with weak password
      await user.type(passwordInput, 'weak')
      expect(screen.getByText('Débil')).toBeInTheDocument()
      
      // Clear and type stronger password
      await user.clear(passwordInput)
      await user.type(passwordInput, 'StrongPass123')
      expect(screen.getByText('Muy fuerte')).toBeInTheDocument()
    })

    test('shows correct strength colors', async () => {
      renderWithAuth(<RegisterPage />)
      
      const passwordInput = screen.getByLabelText(/contraseña/i)
      
      // Test different strength levels
      const testCases = [
        { password: 'weak', expectedStrength: 'Débil' },
        { password: 'StrongPass', expectedStrength: 'Regular' },
        { password: 'StrongPass123', expectedStrength: 'Fuerte' },
        { password: 'StrongPass123!', expectedStrength: 'Muy fuerte' }
      ]
      
      for (const { password, expectedStrength } of testCases) {
        await user.clear(passwordInput)
        await user.type(passwordInput, password)
        expect(screen.getByText(expectedStrength)).toBeInTheDocument()
      }
    })
  })

  describe('User Interactions', () => {
    test('allows user to type in all form fields', async () => {
      renderWithAuth(<RegisterPage />)
      
      const firstNameInput = screen.getByLabelText(/nombre/i)
      const lastNameInput = screen.getByLabelText(/apellido/i)
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/teléfono/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i)
      
      await user.type(firstNameInput, 'John')
      await user.type(lastNameInput, 'Doe')
      await user.type(emailInput, 'john@example.com')
      await user.type(phoneInput, '+1234567890')
      await user.type(passwordInput, 'Password123')
      await user.type(confirmPasswordInput, 'Password123')
      
      expect(firstNameInput.value).toBe('John')
      expect(lastNameInput.value).toBe('Doe')
      expect(emailInput.value).toBe('john@example.com')
      expect(phoneInput.value).toBe('+1234567890')
      expect(passwordInput.value).toBe('Password123')
      expect(confirmPasswordInput.value).toBe('Password123')
    })

    test('toggles password visibility for both password fields', async () => {
      renderWithAuth(<RegisterPage />)
      
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i)
      
      // Password field
      const passwordToggle = screen.getByRole('button', { name: /👁️/i })
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      await user.click(passwordToggle)
      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(screen.getByRole('button', { name: /🙈/i })).toBeInTheDocument()
      
      // Confirm password field
      const confirmPasswordToggle = screen.getAllByRole('button', { name: /👁️/i })[1] || 
                                   screen.getAllByRole('button', { name: /🙈/i })[1]
      
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      await user.click(confirmPasswordToggle)
      expect(confirmPasswordInput).toHaveAttribute('type', 'text')
    })

    test('handles terms and conditions checkbox', async () => {
      renderWithAuth(<RegisterPage />)
      
      const termsCheckbox = screen.getByRole('checkbox', { name: /acepto los términos/i })
      
      expect(termsCheckbox).not.toBeChecked()
      await user.click(termsCheckbox)
      expect(termsCheckbox).toBeChecked()
    })

    test('clears errors when user starts typing', async () => {
      renderWithAuth(<RegisterPage />)
      
      const firstNameInput = screen.getByLabelText(/nombre/i)
      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      
      // Trigger error
      await user.click(submitButton)
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument()
      
      // Start typing to clear error
      await user.type(firstNameInput, 'J')
      expect(screen.queryByText('El nombre es requerido')).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    test('submits form with valid data', async () => {
      const mockRegister = jest.fn().mockResolvedValue({
        success: true,
        user: { id: 1, email: 'john@example.com' }
      })
      
      renderWithAuth(<RegisterPage />, { ...mockAuthContext, register: mockRegister })
      
      // Fill form with valid data
      const firstNameInput = screen.getByLabelText(/nombre/i)
      const lastNameInput = screen.getByLabelText(/apellido/i)
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/teléfono/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i)
      const termsCheckbox = screen.getByRole('checkbox', { name: /acepto los términos/i })
      
      await user.type(firstNameInput, 'John')
      await user.type(lastNameInput, 'Doe')
      await user.type(emailInput, 'john@example.com')
      await user.type(phoneInput, '+1234567890')
      await user.type(passwordInput, 'Password123')
      await user.type(confirmPasswordInput, 'Password123')
      await user.click(termsCheckbox)
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          password: 'Password123'
        })
      })
    })

    test('redirects to home page on successful registration', async () => {
      const mockRegister = jest.fn().mockResolvedValue({
        success: true,
        user: { id: 1, email: 'john@example.com' }
      })
      
      renderWithAuth(<RegisterPage />, { ...mockAuthContext, register: mockRegister })
      
      // Fill and submit form
      await fillValidForm(user)
      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })
    })

    test('shows error message on registration failure', async () => {
      const mockRegister = jest.fn().mockResolvedValue({
        success: false,
        error: 'Email already exists'
      })
      
      renderWithAuth(<RegisterPage />, { ...mockAuthContext, register: mockRegister })
      
      // Fill and submit form
      await fillValidForm(user)
      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument()
      })
    })

    test('shows connection error on network failure', async () => {
      const mockRegister = jest.fn().mockRejectedValue(new Error('Network error'))
      
      renderWithAuth(<RegisterPage />, { ...mockAuthContext, register: mockRegister })
      
      // Fill and submit form
      await fillValidForm(user)
      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Error de conexión. Inténtalo de nuevo.')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    test('shows loading state during form submission', async () => {
      const mockRegister = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          user: { id: 1, email: 'john@example.com' }
        }), 100))
      )
      
      renderWithAuth(<RegisterPage />, { ...mockAuthContext, register: mockRegister })
      
      // Fill form
      await fillValidForm(user)
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)
      
      // Should show loading state
      expect(screen.getByText('Creando cuenta...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /creando cuenta.../i })).toBeDisabled()
    })

    test('disables submit button during loading', async () => {
      const mockRegister = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          user: { id: 1, email: 'john@example.com' }
        }), 100))
      )
      
      renderWithAuth(<RegisterPage />, { ...mockAuthContext, register: mockRegister })
      
      // Fill form
      await fillValidForm(user)
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)
      
      // Button should be disabled
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveClass('bg-gray-400', 'cursor-not-allowed')
    })
  })

  describe('Navigation and Links', () => {
    test('has link to login page', () => {
      renderWithAuth(<RegisterPage />)
      
      const loginLink = screen.getByRole('link', { name: /inicia sesión aquí/i })
      expect(loginLink).toHaveAttribute('href', '/login')
    })

    test('has link back to home page', () => {
      renderWithAuth(<RegisterPage />)
      
      const homeLink = screen.getByRole('link', { name: /← volver al inicio/i })
      expect(homeLink).toHaveAttribute('href', '/')
    })

    test('has terms and conditions links', () => {
      renderWithAuth(<RegisterPage />)
      
      expect(screen.getByText('términos y condiciones')).toBeInTheDocument()
      expect(screen.getByText('política de privacidad')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has proper form labels and associations', () => {
      renderWithAuth(<RegisterPage />)
      
      const firstNameInput = screen.getByLabelText(/nombre/i)
      const lastNameInput = screen.getByLabelText(/apellido/i)
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/teléfono/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i)
      
      expect(firstNameInput).toHaveAttribute('id', 'firstName')
      expect(lastNameInput).toHaveAttribute('id', 'lastName')
      expect(emailInput).toHaveAttribute('id', 'email')
      expect(phoneInput).toHaveAttribute('id', 'phone')
      expect(passwordInput).toHaveAttribute('id', 'password')
      expect(confirmPasswordInput).toHaveAttribute('id', 'confirmPassword')
    })

    test('has proper ARIA attributes', () => {
      renderWithAuth(<RegisterPage />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/teléfono/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i)
      
      expect(emailInput).toHaveAttribute('autoComplete', 'email')
      expect(phoneInput).toHaveAttribute('autoComplete', 'tel')
      expect(passwordInput).toHaveAttribute('autoComplete', 'new-password')
      expect(confirmPasswordInput).toHaveAttribute('autoComplete', 'new-password')
    })

    test('supports keyboard navigation', async () => {
      renderWithAuth(<RegisterPage />)
      
      // Tab through form elements
      await user.tab()
      expect(screen.getByLabelText(/nombre/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/apellido/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/email/i)).toHaveFocus()
    })
  })

  describe('Error Handling', () => {
    test('prevents form submission with invalid data', async () => {
      const mockRegister = jest.fn()
      
      renderWithAuth(<RegisterPage />, { ...mockAuthContext, register: mockRegister })
      
      // Try to submit without filling form
      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)
      
      // Should not call register function
      expect(mockRegister).not.toHaveBeenCalled()
    })

    test('shows multiple validation errors at once', async () => {
      renderWithAuth(<RegisterPage />)
      
      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)
      
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument()
      expect(screen.getByText('El apellido es requerido')).toBeInTheDocument()
      expect(screen.getByText('El email es requerido')).toBeInTheDocument()
      expect(screen.getByText('El teléfono es requerido')).toBeInTheDocument()
      expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument()
      expect(screen.getByText('Confirma tu contraseña')).toBeInTheDocument()
      expect(screen.getByText('Debes aceptar los términos y condiciones')).toBeInTheDocument()
    })
  })
})

// Helper function to fill form with valid data
async function fillValidForm(user) {
  const firstNameInput = screen.getByLabelText(/nombre/i)
  const lastNameInput = screen.getByLabelText(/apellido/i)
  const emailInput = screen.getByLabelText(/email/i)
  const phoneInput = screen.getByLabelText(/teléfono/i)
  const passwordInput = screen.getByLabelText(/contraseña/i)
  const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i)
  const termsCheckbox = screen.getByRole('checkbox', { name: /acepto los términos/i })
  
  await user.type(firstNameInput, 'John')
  await user.type(lastNameInput, 'Doe')
  await user.type(emailInput, 'john@example.com')
  await user.type(phoneInput, '+1234567890')
  await user.type(passwordInput, 'Password123')
  await user.type(confirmPasswordInput, 'Password123')
  await user.click(termsCheckbox)
}
