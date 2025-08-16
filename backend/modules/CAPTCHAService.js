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
     * Verify reCAPTCHA token with Google
     */
    async verifyRecaptcha(token, action = 'default') {
        try {
            // For testing, use your actual secret key
            const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
            
            // In development/testing, allow mock tokens
            if (process.env.NODE_ENV === 'development' && token === 'mock_recaptcha_token_dev') {
                console.log('🔄 Development mode: Mock token accepted');
                return {
                    valid: true,
                    score: 0.9,
                    action: action,
                    success: true
                };
            }

            if (!token) {
                return {
                    success: false,
                    score: 0,
                    reason: 'No reCAPTCHA token provided',
                    isBot: true
                };
            }

            // Prepare verification request
            const postData = `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`;
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
     * Perform comprehensive security check
     */
    async performSecurityCheck(requestData) {
        try {
            const {
                recaptchaToken,
                action = 'default',
                ip,
                userAgent,
                referrer,
                timestamp
            } = requestData;

            // Development mode: Allow mock tokens
            if (process.env.NODE_ENV === 'development' && recaptchaToken === 'mock_recaptcha_token_dev') {
                console.log('🔄 Development mode: Allowing mock CAPTCHA token');
                return {
                    allowed: true,
                    overallRisk: 'low',
                    score: 0.9,
                    recommendations: ['Mock token accepted in development mode'],
                    details: {
                        recaptcha: { valid: true, score: 0.9 },
                        botDetection: { risk: 'low', score: 0.1 },
                        ipAnalysis: { risk: 'low', score: 0.1 },
                        behaviorAnalysis: { risk: 'low', score: 0.1 }
                    }
                };
            }

            // Production mode: Full security check
            const recaptchaResult = await this.verifyRecaptcha(recaptchaToken, action);
            const botDetectionResult = this.analyzeRequest(requestData);
            
            // Calculate overall risk score
            const overallRisk = this.calculateOverallRisk(recaptchaResult, botDetectionResult);
            
            // Determine if request should be allowed
            const allowed = overallRisk.score < 0.7; // Allow if risk score is below 0.7
            
            // Generate recommendations
            const recommendations = this.generateRecommendations(overallRisk);
            
            return {
                allowed,
                overallRisk: overallRisk.level,
                score: overallRisk.score,
                recommendations,
                details: {
                    recaptcha: recaptchaResult,
                    botDetection: botDetectionResult
                }
            };
            
        } catch (error) {
            console.error('Security check failed:', error);
            return {
                allowed: false,
                overallRisk: 'critical',
                score: 1.0,
                recommendations: ['Security check failed - block request'],
                details: {
                    error: error.message
                }
            };
        }
    }

    /**
     * Calculate overall risk score
     */
    calculateOverallRisk(recaptchaResult, botDetectionResult) {
        let totalScore = 0;
        let factors = 0;
        
        // reCAPTCHA score (0.0 = bot, 1.0 = human)
        if (recaptchaResult && recaptchaResult.score !== undefined) {
            totalScore += (1 - recaptchaResult.score); // Invert score so higher = more risk
            factors++;
        } else {
            // In development, be more lenient with missing CAPTCHA scores
            if (process.env.NODE_ENV === 'development') {
                totalScore += 0.2; // Low risk in development
            } else {
                totalScore += 0.8; // High risk if no CAPTCHA in production
            }
            factors++;
        }
        
        // Bot detection score
        if (botDetectionResult && botDetectionResult.riskScore !== undefined) {
            totalScore += botDetectionResult.riskScore;
            factors++;
        } else {
            // In development, be more lenient with missing bot detection
            if (process.env.NODE_ENV === 'development') {
                totalScore += 0.1; // Very low risk in development
            } else {
                totalScore += 0.5; // Medium risk if no bot detection in production
            }
            factors++;
        }
        
        // Calculate average risk score
        const averageScore = factors > 0 ? totalScore / factors : 0.8;
        
        // Determine risk level - Much more lenient in development
        let level = 'low';
        if (process.env.NODE_ENV === 'development') {
            // Development mode: Very lenient thresholds
            if (averageScore >= 0.95) level = 'high';
            else if (averageScore >= 0.8) level = 'medium';
            else level = 'low';
        } else {
            // Production mode: Standard thresholds
            if (averageScore >= 0.7) level = 'high';
            else if (averageScore >= 0.4) level = 'medium';
        }
        
        return {
            score: averageScore,
            level: level
        };
    }

    /**
     * Generate security recommendations
     */
    generateRecommendations(overallRisk) {
        const recommendations = [];
        
        if (overallRisk.score >= 0.8) {
            recommendations.push('Block request immediately');
            recommendations.push('Log for security investigation');
            recommendations.push('Consider IP ban');
        } else if (overallRisk.score >= 0.6) {
            recommendations.push('Require additional verification');
            recommendations.push('Monitor for suspicious activity');
        } else if (overallRisk.score >= 0.4) {
            recommendations.push('Allow with caution');
            recommendations.push('Monitor user behavior');
        } else {
            recommendations.push('Request appears safe');
        }
        
        return recommendations;
    }

    /**
     * Determine if request should be allowed
     */
    shouldAllowRequest(overallRisk, recaptchaResult, botAnalysis) {
        // Development mode: Very lenient
        if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Development mode: Using very lenient security thresholds');
            console.log('📊 Risk level:', overallRisk.level, 'Score:', overallRisk.score);
            
            // In development, allow almost everything except critical risks
            if (overallRisk.level === 'critical') {
                console.log('🚫 Blocking critical risk in development');
                return false;
            }
            
            // Allow everything else in development
            console.log('✅ Allowing request in development mode');
            return true;
        }
        
        // Production mode: Standard security
        if (overallRisk.level === 'critical') return false;
        if (overallRisk.level === 'high' && (!recaptchaResult || !recaptchaResult.success)) return false;
        if (botAnalysis && botAnalysis.isBot && (!recaptchaResult || !recaptchaResult.success)) return false;
        
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
