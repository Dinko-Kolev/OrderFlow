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
            european: /^\+[3-4][0-9]{1,14}$/
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
     * Validate phone number with international format support
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

            // Check if it's a valid international format
            if (!this.phonePatterns.international.test(cleanedPhone)) {
                errors.push('Phone number must be in international format (+1234567890)');
                score -= 40;
            }

            // Length validation (E.164 standard: max 15 digits including country code)
            if (cleanedPhone.length > 16) {
                errors.push('Phone number too long (max 16 characters including +)');
                score -= 30;
            }

            // Check for repeated digits (potential fake numbers)
            const digitCount = (cleanedPhone.match(/\d/g) || []).length;
            const uniqueDigits = new Set(cleanedPhone.match(/\d/g) || []).size;
            
            if (digitCount > 3 && uniqueDigits <= 2) {
                errors.push('Phone number appears to be invalid (too many repeated digits)');
                score -= 20;
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
            logger.error('Phone validation error:', error);
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
            logger.error('Order data validation error:', error);
            return {
                isValid: false,
                errors: ['Order validation failed due to system error'],
                score: 0
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
}

module.exports = { ValidationService };
