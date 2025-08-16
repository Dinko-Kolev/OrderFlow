const { logger } = require('../utils/errors');

/**
 * ValidationService - Handles input validation and sanitization for security
 * Implements enterprise-level validation patterns used by major companies
 */
class ValidationService {
    constructor() {
        // Email validation patterns
        this.emailPatterns = {
            // RFC 5322 compliant email regex
            basic: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
            // Disposable email domains (common ones)
            disposableDomains: [
                '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
                'tempmail.org', 'throwawaymail.com', 'yopmail.com',
                'temp-mail.org', 'sharklasers.com', 'getairmail.com'
            ]
        };

        // Phone validation patterns
        this.phonePatterns = {
            // International phone format (E.164)
            international: /^\+[1-9]\d{1,14}$/,
            // US/Canada format
            northAmerica: /^\+1[2-9]\d{9}$/,
            // European format
            european: /^\+[3-4][0-9]{1,14}$/,
            // Simple numeric format (e.g., 1234567890)
            simple: /^\d{10,15}$/,
            // Local format (e.g., 123-456-7890)
            local: /^\d{3}-\d{3}-\d{4}$/,
            // Suspicious patterns (e.g., 1234567890123456)
            suspicious: /^\d{16,}$/
        };

        // Rate limiting storage
        this.rateLimitStore = new Map();
    }

    /**
     * Validate email address with comprehensive checks
     * @param {string} email - Email address to validate
     * @returns {Object} Validation result with details
     */
    validateEmail(email) {
        try {
            if (!email || typeof email !== 'string') {
                return {
                    isValid: false,
                    errors: ['Email is required and must be a string'],
                    score: 0
                };
            }

            const trimmedEmail = email.trim().toLowerCase();
            const errors = [];
            let score = 100;

            // Basic format validation
            if (!this.emailPatterns.basic.test(trimmedEmail)) {
                errors.push('Invalid email format');
                score -= 50;
            }

            // Length validation
            if (trimmedEmail.length > 254) {
                errors.push('Email address too long (max 254 characters)');
                score -= 30;
            }

            // Domain validation
            const domain = trimmedEmail.split('@')[1];
            if (domain) {
                // Check for disposable domains
                if (this.emailPatterns.disposableDomains.includes(domain)) {
                    errors.push('Disposable email addresses are not allowed');
                    score -= 40;
                }

                // Check domain length
                if (domain.length > 63) {
                    errors.push('Email domain too long');
                    score -= 20;
                }

                // Check for valid TLD
                if (!domain.includes('.') || domain.split('.').pop().length < 2) {
                    errors.push('Invalid email domain format');
                    score -= 30;
                }
            }

            // Check for common spam patterns
            if (trimmedEmail.includes('..') || trimmedEmail.includes('--')) {
                errors.push('Email contains invalid consecutive characters');
                score -= 20;
            }

            // Final score adjustment
            if (score < 0) score = 0;

            return {
                isValid: errors.length === 0,
                errors,
                score,
                sanitizedEmail: errors.length === 0 ? trimmedEmail : null
            };
        } catch (error) {
            logger.error('Email validation error:', error);
            return {
                isValid: false,
                errors: ['Email validation failed due to system error'],
                score: 0
            };
        }
    }

    /**
     * Sanitize email address for safe storage
     * @param {string} email - Email address to sanitize
     * @returns {string|null} Sanitized email or null if invalid
     */
    sanitizeEmail(email) {
        try {
            const validation = this.validateEmail(email);
            if (validation.isValid) {
                return validation.sanitizedEmail;
            }
            return null;
        } catch (error) {
            logger.error('Email sanitization error:', error);
            return null;
        }
    }

