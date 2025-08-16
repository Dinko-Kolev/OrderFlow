# Order Confirmation Email Integration

This document explains how the order confirmation email system works in the Bella Vista Restaurant application.

## Overview

When a customer places an order, the system automatically sends a confirmation email containing:
- Order details and number
- Customer information
- Complete item list with customizations
- Pricing breakdown
- Delivery/pickup information
- Estimated delivery time
- Contact information

## Architecture

### Services Involved

1. **EmailService** (`modules/EmailService.js`)
   - Handles all email operations
   - Generates HTML and text email content
   - Manages SMTP configuration
   - Sends emails asynchronously

2. **OrderService** (`modules/OrderService.js`)
   - Creates orders in the database
   - Integrates with EmailService to send confirmation emails
   - Handles order data preparation for emails

3. **AppModule** (`app.module.js`)
   - Manages dependency injection
   - Initializes EmailService and injects it into OrderService

## Email Content

### HTML Email Features
- Responsive design with mobile optimization
- Professional styling with Bella Vista branding
- Clear order information layout
- Interactive elements (order tracking link, phone number)
- Spanish language support

### Text Email Features
- Plain text alternative for email clients that don't support HTML
- All essential information included
- Easy to read format

## Configuration

### Environment Variables

Set these environment variables to configure SMTP:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### SMTP Providers

The system works with any SMTP provider:
- **Gmail**: Use App Password (2FA required)
- **SendGrid**: Use API key
- **Mailgun**: Use domain and API key
- **AWS SES**: Use access keys

## Testing

### Test the Email Service

Run the test file to verify email functionality:

```bash
cd backend
node test-order-email.js
```

This will:
1. Test email content generation
2. Test SMTP connection (if configured)
3. Send a test email (or log to console if SMTP not configured)

### Test with Real Orders

1. Create an order through the API
2. Check server logs for email preparation messages
3. Verify email is sent (or logged to console)
4. Check customer's email inbox

## Error Handling

### Email Failures Don't Break Orders

- Order creation continues even if email fails
- Email errors are logged but don't affect order processing
- System gracefully degrades when email service is unavailable

### Common Issues

1. **SMTP Configuration**
   - Check environment variables
   - Verify SMTP credentials
   - Test connection with `test-order-email.js`

2. **Email Content Generation**
   - Validate order data structure
   - Check for missing required fields
   - Review server logs for errors

## Monitoring

### Log Messages

The system logs email-related activities:

```
📧 Preparing to send order confirmation email...
📧 Order data prepared for email: { orderNumber: 'ORD-001', ... }
✅ Order confirmation email sent successfully
   - Message ID: <abc123@server.com>
```

### Error Logging

Failed emails are logged with details:

```
❌ Failed to send order confirmation email: Authentication failed
❌ Error sending order confirmation email: Connection timeout
```

## Customization

### Email Templates

To modify email appearance:
1. Edit `generateOrderEmail()` method in `EmailService.js`
2. Update CSS styles in the HTML template
3. Modify text version for consistency

### Content Localization

The system supports Spanish by default. To add other languages:
1. Create language-specific template methods
2. Add language detection logic
3. Update content generation accordingly

## Security Considerations

### Data Sanitization
- All user input is sanitized before email generation
- HTML content is properly escaped
- No sensitive data is exposed in emails

### SMTP Security
- Use TLS/SSL for secure connections
- Store credentials in environment variables
- Regularly rotate SMTP passwords

## Performance

### Asynchronous Processing
- Emails are sent asynchronously
- Order creation is not blocked by email operations
- Background email processing improves response times

### Email Queue (Future Enhancement)
- Consider implementing email queuing for high-volume scenarios
- Use Redis or database-based queue system
- Implement retry logic for failed emails

## Troubleshooting

### Email Not Sending
1. Check SMTP configuration
2. Verify network connectivity
3. Review server logs for errors
4. Test with `test-order-email.js`

### Email Content Issues
1. Validate order data structure
2. Check for missing fields
3. Review email template logic
4. Test with sample data

### Performance Issues
1. Monitor email sending times
2. Check SMTP server response times
3. Consider implementing email queuing
4. Optimize email content generation

## Support

For issues or questions:
1. Check server logs first
2. Run the test script
3. Verify SMTP configuration
4. Review this documentation

## Future Enhancements

- Email templates customization
- Multi-language support
- Email tracking and analytics
- Automated email scheduling
- Customer preference management
