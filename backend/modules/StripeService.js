const Stripe = require('stripe');

/**
 * StripeService - Handles all Stripe payment operations
 * Implements secure payment processing with proper error handling
 */
class StripeService {
    constructor() {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        
        // Score thresholds for different actions
        this.scoreThresholds = {
            order: 0.5,        // Orders require higher confidence
            reservation: 0.6,  // Reservations require highest confidence
            login: 0.7,        // Login requires very high confidence
            default: 0.5       // Default threshold
        };
    }

    /**
     * Create payment intent for order
     * @param {number} amount - Amount in dollars (will be converted to cents)
     * @param {string} currency - Currency code (default: 'usd')
     * @param {object} metadata - Additional data for the payment
     * @returns {Promise<object>} Stripe payment intent
     */
    async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
        try {
            console.log('💰 Creating payment intent:', { amount, currency, metadata });
            
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency,
                metadata: metadata,
                automatic_payment_methods: {
                    enabled: true,
                },
                // Add receipt email if available
                receipt_email: metadata.customerEmail,
                // Add description
                description: `Order payment - ${metadata.orderType || 'pizza_order'}`,
            });

            console.log('✅ Payment intent created successfully:', paymentIntent.id);
            return paymentIntent;
        } catch (error) {
            console.error('❌ Stripe payment intent creation failed:', error);
            throw new Error(`Payment intent creation failed: ${error.message}`);
        }
    }

    /**
     * Confirm payment intent
     * @param {string} paymentIntentId - Stripe payment intent ID
     * @returns {Promise<object>} Confirmed payment intent
     */
    async confirmPayment(paymentIntentId) {
        try {
            console.log('🔍 Confirming payment intent:', paymentIntentId);
            
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            
            if (paymentIntent.status === 'succeeded') {
                console.log('✅ Payment already succeeded:', paymentIntentId);
                return paymentIntent;
            }
            
            console.log('✅ Payment intent retrieved successfully:', paymentIntent.status);
            return paymentIntent;
        } catch (error) {
            console.error('❌ Stripe payment confirmation failed:', error);
            throw new Error(`Payment confirmation failed: ${error.message}`);
        }
    }

    /**
     * Create Stripe customer
     * @param {string} email - Customer email
     * @param {string} name - Customer name
     * @param {string} phone - Customer phone
     * @returns {Promise<object>} Stripe customer
     */
    async createCustomer(email, name, phone = null) {
        try {
            console.log('👤 Creating Stripe customer:', { email, name, phone });
            
            const customer = await this.stripe.customers.create({
                email: email,
                name: name,
                phone: phone,
                metadata: {
                    source: 'orderflow_app',
                    created_at: new Date().toISOString()
                }
            });

            console.log('✅ Customer created successfully:', customer.id);
            return customer;
        } catch (error) {
            console.error('❌ Stripe customer creation failed:', error);
            throw new Error(`Customer creation failed: ${error.message}`);
        }
    }

    /**
     * Attach payment method to customer
     * @param {string} customerId - Stripe customer ID
     * @param {string} paymentMethodId - Stripe payment method ID
     * @returns {Promise<object>} Attached payment method
     */
    async attachPaymentMethod(customerId, paymentMethodId) {
        try {
            console.log('🔗 Attaching payment method to customer:', { customerId, paymentMethodId });
            
            const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId,
            });

            console.log('✅ Payment method attached successfully:', paymentMethod.id);
            return paymentMethod;
        } catch (error) {
            console.error('❌ Payment method attachment failed:', error);
            throw new Error(`Payment method attachment failed: ${error.message}`);
        }
    }

    /**
     * Retrieve payment method details
     * @param {string} paymentMethodId - Stripe payment method ID
     * @returns {Promise<object>} Payment method details
     */
    async getPaymentMethod(paymentMethodId) {
        try {
            console.log('🔍 Retrieving payment method:', paymentMethodId);
            
            const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);
            
            console.log('✅ Payment method retrieved successfully:', paymentMethod.id);
            return paymentMethod;
        } catch (error) {
            console.error('❌ Payment method retrieval failed:', error);
            throw new Error(`Payment method retrieval failed: ${error.message}`);
        }
    }

    /**
     * Refund payment
     * @param {string} paymentIntentId - Stripe payment intent ID
     * @param {number} amount - Amount to refund in dollars
     * @param {string} reason - Reason for refund
     * @returns {Promise<object>} Refund object
     */
    async refundPayment(paymentIntentId, amount = null, reason = 'requested_by_customer') {
        try {
            console.log('💰 Processing refund:', { paymentIntentId, amount, reason });
            
            const refundData = {
                payment_intent: paymentIntentId,
                reason: reason
            };

            // If amount specified, convert to cents
            if (amount) {
                refundData.amount = Math.round(amount * 100);
            }

            const refund = await this.stripe.refunds.create(refundData);
            
            console.log('✅ Refund processed successfully:', refund.id);
            return refund;
        } catch (error) {
            console.error('❌ Refund processing failed:', error);
            throw new Error(`Refund processing failed: ${error.message}`);
        }
    }

    /**
     * Get payment intent status
     * @param {string} paymentIntentId - Stripe payment intent ID
     * @returns {Promise<string>} Payment status
     */
    async getPaymentStatus(paymentIntentId) {
        try {
            console.log('🔍 Getting payment status:', paymentIntentId);
            
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            
            console.log('✅ Payment status retrieved:', paymentIntent.status);
            return paymentIntent.status;
        } catch (error) {
            console.error('❌ Payment status retrieval failed:', error);
            throw new Error(`Payment status retrieval failed: ${error.message}`);
        }
    }

    /**
     * Validate Stripe configuration
     * @returns {Promise<boolean>} Configuration validity
     */
    async validateConfiguration() {
        try {
            console.log('🔧 Validating Stripe configuration...');
            
            if (!process.env.STRIPE_SECRET_KEY) {
                throw new Error('STRIPE_SECRET_KEY is not configured');
            }

            if (!process.env.STRIPE_PUBLISHABLE_KEY) {
                throw new Error('STRIPE_PUBLISHABLE_KEY is not configured');
            }

            // Test API connection by making a simple request
            const account = await this.stripe.accounts.retrieve();
            
            console.log('✅ Stripe configuration validated successfully');
            console.log('🏢 Connected to Stripe account:', account.id);
            
            return true;
        } catch (error) {
            console.error('❌ Stripe configuration validation failed:', error);
            throw new Error(`Configuration validation failed: ${error.message}`);
        }
    }
}

module.exports = { StripeService };