    /**
     * Validate phone number with flexible format support
     * @param {string} phone - Phone number to validate
     * @returns {Object} Validation result with details
     */
    validatePhone(phone) {
        try {
            if (!phone || typeof phone !== 'string') {
                return {
                    isValid: false,
                    errors: ['Phone number is required and must be a string'],
                    score: 0
                };
            }

            const cleanedPhone = phone.replace(/[\s\-\(\)\.]/g, '');
            const errors = [];
            let score = 100;

            // More flexible phone validation - allow common formats
            const isValidFormat = this.phonePatterns.international.test(cleanedPhone) || 
                                this.phonePatterns.local.test(cleanedPhone) ||
                                this.phonePatterns.simple.test(cleanedPhone);

            if (!isValidFormat) {
                // In development, be more lenient
                if (process.env.NODE_ENV === 'development') {
                    // Allow simple numeric formats for development
                    if (/^\d{7,15}$/.test(cleanedPhone)) {
                        console.log('🔄 Development mode: Allowing simple phone format:', cleanedPhone);
                    } else {
                        errors.push('Phone number format not recognized. Please use a valid phone number format.');
                        score -= 30;
                    }
                } else {
                    // Production: Require proper format
                    errors.push('Phone number must be in a valid format (e.g., +1234567890 or 123-456-7890)');
                    score -= 40;
                }
            }

            // Length validation (E.164 standard: max 15 digits including country code)
            if (cleanedPhone.length > 16) {
                errors.push('Phone number too long (max 16 characters including +)');
                score -= 30;
            }

            // Minimum length check
            if (cleanedPhone.length < 7) {
                errors.push('Phone number too short (min 7 digits)');
                score -= 30;
            }

            // Check for suspicious patterns
            if (this.phonePatterns.suspicious.test(cleanedPhone)) {
                errors.push('Phone number contains suspicious patterns');
                score -= 50;
            }

            // Check for repeated digits (potential spam)
            if (/(\d)\1{4,}/.test(cleanedPhone)) {
                errors.push('Phone number contains too many repeated digits');
                score -= 30;
            }

            // Final score adjustment
            if (score < 0) score = 0;

            return {
                isValid: errors.length === 0,
                errors,
                score,
                sanitizedPhone: errors.length === 0 ? cleanedPhone : null
            };
        } catch (error) {
            console.error('Phone validation error:', error);
            return {
                isValid: false,
                errors: ['Phone validation failed due to system error'],
                score: 0
            };
        }
    }

    /**
     * Sanitize phone number for safe storage
     * @param {string} phone - Phone number to sanitize
     * @returns {string|null} Sanitized phone or null if invalid
     */
    sanitizePhone(phone) {
        try {
            const validation = this.validatePhone(phone);
            if (validation.isValid) {
                return validation.sanitizedPhone;
            }
            return null;
        } catch (error) {
            logger.error('Phone sanitization error:', error);
            return null;
        }
    }

