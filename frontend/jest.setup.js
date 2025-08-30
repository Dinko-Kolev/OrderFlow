import '@testing-library/jest-dom'

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  reload: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
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

// Mock api.js
jest.mock('./lib/api', () => ({
  default: {
    orders: {
      create: jest.fn(),
    },
    cart: {
      addItem: jest.fn(),
      updateItem: jest.fn(),
      removeItem: jest.fn(),
    },
    setAuthToken: jest.fn(),
    clearAuthToken: jest.fn(),
    clearCache: jest.fn(),
    auth: {
      login: jest.fn(),
      register: jest.fn(),
      getProfile: jest.fn(),
    },
    reservations: {
      getAvailability: jest.fn(),
      create: jest.fn(),
    },
  },
}))

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
