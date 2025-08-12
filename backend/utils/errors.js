/**
 * Custom Error Classes for OrderFlow Backend
 * Provides structured error handling and debugging
 */

/**
 * Base application error
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.timestamp = new Date().toISOString()
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Validation error for invalid input data
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, true)
    this.details = details
    this.name = 'ValidationError'
  }
}

/**
 * Database operation error
 */
class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, true)
    this.originalError = originalError
    this.name = 'DatabaseError'
  }
}

/**
 * Authentication error
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, true)
    this.name = 'AuthenticationError'
  }
}

/**
 * Authorization error
 */
class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, true)
    this.name = 'AuthorizationError'
  }
}

/**
 * Resource not found error
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, true)
    this.name = 'NotFoundError'
  }
}

/**
 * Conflict error (e.g., duplicate entry)
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, true)
    this.name = 'ConflictError'
  }
}

/**
 * Rate limiting error
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, true)
    this.name = 'RateLimitError'
  }
}

/**
 * Error handler middleware
 */
const errorHandler = (error, req, res, next) => {
  // Log error
  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // Handle known errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(error.details && { details: error.details }),
      ...(error.originalError && { originalError: error.originalError.message })
    })
  }

  // Handle database errors
  if (error.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry found',
      details: error.detail
    })
  }

  if (error.code === '23503') { // Foreign key constraint violation
    return res.status(400).json({
      success: false,
      error: 'Referenced resource does not exist',
      details: error.detail
    })
  }

  // Handle validation errors from external libraries
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.message
    })
  }

  // Handle unknown errors
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  res.status(500).json({
    success: false,
    error: isDevelopment ? error.message : 'Internal server error',
    ...(isDevelopment && { stack: error.stack })
  })
}

/**
 * Async error wrapper for route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

module.exports = {
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  asyncHandler
}
