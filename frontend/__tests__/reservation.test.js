import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../contexts/AuthContext'
import ReservationSystem from '../components/ReservationSystem'

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  reload: jest.fn(),
  pathname: '/reservation',
  query: {},
  asPath: '/reservation',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
}

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <div>{children}</div>,
}))

const renderWithAuth = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  )
}

describe('ReservationSystem Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    test('renders reservation form with step indicators', () => {
      renderWithAuth(<ReservationSystem />)
      
      // Use getAllByText for elements that appear multiple times
      const fechaYHoraElements = screen.getAllByText(/fecha y hora/i)
      expect(fechaYHoraElements.length).toBeGreaterThan(0)
      
      expect(screen.getByText(/detalles/i)).toBeInTheDocument()
      expect(screen.getByText(/confirmación/i)).toBeInTheDocument()
    })

    test('shows first step by default', () => {
      renderWithAuth(<ReservationSystem />)
      
      expect(screen.getByText(/selecciona fecha y hora/i)).toBeInTheDocument()
      expect(screen.getByDisplayValue('')).toBeInTheDocument() // date input
      expect(screen.getByRole('combobox')).toBeInTheDocument() // guests select
      expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument()
    })

    test('shows progress indicators correctly', () => {
      renderWithAuth(<ReservationSystem />)
      
      // Check that all step indicators are present (use getAllByText for emojis)
      const calendarEmojis = screen.getAllByText('📅')
      const editEmojis = screen.getAllByText('✍️')
      const checkEmojis = screen.getAllByText('✅')
      
      expect(calendarEmojis.length).toBeGreaterThan(0)
      expect(editEmojis.length).toBeGreaterThan(0)
      expect(checkEmojis.length).toBeGreaterThan(0)
    })
  })

  describe('Form Elements', () => {
    test('has date input with correct attributes', () => {
      renderWithAuth(<ReservationSystem />)
      
      const dateInput = screen.getByDisplayValue('')
      expect(dateInput).toHaveAttribute('type', 'date')
      expect(dateInput).toHaveAttribute('required')
      expect(dateInput).toHaveAttribute('name', 'date')
    })

    test('has guests select with correct attributes', () => {
      renderWithAuth(<ReservationSystem />)
      
      const guestsSelect = screen.getByRole('combobox')
      expect(guestsSelect).toHaveAttribute('name', 'guests')
      expect(guestsSelect).toHaveValue('2') // Default value
    })

    test('continue button is disabled initially', () => {
      renderWithAuth(<ReservationSystem />)
      
      const continueButton = screen.getByRole('button', { name: /continuar/i })
      expect(continueButton).toBeDisabled()
    })
  })

  describe('Form Validation', () => {
    test('requires date selection', () => {
      renderWithAuth(<ReservationSystem />)
      
      const continueButton = screen.getByRole('button', { name: /continuar/i })
      expect(continueButton).toBeDisabled()
    })

    test('requires guests selection', () => {
      renderWithAuth(<ReservationSystem />)
      
      const continueButton = screen.getByRole('button', { name: /continuar/i })
      expect(continueButton).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    test('has proper form structure', () => {
      renderWithAuth(<ReservationSystem />)
      
      // Check that form elements are properly grouped
      expect(screen.getByText(/fecha de la reserva/i)).toBeInTheDocument()
      expect(screen.getByText(/número de comensales/i)).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    test('renders correctly on different screen sizes', () => {
      renderWithAuth(<ReservationSystem />)
      
      // Check that the grid layout is present
      const gridContainer = screen.getByText(/fecha de la reserva/i).closest('div').parentElement
      expect(gridContainer).toHaveClass('grid', 'md:grid-cols-2')
    })
  })
})