    /**
     * Validate address with basic format and delivery zone checks
     * @param {string} address - Address to validate
     * @returns {Object} Validation result with details
     */
    validateAddress(address) {
        try {
            if (!address || typeof address !== 'string') {
                return {
                    isValid: false,
                    errors: ['Address is required and must be a string'],
                    score: 0
                };
            }

            const trimmedAddress = address.trim();
            const errors = [];
            let score = 100;

            // Length validation
            if (trimmedAddress.length < 10) {
                errors.push('Address too short (minimum 10 characters)');
                score -= 30;
            }

            if (trimmedAddress.length > 200) {
                errors.push('Address too long (maximum 200 characters)');
                score -= 20;
            }

            // Check for required address components
            const hasStreetNumber = /\d/.test(trimmedAddress);
            const hasStreetName = /[a-zA-Z]/.test(trimmedAddress);
            const hasCityState = /[a-zA-Z]{2,}/.test(trimmedAddress);

            if (!hasStreetNumber) {
                errors.push('Address must include street number');
                score -= 25;
            }

            if (!hasStreetName) {
                errors.push('Address must include street name');
                score -= 25;
            }

            if (!hasCityState) {
                errors.push('Address must include city and state');
                score -= 20;
            }

            // Check for suspicious patterns (less strict)
            const suspiciousPatterns = [
                /test\s+address/i,
                /fake\s+address/i,
                /example\s+address/i,
                /dummy\s+address/i,
                /sample\s+address/i
            ];
            
            const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(trimmedAddress));
            if (hasSuspiciousPattern) {
                errors.push('Address appears to be invalid');
                score -= 40;
            }

            // Final score adjustment
            if (score < 0) score = 0;

            return {
                isValid: errors.length === 0,
                errors,
                score,
                sanitizedAddress: errors.length === 0 ? trimmedAddress : null
            };
        } catch (error) {
            logger.error('Address validation error:', error);
            return {
                isValid: false,
                errors: ['Address validation failed due to system error'],
                score: 0
            };
        }
    }

    /**
     * Sanitize address for safe storage
     * @param {string} address - Address to sanitize
     * @returns {string|null} Sanitized address or null if invalid
     */
    sanitizeAddress(address) {
        try {
            const validation = this.validateAddress(address);
            if (validation.isValid) {
                return validation.sanitizedAddress;
            }
            return null;
        } catch (error) {
            logger.error('Address sanitization error:', error);
            return null;
        }
    }

    /**
     * Comprehensive validation for order data
     * @param {Object} orderData - Order data to validate
     * @returns {Object} Validation result with details
     */
    validateOrderData(orderData) {
        try {
            // Handle null/undefined input
            if (!orderData || typeof orderData !== 'object') {
                return {
                    isValid: false,
                    errors: ['Order data is required and must be an object'],
                    warnings: [],
                    score: 0,
                    sanitizedData: null
                };
            }

            const errors = [];
            const warnings = [];
            let overallScore = 100;

            // Validate customer information
            if (orderData.customer_email) {
                const emailValidation = this.validateEmail(orderData.customer_email);
                if (!emailValidation.isValid) {
                    errors.push(`Email validation failed: ${emailValidation.errors.join(', ')}`);
                    overallScore -= 20;
                }
            }

            if (orderData.customer_phone) {
                const phoneValidation = this.validatePhone(orderData.customer_phone);
                if (!phoneValidation.isValid) {
                    errors.push(`Phone validation failed: ${phoneValidation.errors.join(', ')}`);
                    overallScore -= 20;
                }
            }

            if (orderData.delivery_address_text && orderData.order_type === 'delivery') {
                const addressValidation = this.validateAddress(orderData.delivery_address_text);
                if (!addressValidation.isValid) {
                    errors.push(`Address validation failed: ${addressValidation.errors.join(', ')}`);
                    overallScore -= 25;
                }
            }

            // Validate order details
            if (!orderData.order_type || !['delivery', 'pickup', 'dine_in'].includes(orderData.order_type)) {
                errors.push('Invalid order type');
                overallScore -= 30;
            }

            if (!orderData.customer_name || orderData.customer_name.trim().length < 2) {
                errors.push('Customer name is required and must be at least 2 characters');
                overallScore -= 25;
            }

            // Final score adjustment
            if (overallScore < 0) overallScore = 0;

            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                score: overallScore,
                sanitizedData: errors.length === 0 ? this.sanitizeOrderData(orderData) : null
            };
        } catch (error) {
            console.error('Order data validation error:', error);
            return {
                isValid: false,
                errors: ['Order validation failed due to system error'],
                warnings: [],
                score: 0,
                sanitizedData: null
            };
        }
    }

    /**
     * Sanitize order data for safe storage
     * @param {Object} orderData - Order data to sanitize
     * @returns {Object} Sanitized order data
     */
    sanitizeOrderData(orderData) {
        try {
            const sanitized = { ...orderData };

            // Sanitize string fields
            if (sanitized.customer_name) {
                sanitized.customer_name = sanitized.customer_name.trim().replace(/[<>]/g, '');
            }

            if (sanitized.customer_email) {
                sanitized.customer_email = this.sanitizeEmail(sanitized.customer_email);
            }

            if (sanitized.customer_phone) {
                sanitized.customer_phone = this.sanitizePhone(sanitized.customer_phone);
            }

            if (sanitized.delivery_address_text) {
                sanitized.delivery_address_text = this.sanitizeAddress(sanitized.delivery_address_text);
            }

            if (sanitized.special_instructions) {
                sanitized.special_instructions = sanitized.special_instructions.trim().replace(/[<>]/g, '');
            }

            return sanitized;
        } catch (error) {
            logger.error('Order data sanitization error:', error);
            return orderData; // Return original data if sanitization fails
        }
    }

    /**
     * Validate reservation data with comprehensive checks
     * @param {Object} reservationData - Reservation data to validate
     * @returns {Object} Validation result with details
     */
    validateReservationData(reservationData) {
        try {
            // Handle null/undefined input
            if (!reservationData || typeof reservationData !== 'object') {
                return {
                    isValid: false,
                    errors: ['Reservation data is required and must be an object'],
                    warnings: [],
                    score: 0,
                    sanitizedData: null
                };
            }

            const errors = [];
            const warnings = [];
            let score = 100;

            // Validate customer name
            if (!reservationData.customer_name || typeof reservationData.customer_name !== 'string') {
                errors.push('Customer name is required and must be a string');
                score -= 30;
            } else {
                const nameValidation = this.validateName(reservationData.customer_name);
                if (!nameValidation.isValid) {
                    errors.push(...nameValidation.errors);
                    score -= 20;
                }
            }

            // Validate customer email
            if (!reservationData.customer_email || typeof reservationData.customer_email !== 'string') {
                errors.push('Customer email is required and must be a string');
                score -= 30;
            } else {
                const emailValidation = this.validateEmail(reservationData.customer_email);
                if (!emailValidation.isValid) {
                    errors.push(...emailValidation.errors);
                    score -= 25;
                }
            }

            // Validate customer phone
            if (!reservationData.customer_phone || typeof reservationData.customer_phone !== 'string') {
                errors.push('Customer phone is required and must be a string');
                score -= 30;
            } else {
                const phoneValidation = this.validatePhone(reservationData.customer_phone);
                if (!phoneValidation.isValid) {
                    errors.push(...phoneValidation.errors);
                    score -= 25;
                }
            }

            // Validate reservation date
            if (!reservationData.reservation_date) {
                errors.push('Reservation date is required');
                score -= 30;
            } else {
                const dateValidation = this.validateReservationDate(reservationData.reservation_date);
                if (!dateValidation.isValid) {
                    errors.push(...dateValidation.errors);
                    score -= 25;
                }
            }

            // Validate reservation time
            if (!reservationData.reservation_time) {
                errors.push('Reservation time is required');
                score -= 30;
            } else {
                const timeValidation = this.validateReservationTime(reservationData.reservation_time);
                if (!timeValidation.isValid) {
                    errors.push(...timeValidation.errors);
                    score -= 25;
                }
            }

            // Validate number of guests
            if (!reservationData.number_of_guests || typeof reservationData.number_of_guests !== 'number') {
                errors.push('Number of guests is required and must be a number');
                score -= 30;
            } else {
                if (reservationData.number_of_guests < 1) {
                    errors.push('Number of guests must be at least 1');
                    score -= 20;
                } else if (reservationData.number_of_guests > 20) {
                    errors.push('Number of guests cannot exceed 20');
                    score -= 20;
                }
            }

            // Check for suspicious patterns
            if (this.detectSuspiciousPatterns(reservationData)) {
                warnings.push('Suspicious patterns detected - monitoring recommended');
                score -= 15;
            }

            // Final score adjustment
            if (score < 0) score = 0;

            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                score,
                sanitizedData: errors.length === 0 ? this.sanitizeReservationData(reservationData) : null
            };
        } catch (error) {
            console.error('Reservation validation error:', error);
            return {
                isValid: false,
                errors: ['Reservation validation failed due to system error'],
                warnings: [],
                score: 0,
                sanitizedData: null
            };
        }
    }

    /**
     * Validate reservation date
     * @param {string} date - Date string to validate
     * @returns {Object} Validation result
     */
    validateReservationDate(date) {
        try {
            const errors = [];
            
            // Check if it's a valid date format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                errors.push('Invalid date format. Use YYYY-MM-DD');
                return { isValid: false, errors };
            }

            const reservationDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today

            // Check if date is in the past
            if (reservationDate < today) {
                errors.push('Cannot make reservations for past dates');
                return { isValid: false, errors };
            }

            // Check if date is too far in the future (e.g., 1 year)
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() + 1);
            if (reservationDate > maxDate) {
                errors.push('Cannot make reservations more than 1 year in advance');
                return { isValid: false, errors };
            }

            return { isValid: true, errors: [] };
        } catch (error) {
            return { isValid: false, errors: ['Invalid date format'] };
        }
    }

    /**
     * Validate reservation time
     * @param {string} time - Time string to validate
     * @returns {Object} Validation result
     */
    validateReservationTime(time) {
        try {
            const errors = [];
            
            // Check if it's a valid time format (HH:MM:SS or HH:MM)
            if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
                errors.push('Invalid time format. Use HH:MM or HH:MM:SS');
                return { isValid: false, errors };
            }

            const [hours, minutes] = time.split(':').map(Number);
            
            // Check if hours are valid (0-23)
            if (hours < 0 || hours > 23) {
                errors.push('Hours must be between 0 and 23');
                return { isValid: false, errors };
            }

            // Check if minutes are valid (0-59)
            if (minutes < 0 || minutes > 59) {
                errors.push('Minutes must be between 0 and 59');
                return { isValid: false, errors };
            }

            // Check if time is within business hours (e.g., 8 AM to 11 PM)
            if (hours < 8 || hours >= 23) {
                errors.push('Reservations are only available between 8:00 AM and 11:00 PM');
                return { isValid: false, errors };
            }

            return { isValid: true, errors: [] };
        } catch (error) {
            return { isValid: false, errors: ['Invalid time format'] };
        }
    }

    /**
     * Validate customer name
     * @param {string} name - Name to validate
     * @returns {Object} Validation result
     */
    validateName(name) {
        try {
            const errors = [];
            const trimmedName = name.trim();
            
            if (!trimmedName) {
                errors.push('Name is required');
                return { isValid: false, errors };
            }

            if (trimmedName.length < 2) {
                errors.push('Name must be at least 2 characters long');
                return { isValid: false, errors };
            }

            if (trimmedName.length > 100) {
                errors.push('Name cannot exceed 100 characters');
                return { isValid: false, errors };
            }

            // Allow letters, spaces, hyphens, apostrophes, and accented characters
            if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmedName)) {
                errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
                return { isValid: false, errors };
            }

            return { isValid: true, errors: [] };
        } catch (error) {
            return { isValid: false, errors: ['Name validation failed'] };
        }
    }

    /**
     * Sanitize reservation data
     * @param {Object} reservationData - Reservation data to sanitize
     * @returns {Object} Sanitized reservation data
     */
    sanitizeReservationData(reservationData) {
        try {
            return {
                customer_name: reservationData.customer_name?.trim() || '',
                customer_email: this.sanitizeEmail(reservationData.customer_email),
                customer_phone: this.sanitizePhone(reservationData.customer_phone),
                reservation_date: reservationData.reservation_date,
                reservation_time: reservationData.reservation_time,
                number_of_guests: parseInt(reservationData.number_of_guests) || 1,
                special_requests: reservationData.special_requests?.trim() || null
            };
        } catch (error) {
            console.error('Reservation data sanitization error:', error);
            return null;
        }
    }

    /**
     * Detect suspicious patterns in data
     * @param {Object} data - Data to analyze
     * @returns {boolean} True if suspicious patterns detected
     */
    detectSuspiciousPatterns(data) {
        try {
            let suspicious = false;

            // Check for repeated characters
            if (data.customer_name && /(.)\1{4,}/.test(data.customer_name)) {
                suspicious = true;
            }

            // Check for suspicious email patterns
            if (data.customer_email) {
                // Check for too many dots or special characters
                if (data.customer_email.split('.').length > 4) {
                    suspicious = true;
                }
                if (data.customer_email.split('@').length > 2) {
                    suspicious = true;
                }
            }

            // Check for suspicious phone patterns
            if (data.customer_phone) {
                // Check for repeated digits
                if (/(\d)\1{6,}/.test(data.customer_phone)) {
                    suspicious = true;
                }
                // Check for sequential digits
                if (/(0123456789|1234567890|9876543210|0987654321)/.test(data.customer_phone)) {
                    suspicious = true;
                }
            }

            // Check for suspicious date/time patterns
            if (data.reservation_date && data.reservation_time) {
                const reservationDateTime = new Date(`${data.reservation_date}T${data.reservation_time}`);
                const now = new Date();
                
                // Check if reservation is too soon (less than 1 hour)
                const timeDiff = reservationDateTime.getTime() - now.getTime();
                const hoursDiff = timeDiff / (1000 * 3600);
                if (hoursDiff < 1) {
                    suspicious = true;
                }
            }

            return suspicious;
        } catch (error) {
            console.error('Suspicious pattern detection error:', error);
            return false;
        }
    }
}

module.exports = { ValidationService };
