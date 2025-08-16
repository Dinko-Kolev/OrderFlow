# 🔑 Stripe API Keys Setup Guide

## 📍 **Where to Add Your Stripe API Keys**

### **Backend Environment Variables**

Add these to your `backend/.env` file:

```bash
# Stripe Configuration (TESTING - Replace with your actual test keys)
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret_here
```

### **Frontend Environment Variables**

Add this to your `frontend/.env.local` file:

```bash
# Stripe Configuration (TESTING - Replace with your actual test key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
```

## 🚀 **How to Get Your Stripe API Keys**

### **Step 1: Create Stripe Account**
1. Go to [stripe.com](https://stripe.com)
2. Sign up for a free account
3. Complete account verification

### **Step 2: Get Test API Keys**
1. **Dashboard**: Go to Stripe Dashboard
2. **Developers**: Click "Developers" in the left sidebar
3. **API Keys**: Click "API keys"
4. **Test Keys**: You'll see your test keys:
   - **Publishable key**: Starts with `pk_test_`
   - **Secret key**: Starts with `sk_test_`

### **Step 3: Get Webhook Secret**
1. **Webhooks**: Click "Webhooks" in Developers section
2. **Add endpoint**: Add endpoint URL: `http://localhost:3001/api/webhooks/stripe`
3. **Events**: Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. **Secret**: Copy the webhook signing secret (starts with `whsec_`)

## 🔒 **Security Notes**

- **NEVER commit API keys** to version control
- **Use test keys** for development
- **Switch to live keys** only in production
- **Keep secret keys secure** - only backend should have them

## 🧪 **Testing with Stripe**

### **Test Card Numbers**
```javascript
// Successful payment
4242 4242 4242 4242

// Declined payment
4000 0000 0000 0002

// Requires authentication
4000 0025 0000 3155

// Insufficient funds
4000 0000 0000 9995
```

### **Test CVC & Expiry**
- **CVC**: Any 3 digits (e.g., 123)
- **Expiry**: Any future date (e.g., 12/25)

## 📋 **Next Steps After Adding Keys**

1. **Restart your backend server** to load new environment variables
2. **Restart your frontend** to load new environment variables
3. **Test the payment flow** with test card numbers
4. **Verify webhook delivery** in Stripe Dashboard

## 🚨 **Troubleshooting**

### **Common Issues:**
- **"Invalid API key"**: Check your secret key format
- **"Webhook signature verification failed"**: Verify webhook secret
- **"Publishable key not found"**: Check frontend environment variable

### **Need Help?**
- Check Stripe Dashboard for error logs
- Verify environment variables are loaded
- Ensure services are restarted after changes
