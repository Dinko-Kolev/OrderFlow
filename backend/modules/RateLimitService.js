/**
 * RateLimitService - Handles rate limiting and abuse prevention
 * Implements enterprise-level rate limiting patterns used by major companies
 */
class RateLimitService {
    constructor() {
        // Rate limiting storage using Map for in-memory storage
        // In production, this should use Redis or similar
        this.ipLimits = new Map();
        this.userLimits = new Map();
        this.emailLimits = new Map();
        this.phoneLimits = new Map();
        
        // Configuration for different rate limits
        this.limits = {
            // IP-based limits - TEMPORARILY INCREASED FOR DEVELOPMENT
            ip: {
                ordersPerHour: 20,        // Was 3, now 20
                ordersPerDay: 50,         // Was 10, now 50
                reservationsPerHour: 15,   // Was 2, now 15
                reservationsPerDay: 30    // Was 5, now 30
            },
            // User-based limits - TEMPORARILY INCREASED FOR DEVELOPMENT
            user: {
                ordersPerDay: 10,         // Was 2, now 10
                ordersPerWeek: 25,        // Was 5, now 25
                reservationsPerDay: 8,    // Was 1, now 8
                reservationsPerWeek: 20   // Was 2, now 20
            },
            // Email-based limits (for guest orders) - TEMPORARILY INCREASED FOR DEVELOPMENT
            email: {
                ordersPerDay: 10,         // Was 2, now 10
                ordersPerWeek: 25         // Was 5, now 25
            },
            // Phone-based limits (for guest orders) - TEMPORARILY INCREASED FOR DEVELOPMENT
            phone: {
                ordersPerDay: 10,         // Was 2, now 10
                ordersPerWeek: 25         // Was 5, now 25
            }
        };

        // Cooldown periods (in milliseconds) - TEMPORARILY REDUCED FOR DEVELOPMENT
        this.cooldowns = {
            order: 30 * 1000,           // Was 5 minutes, now 30 seconds
            reservation: 60 * 1000,      // Was 10 minutes, now 1 minute
            violation: 2 * 60 * 1000    // Was 15 minutes, now 2 minutes
        };

        // Cleanup interval (clean old entries every hour)
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60 * 60 * 1000);
    }

    /**
     * Check if an IP address is allowed to make a request
     * @param {string} ip - IP address
     * @param {string} action - Action type ('order' or 'reservation')
     * @returns {Object} Rate limit check result
     */
    checkIPLimit(ip, action) {
        try {
            // Development mode: Allow all requests
            if (process.env.NODE_ENV === 'development') {
                console.log('🔄 Development mode: Bypassing IP rate limits for testing');
                return {
                    allowed: true,
                    reason: 'Development mode - rate limits bypassed',
                    retryAfter: null
                };
            }

            if (!ip || !action) {
                return {
                    allowed: false,
                    reason: 'Invalid IP or action',
                    retryAfter: null
                };
            }

            const now = Date.now();
            const ipData = this.ipLimits.get(ip) || { orders: [], reservations: [] };
            const actionData = ipData[action === 'order' ? 'orders' : 'reservations'];
            
            // Clean old entries
            const recentData = actionData.filter(timestamp => 
                now - timestamp < 24 * 60 * 60 * 1000 // Keep last 24 hours
            );

            // Check hourly limit
            const hourlyData = recentData.filter(timestamp => 
                now - timestamp < 60 * 60 * 1000 // Last hour
            );

            const hourlyLimit = this.limits.ip[action === 'order' ? 'ordersPerHour' : 'reservationsPerHour'];
            const dailyLimit = this.limits.ip[action === 'order' ? 'ordersPerDay' : 'reservationsPerDay'];

            if (hourlyData.length >= hourlyLimit) {
                const oldestInHour = Math.min(...hourlyData);
                const retryAfter = oldestInHour + 60 * 60 * 1000 - now;
                
                return {
                    allowed: false,
                    reason: `Too many ${action}s from this IP address (hourly limit: ${hourlyLimit})`,
                    retryAfter: Math.max(0, retryAfter)
                };
            }

            if (recentData.length >= dailyLimit) {
                const oldestInDay = Math.min(...recentData);
                const retryAfter = oldestInDay + 24 * 60 * 60 * 1000 - now;
                
                return {
                    allowed: false,
                    reason: `Too many ${action}s from this IP address (daily limit: ${dailyLimit})`,
                    retryAfter: Math.max(0, retryAfter)
                };
            }

            // Check cooldown period
            if (actionData.length > 0) {
                const lastAction = Math.max(...actionData);
                const timeSinceLastAction = now - lastAction;
                const cooldown = this.cooldowns[action];

                if (timeSinceLastAction < cooldown) {
                    const retryAfter = cooldown - timeSinceLastAction;
                    return {
                        allowed: false,
                        reason: `Please wait before making another ${action}`,
                        retryAfter: Math.max(0, retryAfter)
                    };
                }
            }

            return { allowed: true, reason: null, retryAfter: null };
        } catch (error) {
            console.error('IP rate limit check error:', error);
            return { allowed: true, reason: null, retryAfter: null }; // Allow on error
        }
    }

    /**
     * Check if a user is allowed to make a request
     * @param {number} userId - User ID
     * @param {string} action - Action type ('order' or 'reservation')
     * @returns {Object} Rate limit check result
     */
    checkUserLimit(userId, action) {
        try {
            // Development mode: Allow all requests
            if (process.env.NODE_ENV === 'development') {
                console.log('🔄 Development mode: Bypassing user rate limits for testing');
                return {
                    allowed: true,
                    reason: 'Development mode - rate limits bypassed',
                    retryAfter: null
                };
            }

            if (!userId || !action) {
                return {
                    allowed: false,
                    reason: 'Invalid user ID or action',
                    retryAfter: null
                };
            }

            const now = Date.now();
            const userData = this.userLimits.get(userId) || { orders: [], reservations: [] };
            const actionData = userData[action === 'order' ? 'orders' : 'reservations'];
            
            // Clean old entries
            const recentData = actionData.filter(timestamp => 
                now - timestamp < 7 * 24 * 60 * 60 * 1000 // Keep last 7 days
            );

            // Check daily limit
            const dailyData = recentData.filter(timestamp => 
                now - timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
            );

            const dailyLimit = this.limits.user[action === 'order' ? 'ordersPerDay' : 'reservationsPerDay'];
            const weeklyLimit = this.limits.user[action === 'order' ? 'ordersPerWeek' : 'reservationsPerWeek'];

            if (dailyData.length >= dailyLimit) {
                const oldestInDay = Math.min(...dailyData);
                const retryAfter = oldestInDay + 24 * 60 * 60 * 1000 - now;
                
                return {
                    allowed: false,
                    reason: `Too many ${action}s today (daily limit: ${dailyLimit})`,
                    retryAfter: Math.max(0, retryAfter)
                };
            }

            if (recentData.length >= weeklyLimit) {
                const oldestInWeek = Math.min(...recentData);
                const retryAfter = oldestInWeek + 7 * 24 * 60 * 60 * 1000 - now;
                
                return {
                    allowed: false,
                    reason: `Too many ${action}s this week (weekly limit: ${weeklyLimit})`,
                    retryAfter: Math.max(0, retryAfter)
                };
            }

            return { allowed: true, reason: null, retryAfter: null };
        } catch (error) {
            console.error('User rate limit check error:', error);
            return { allowed: true, reason: null, retryAfter: null }; // Allow on error
        }
    }

    /**
     * Check if an email is allowed to make a request
     * @param {string} email - Email address
     * @param {string} action - Action type ('order' or 'reservation')
     * @returns {Object} Rate limit check result
     */
    checkEmailLimit(email, action) {
        try {
            // Development mode: Allow all requests
            if (process.env.NODE_ENV === 'development') {
                console.log('🔄 Development mode: Bypassing email rate limits for testing');
                return {
                    allowed: true,
                    reason: 'Development mode - rate limits bypassed',
                    retryAfter: null
                };
            }

            if (!email || !action) {
                return {
                    allowed: false,
                    reason: 'Invalid email or action',
                    retryAfter: null
                };
            }

            const now = Date.now();
            const emailData = this.emailLimits.get(email) || { orders: [], reservations: [] };
            const actionData = emailData[action === 'order' ? 'orders' : 'reservations'];
            
            // Clean old entries
            const recentData = actionData.filter(timestamp => 
                now - timestamp < 7 * 24 * 60 * 60 * 1000 // Keep last 7 days
            );

            // Check daily limit
            const dailyData = recentData.filter(timestamp => 
                now - timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
            );

            const dailyLimit = this.limits.email[action === 'order' ? 'ordersPerDay' : 'ordersPerDay'];
            const weeklyLimit = this.limits.email[action === 'order' ? 'ordersPerWeek' : 'ordersPerWeek'];

            if (dailyData.length >= dailyLimit) {
                const oldestInDay = Math.min(...dailyData);
                const retryAfter = oldestInDay + 24 * 60 * 60 * 1000 - now;
                
                return {
                    allowed: false,
                    reason: `Too many ${action}s from this email today (daily limit: ${dailyLimit})`,
                    retryAfter: Math.max(0, retryAfter)
                };
            }

            if (recentData.length >= weeklyLimit) {
                const oldestInWeek = Math.min(...recentData);
                const retryAfter = oldestInWeek + 7 * 24 * 60 * 60 * 1000 - now;
                
                return {
                    allowed: false,
                    reason: `Too many ${action}s from this email this week (weekly limit: ${weeklyLimit})`,
                    retryAfter: Math.max(0, retryAfter)
                };
            }

            return { allowed: true, reason: null, retryAfter: null };
        } catch (error) {
            console.error('Email rate limit check error:', error);
            return { allowed: true, reason: null, retryAfter: null }; // Allow on error
        }
    }

    /**
     * Check if a phone number is allowed to make a request (for guest orders)
     * @param {string} phone - Phone number
     * @param {string} action - Action type ('order' or 'reservation')
     * @returns {Object} Rate limit check result
     */
    checkPhoneLimit(phone, action) {
        try {
            // Development mode: Allow all requests
            if (process.env.NODE_ENV === 'development') {
                console.log('🔄 Development mode: Bypassing phone rate limits for testing');
                return {
                    allowed: true,
                    reason: 'Development mode - rate limits bypassed',
                    retryAfter: null
                };
            }

            if (!phone || !action) {
                return {
                    allowed: false,
                    reason: 'Invalid phone or action',
                    retryAfter: null
                };
            }

            const now = Date.now();
            const phoneData = this.phoneLimits.get(phone) || { orders: [], reservations: [] };
            const actionData = phoneData[action === 'order' ? 'orders' : 'reservations'];
            
            // Clean old entries
            const recentData = actionData.filter(timestamp => 
                now - timestamp < 7 * 24 * 60 * 60 * 1000 // Keep last 7 days
            );

            // Check daily limit
            const dailyData = recentData.filter(timestamp => 
                now - timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
            );

            const dailyLimit = this.limits.phone[action === 'order' ? 'ordersPerDay' : 'ordersPerDay'];
            const weeklyLimit = this.limits.phone[action === 'order' ? 'ordersPerWeek' : 'ordersPerWeek'];

            if (dailyData.length >= dailyLimit) {
                const oldestInDay = Math.min(...dailyData);
                const retryAfter = oldestInDay + 24 * 60 * 60 * 1000 - now;
                
                return {
                    allowed: false,
                    reason: `Too many ${action}s from this phone today (daily limit: ${dailyLimit})`,
                    retryAfter: Math.max(0, retryAfter)
                };
            }

            if (recentData.length >= weeklyLimit) {
                const oldestInWeek = Math.min(...recentData);
                const retryAfter = oldestInWeek + 7 * 24 * 60 * 60 * 1000 - now;
                
                return {
                    allowed: false,
                    reason: `Too many ${action}s from this phone this week (weekly limit: ${weeklyLimit})`,
                    retryAfter: Math.max(0, retryAfter)
                };
            }

            return { allowed: true, reason: null, retryAfter: null };
        } catch (error) {
            console.error('Phone rate limit check error:', error);
            return { allowed: true, reason: null, retryAfter: null }; // Allow on error
        }
    }

    /**
     * Record a successful request for rate limiting
     * @param {string} ip - IP address
     * @param {string} userId - User ID (optional)
     * @param {string} email - Email (optional, for guest orders)
     * @param {string} phone - Phone (optional, for guest orders)
     * @param {string} action - Action type ('order' or 'reservation')
     */
    recordRequest(ip, userId = null, email = null, phone = null, action) {
        try {
            const now = Date.now();

            // Record IP request
            if (ip) {
                const ipData = this.ipLimits.get(ip) || { orders: [], reservations: [] };
                ipData[action === 'order' ? 'orders' : 'reservations'].push(now);
                this.ipLimits.set(ip, ipData);
            }

            // Record user request
            if (userId) {
                const userData = this.userLimits.get(userId) || { orders: [], reservations: [] };
                userData[action === 'order' ? 'orders' : 'reservations'].push(now);
                this.userLimits.set(userId, userData);
            }

            // Record email request (for guest orders)
            if (email) {
                const emailData = this.emailLimits.get(email) || { orders: [], reservations: [] };
                emailData[action === 'order' ? 'orders' : 'reservations'].push(now);
                this.emailLimits.set(email, emailData);
            }

            // Record phone request (for guest orders)
            if (phone) {
                const phoneData = this.phoneLimits.get(phone) || { orders: [], reservations: [] };
                phoneData[action === 'order' ? 'orders' : 'reservations'].push(now);
                this.phoneLimits.set(phone, phoneData);
            }

            console.log(`Rate limit recorded: ${action} from IP ${ip}${userId ? `, User ${userId}` : ''}${email ? `, Email ${email}` : ''}${phone ? `, Phone ${phone}` : ''}`);
        } catch (error) {
            console.error('Rate limit recording error:', error);
        }
    }

    /**
     * Comprehensive rate limit check for order creation
     * @param {Object} requestData - Request data including IP, user, email, phone
     * @returns {Object} Rate limit check result
     */
    checkOrderRateLimit(requestData) {
        try {
            const { ip, userId, email, phone } = requestData;
            const now = Date.now();

            // Check IP limit
            const ipCheck = this.checkIPLimit(ip, 'order');
            if (!ipCheck.allowed) {
                return {
                    allowed: false,
                    reason: ipCheck.reason,
                    retryAfter: ipCheck.retryAfter,
                    type: 'ip_limit'
                };
            }

            // Check user limit (if authenticated)
            if (userId) {
                const userCheck = this.checkUserLimit(userId, 'order');
                if (!userCheck.allowed) {
                    return {
                        allowed: false,
                        reason: userCheck.reason,
                        retryAfter: userCheck.retryAfter,
                        type: 'user_limit'
                    };
                }
            }

            // Check email limit (for guest orders)
            if (email && !userId) {
                const emailCheck = this.checkEmailLimit(email, 'order');
                if (!emailCheck.allowed) {
                    return {
                        allowed: false,
                        reason: emailCheck.reason,
                        retryAfter: emailCheck.retryAfter,
                        type: 'email_limit'
                    };
                }
            }

            // Check phone limit (for guest orders)
            if (phone && !userId) {
                const phoneCheck = this.checkPhoneLimit(phone, 'order');
                if (!phoneCheck.allowed) {
                    return {
                        allowed: false,
                        reason: phoneCheck.reason,
                        retryAfter: phoneCheck.retryAfter,
                        type: 'phone_limit'
                    };
                }
            }

            return { allowed: true, reason: null, retryAfter: null, type: null };
        } catch (error) {
            console.error('Order rate limit check error:', error);
            return { allowed: true, reason: null, retryAfter: null, type: null }; // Allow on error
        }
    }

    /**
     * Comprehensive rate limit check for reservation creation
     * @param {Object} requestData - Request data including IP, user, email, phone
     * @returns {Object} Rate limit check result
     */
    checkReservationRateLimit(requestData) {
        try {
            const { ip, userId, email, phone } = requestData;
            const now = Date.now();

            // Check IP limit
            const ipCheck = this.checkIPLimit(ip, 'reservation');
            if (!ipCheck.allowed) {
                return {
                    allowed: false,
                    reason: ipCheck.reason,
                    retryAfter: ipCheck.retryAfter,
                    type: 'ip_limit'
                };
            }

            // Check user limit (if authenticated)
            if (userId) {
                const userCheck = this.checkUserLimit(userId, 'reservation');
                if (!userCheck.allowed) {
                    return {
                        allowed: false,
                        reason: userCheck.reason,
                        retryAfter: userCheck.retryAfter,
                        type: 'user_limit'
                    };
                }
            }

            // Check email limit (for guest reservations)
            if (email && !userId) {
                const emailCheck = this.checkEmailLimit(email, 'reservation');
                if (!emailCheck.allowed) {
                    return {
                        allowed: false,
                        reason: emailCheck.reason,
                        retryAfter: emailCheck.retryAfter,
                        type: 'email_limit'
                    };
                }
            }

            // Check phone limit (for guest reservations)
            if (phone && !userId) {
                const phoneCheck = this.checkPhoneLimit(phone, 'reservation');
                if (!phoneCheck.allowed) {
                    return {
                        allowed: false,
                        reason: phoneCheck.reason,
                        retryAfter: phoneCheck.retryAfter,
                        type: 'phone_limit'
                    };
                }
            }

            return { allowed: true, reason: null, retryAfter: null, type: null };
        } catch (error) {
            console.error('Reservation rate limit check error:', error);
            return { allowed: true, reason: null, retryAfter: null, type: null }; // Allow on error
        }
    }

    /**
     * Clear all rate limits (for development/testing only)
     * WARNING: This should NOT be used in production!
     */
    clearAllLimits() {
        if (process.env.NODE_ENV === 'production') {
            console.warn('🚨 Attempted to clear rate limits in production - blocked for security');
            return false;
        }
        
        console.log('🧪 Development mode: Clearing all rate limits for testing');
        this.ipLimits.clear();
        this.userLimits.clear();
        this.emailLimits.clear();
        this.phoneLimits.clear();
        return true;
    }

    /**
     * Clear rate limits for a specific IP (for development/testing only)
     * WARNING: This should NOT be used in production!
     */
    clearIPLimits(ip) {
        if (process.env.NODE_ENV === 'production') {
            console.warn('🚨 Attempted to clear IP rate limits in production - blocked for security');
            return false;
        }
        
        console.log(`🧪 Development mode: Clearing rate limits for IP: ${ip}`);
        this.ipLimits.delete(ip);
        return true;
    }

    /**
     * Clean up old rate limit entries
     */
    cleanup() {
        try {
            const now = Date.now();
            const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

            // Clean IP limits
            for (const [ip, data] of this.ipLimits.entries()) {
                data.orders = data.orders.filter(timestamp => timestamp > oneWeekAgo);
                data.reservations = data.reservations.filter(timestamp => timestamp > oneWeekAgo);
                
                if (data.orders.length === 0 && data.reservations.length === 0) {
                    this.ipLimits.delete(ip);
                }
            }

            // Clean user limits
            for (const [userId, data] of this.userLimits.entries()) {
                data.orders = data.orders.filter(timestamp => timestamp > oneWeekAgo);
                data.reservations = data.reservations.filter(timestamp => timestamp > oneWeekAgo);
                
                if (data.orders.length === 0 && data.reservations.length === 0) {
                    this.userLimits.delete(userId);
                }
            }

            // Clean email limits
            for (const [email, data] of this.emailLimits.entries()) {
                data.orders = data.orders.filter(timestamp => timestamp > oneWeekAgo);
                data.reservations = data.reservations.filter(timestamp => timestamp > oneWeekAgo);
                
                if (data.orders.length === 0 && data.reservations.length === 0) {
                    this.emailLimits.delete(email);
                }
            }

            // Clean phone limits
            for (const [phone, data] of this.phoneLimits.entries()) {
                data.orders = data.orders.filter(timestamp => timestamp > oneWeekAgo);
                data.reservations = data.reservations.filter(timestamp => timestamp > oneWeekAgo);
                
                if (data.orders.length === 0 && data.reservations.length === 0) {
                    this.phoneLimits.delete(phone);
                }
            }

            console.log('Rate limit cleanup completed');
        } catch (error) {
            console.error('Rate limit cleanup error:', error);
        }
    }

    /**
     * Get current rate limit statistics (for monitoring)
     * @returns {Object} Rate limit statistics
     */
    getStats() {
        try {
            return {
                ipLimits: this.ipLimits.size,
                userLimits: this.userLimits.size,
                emailLimits: this.emailLimits.size,
                phoneLimits: this.phoneLimits.size,
                totalEntries: this.ipLimits.size + this.userLimits.size + this.emailLimits.size + this.phoneLimits.size
            };
        } catch (error) {
            console.error('Rate limit stats error:', error);
            return { error: 'Failed to get stats' };
        }
    }

    /**
     * Destroy the service and cleanup resources
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.ipLimits.clear();
        this.userLimits.clear();
        this.emailLimits.clear();
        this.phoneLimits.clear();
    }
}

module.exports = { RateLimitService };
