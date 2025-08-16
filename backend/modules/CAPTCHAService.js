const https = require('https');

/**
 * CAPTCHAService - Handles Google reCAPTCHA v3 integration and bot detection
 * Implements enterprise-level bot protection patterns used by major companies
 */
class CAPTCHAService {
    constructor() {
        // Configuration
        this.secretKey = process.env.RECAPTCHA_SECRET_KEY || 'test_secret_key';
        this.siteKey = process.env.RECAPTCHA_SITE_KEY || 'test_site_key';
        this.verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
        
        // Score thresholds for different actions
        this.scoreThresholds = {
            order: 0.5,        // Orders require higher confidence
            reservation: 0.6,  // Reservations require highest confidence
            login: 0.7,        // Login requires very high confidence
            default: 0.5       // Default threshold
        };

        // Bot detection patterns
        this.botPatterns = {
            // Suspicious user agents
            suspiciousUserAgents: [
                /bot/i,
                /crawler/i,
                /spider/i,
                /scraper/i,
                /curl/i,
                /wget/i,
                /python/i,
                /java/i,
                /perl/i,
                /ruby/i,
                /php/i,
                /go-http-client/i,
                /okhttp/i,
                /apache-httpclient/i,
                /requests/i,
                /urllib/i,
                /mechanize/i,
                /scrapy/i,
                /selenium/i,
                /puppeteer/i,
                /playwright/i,
                /headless/i,
                /phantomjs/i,
                /casperjs/i,
                /nightmare/i
            ],
            
            // Suspicious IP patterns
            suspiciousIPPatterns: [
                /^10\./,      // Private networks
                /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private networks
                /^192\.168\./, // Private networks
                /^127\./,     // Localhost
                /^169\.254\./, // Link-local
                /^0\.0\.0\.0/, // Invalid
                /^255\.255\.255\.255$/ // Broadcast
            ],
            
            // Suspicious behavior patterns
            suspiciousBehavior: {
                rapidRequests: 10,        // Max requests per minute
                noReferrer: true,         // Flag requests without referrer
                noUserAgent: true,        // Flag requests without user agent
                suspiciousTiming: 100     // Min ms between requests
            }
        };

        // Request tracking for behavior analysis
        this.requestTracker = new Map();
        
        // Cleanup interval (clean old entries every 10 minutes)
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 10 * 60 * 1000);
    }

    /**
     * Verify Google reCAPTCHA token
     * @param {string} token - reCAPTCHA token from frontend
     * @param {string} action - Action being performed (order, reservation, login)
     * @returns {Promise<Object>} Verification result
     */
    async verifyRecaptcha(token, action = 'default') {
        try {
            if (!token) {
                return {
                    success: false,
                    score: 0,
                    reason: 'No reCAPTCHA token provided',
                    isBot: true
                };
            }

            // Prepare verification request
            const postData = `secret=${encodeURIComponent(this.secretKey)}&response=${encodeURIComponent(token)}`;
            const options = {
                hostname: 'www.google.com',
                port: 443,
                path: '/recaptcha/api/siteverify',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            // Make verification request
            const result = await this.makeHttpsRequest(options, postData);
            
            if (!result.success) {
                return {
                    success: false,
                    score: 0,
                    reason: 'reCAPTCHA verification failed',
                    isBot: true,
                    errors: result['error-codes']
                };
            }

            // Check score threshold
            const score = result.score || 0;
            const threshold = this.scoreThresholds[action] || this.scoreThresholds.default;
            const isBot = score < threshold;

            return {
                success: true,
                score: score,
                threshold: threshold,
                isBot: isBot,
                reason: isBot ? `Score ${score} below threshold ${threshold}` : 'Verification successful',
                action: action
            };
        } catch (error) {
            console.error('reCAPTCHA verification error:', error);
            return {
                success: false,
                score: 0,
                reason: 'Verification error occurred',
                isBot: true,
                error: error.message
            };
        }
    }

    /**
     * Make HTTPS request to Google reCAPTCHA API
     * @param {Object} options - HTTPS request options
     * @param {string} postData - POST data
     * @returns {Promise<Object>} Response data
     */
    makeHttpsRequest(options, postData) {
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (error) {
                        reject(new Error('Invalid response format'));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Analyze request for bot-like behavior
     * @param {Object} requestData - Request data including headers and metadata
     * @returns {Object} Bot detection result
     */
    analyzeRequest(requestData) {
        try {
            const {
                ip,
                userAgent,
                referrer,
                timestamp,
                requestCount,
                timeSinceLastRequest
            } = requestData;

            const botIndicators = [];
            let botScore = 0;

            // Check user agent
            if (!userAgent || userAgent.trim() === '') {
                botIndicators.push('Missing user agent');
                botScore += 30;
            } else {
                // Check for suspicious user agents
                const isSuspiciousUserAgent = this.botPatterns.suspiciousUserAgents.some(pattern => 
                    pattern.test(userAgent)
                );
                
                if (isSuspiciousUserAgent) {
                    botIndicators.push('Suspicious user agent detected');
                    botScore += 50;
                }
            }

            // Check referrer
            if (!referrer && this.botPatterns.suspiciousBehavior.noReferrer) {
                botIndicators.push('No referrer header');
                botScore += 15;
            }

            // Check IP address
            if (ip) {
                const isSuspiciousIP = this.botPatterns.suspiciousIPPatterns.some(pattern => 
                    pattern.test(ip)
                );
                
                if (isSuspiciousIP) {
                    botIndicators.push('Suspicious IP address');
                    botScore += 25;
                }
            }

            // Check request timing
            if (timeSinceLastRequest !== undefined && timeSinceLastRequest < this.botPatterns.suspiciousBehavior.suspiciousTiming) {
                botIndicators.push('Suspicious request timing');
                botScore += 20;
            }

            // Check request frequency
            if (requestCount > this.botPatterns.suspiciousBehavior.rapidRequests) {
                botIndicators.push('Rapid request frequency');
                botScore += 40;
            }

            // Determine if it's likely a bot
            const isBot = botScore >= 50;
            const confidence = Math.min(100, botScore);

            return {
                isBot: isBot,
                botScore: botScore,
                confidence: confidence,
                indicators: botIndicators,
                risk: this.getRiskLevel(botScore),
                recommendations: this.getRecommendations(botScore)
            };
        } catch (error) {
            console.error('Bot analysis error:', error);
            return {
                isBot: false,
                botScore: 0,
                confidence: 0,
                indicators: ['Analysis error occurred'],
                risk: 'unknown',
                recommendations: ['Allow request due to analysis error']
            };
        }
    }

    /**
     * Get risk level based on bot score
     * @param {number} botScore - Bot detection score
     * @returns {string} Risk level
     */
    getRiskLevel(botScore) {
        if (botScore >= 80) return 'high';
        if (botScore >= 60) return 'medium';
        if (botScore >= 40) return 'low';
        return 'minimal';
    }

    /**
     * Get recommendations based on bot score
     * @param {number} botScore - Bot detection score
     * @returns {Array<string>} Recommendations
     */
    getRecommendations(botScore) {
        const recommendations = [];
        
        if (botScore >= 80) {
            recommendations.push('Block request immediately');
            recommendations.push('Log for security review');
            recommendations.push('Consider IP ban');
        } else if (botScore >= 60) {
            recommendations.push('Require additional verification');
            recommendations.push('Monitor closely');
            recommendations.push('Consider CAPTCHA challenge');
        } else if (botScore >= 40) {
            recommendations.push('Monitor behavior');
            recommendations.push('Consider rate limiting');
        } else {
            recommendations.push('Allow request');
            recommendations.push('Continue monitoring');
        }
        
        return recommendations;
    }

    /**
     * Track request for behavior analysis
     * @param {string} identifier - IP address or user ID
     * @param {Object} requestData - Request metadata
     */
    trackRequest(identifier, requestData) {
        try {
            const now = Date.now();
            const existing = this.requestTracker.get(identifier) || {
                requests: [],
                firstRequest: now,
                lastRequest: now
            };

            // Add new request
            existing.requests.push({
                timestamp: now,
                userAgent: requestData.userAgent,
                referrer: requestData.referrer,
                ip: requestData.ip,
                action: requestData.action
            });

            // Keep only last 100 requests
            if (existing.requests.length > 100) {
                existing.requests = existing.requests.slice(-100);
            }

            existing.lastRequest = now;
            this.requestTracker.set(identifier, existing);
        } catch (error) {
            console.error('Request tracking error:', error);
        }
    }

    /**
     * Get behavior analysis for an identifier
     * @param {string} identifier - IP address or user ID
     * @returns {Object} Behavior analysis result
     */
    getBehaviorAnalysis(identifier) {
        try {
            const data = this.requestTracker.get(identifier);
            if (!data) {
                return {
                    totalRequests: 0,
                    timeSpan: 0,
                    averageInterval: 0,
                    suspiciousPatterns: [],
                    riskAssessment: 'low'
                };
            }

            const now = Date.now();
            const timeSpan = now - data.firstRequest;
            const totalRequests = data.requests.length;
            
            // Calculate average interval between requests
            let totalInterval = 0;
            let intervalCount = 0;
            
            for (let i = 1; i < data.requests.length; i++) {
                const interval = data.requests[i].timestamp - data.requests[i-1].timestamp;
                totalInterval += interval;
                intervalCount++;
            }
            
            const averageInterval = intervalCount > 0 ? totalInterval / intervalCount : 0;

            // Detect suspicious patterns
            const suspiciousPatterns = [];
            
            // Check for rapid requests
            if (totalRequests > 10 && timeSpan < 60000) { // More than 10 requests in 1 minute
                suspiciousPatterns.push('Rapid request pattern');
            }
            
            // Check for consistent timing (bot-like behavior)
            if (intervalCount > 5) {
                const intervals = [];
                for (let i = 1; i < data.requests.length; i++) {
                    intervals.push(data.requests[i].timestamp - data.requests[i-1].timestamp);
                }
                
                const variance = this.calculateVariance(intervals);
                if (variance < 1000) { // Very consistent timing (less than 1 second variance)
                    suspiciousPatterns.push('Consistent timing pattern');
                }
            }

            // Risk assessment
            let riskAssessment = 'low';
            if (suspiciousPatterns.length >= 2) riskAssessment = 'high';
            else if (suspiciousPatterns.length >= 1) riskAssessment = 'medium';

            return {
                totalRequests,
                timeSpan: Math.round(timeSpan / 1000), // Convert to seconds
                averageInterval: Math.round(averageInterval / 1000), // Convert to seconds
                suspiciousPatterns,
                riskAssessment,
                lastRequest: new Date(data.lastRequest).toISOString()
            };
        } catch (error) {
            console.error('Behavior analysis error:', error);
            return {
                totalRequests: 0,
                timeSpan: 0,
                averageInterval: 0,
                suspiciousPatterns: ['Analysis error'],
                riskAssessment: 'unknown'
            };
        }
    }

    /**
     * Calculate variance of an array of numbers
     * @param {Array<number>} numbers - Array of numbers
     * @returns {number} Variance
     */
    calculateVariance(numbers) {
        if (numbers.length === 0) return 0;
        
        const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
        const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
        
        return variance;
    }

    /**
     * Comprehensive security check combining reCAPTCHA and bot detection
     * @param {Object} requestData - Complete request data
     * @returns {Promise<Object>} Security check result
     */
    async performSecurityCheck(requestData) {
        try {
            const {
                recaptchaToken,
                action,
                ip,
                userAgent,
                referrer,
                timestamp
            } = requestData;

            // Track request for behavior analysis
            this.trackRequest(ip, {
                userAgent,
                referrer,
                ip,
                action,
                timestamp: timestamp || Date.now()
            });

            // Get behavior analysis
            const behaviorAnalysis = this.getBehaviorAnalysis(ip);

            // Verify reCAPTCHA if token provided
            let recaptchaResult = null;
            if (recaptchaToken) {
                recaptchaResult = await this.verifyRecaptcha(recaptchaToken, action);
            }

            // Analyze request for bot behavior
            const botAnalysis = this.analyzeRequest({
                ip,
                userAgent,
                referrer,
                timestamp: timestamp || Date.now(),
                requestCount: behaviorAnalysis.totalRequests,
                timeSinceLastRequest: behaviorAnalysis.averageInterval
            });

            // Combine results for final decision
            const overallRisk = this.calculateOverallRisk(recaptchaResult, botAnalysis, behaviorAnalysis);
            const isAllowed = this.shouldAllowRequest(overallRisk, recaptchaResult, botAnalysis);

            return {
                allowed: isAllowed,
                overallRisk: overallRisk,
                recaptcha: recaptchaResult,
                botDetection: botAnalysis,
                behaviorAnalysis: behaviorAnalysis,
                recommendations: this.getSecurityRecommendations(overallRisk, recaptchaResult, botAnalysis),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Security check error:', error);
            return {
                allowed: false,
                overallRisk: 'high',
                error: 'Security check failed',
                reason: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Calculate overall risk score
     * @param {Object} recaptchaResult - reCAPTCHA verification result
     * @param {Object} botAnalysis - Bot detection result
     * @param {Object} behaviorAnalysis - Behavior analysis result
     * @returns {string} Overall risk level
     */
    calculateOverallRisk(recaptchaResult, botAnalysis, behaviorAnalysis) {
        let riskScore = 0;

        // reCAPTCHA risk
        if (!recaptchaResult || !recaptchaResult.success) {
            riskScore += 40;
        } else if (recaptchaResult.isBot) {
            riskScore += 30;
        }

        // Bot detection risk
        if (botAnalysis.isBot) {
            riskScore += 35;
        }

        // Behavior risk
        if (behaviorAnalysis.riskAssessment === 'high') {
            riskScore += 25;
        } else if (behaviorAnalysis.riskAssessment === 'medium') {
            riskScore += 15;
        }

        // Determine overall risk
        if (riskScore >= 70) return 'high';
        if (riskScore >= 50) return 'medium';
        if (riskScore >= 30) return 'low';
        return 'minimal';
    }

    /**
     * Determine if request should be allowed
     * @param {string} overallRisk - Overall risk level
     * @param {Object} recaptchaResult - reCAPTCHA result
     * @param {Object} botAnalysis - Bot detection result
     * @returns {boolean} Whether to allow the request
     */
    shouldAllowRequest(overallRisk, recaptchaResult, botAnalysis) {
        // High risk - block
        if (overallRisk === 'high') return false;
        
        // Medium risk - require reCAPTCHA
        if (overallRisk === 'medium') {
            return recaptchaResult && recaptchaResult.success && !recaptchaResult.isBot;
        }
        
        // Low risk - allow with monitoring
        if (overallRisk === 'low') {
            return true;
        }
        
        // Minimal risk - allow
        return true;
    }

    /**
     * Get security recommendations
     * @param {string} overallRisk - Overall risk level
     * @param {Object} recaptchaResult - reCAPTCHA result
     * @param {Object} botAnalysis - Bot detection result
     * @returns {Array<string>} Security recommendations
     */
    getSecurityRecommendations(overallRisk, recaptchaResult, botAnalysis) {
        const recommendations = [];
        
        if (overallRisk === 'high') {
            recommendations.push('Block request immediately');
            recommendations.push('Log for security investigation');
            recommendations.push('Consider IP ban');
        } else if (overallRisk === 'medium') {
            recommendations.push('Require reCAPTCHA verification');
            recommendations.push('Monitor closely');
            recommendations.push('Consider additional verification');
        } else if (overallRisk === 'low') {
            recommendations.push('Allow with monitoring');
            recommendations.push('Watch for pattern changes');
        } else {
            recommendations.push('Allow request');
            recommendations.push('Continue normal monitoring');
        }
        
        return recommendations;
    }

    /**
     * Clean up old tracking data
     */
    cleanup() {
        try {
            const now = Date.now();
            const oneHourAgo = now - 60 * 60 * 1000;

            for (const [identifier, data] of this.requestTracker.entries()) {
                // Remove old requests
                data.requests = data.requests.filter(request => 
                    now - request.timestamp < oneHourAgo
                );
                
                // Remove identifier if no recent requests
                if (data.requests.length === 0) {
                    this.requestTracker.delete(identifier);
                }
            }

            console.log('CAPTCHA service cleanup completed');
        } catch (error) {
            console.error('CAPTCHA service cleanup error:', error);
        }
    }

    /**
     * Get service statistics
     * @returns {Object} Service statistics
     */
    getStats() {
        try {
            return {
                trackedIdentifiers: this.requestTracker.size,
                totalTrackedRequests: Array.from(this.requestTracker.values())
                    .reduce((sum, data) => sum + data.requests.length, 0),
                cleanupInterval: '10 minutes',
                scoreThresholds: this.scoreThresholds
            };
        } catch (error) {
            console.error('CAPTCHA service stats error:', error);
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
        this.requestTracker.clear();
    }
}

module.exports = { CAPTCHAService };
