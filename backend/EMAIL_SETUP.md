# 📧 Email Configuration Guide for Bella Vista Restaurant

## 🎯 Overview

The reservation system now includes **automatic email confirmations** that are sent to customers when they make a reservation. This provides a professional experience and ensures customers have all the details they need.

## ✨ Features

- **📧 Confirmation Emails**: Sent immediately after reservation creation
- **⏰ Reminder Emails**: Sent 24 hours before the reservation (future feature)
- **🎨 Professional Templates**: Beautiful HTML emails with restaurant branding
- **📱 Mobile Responsive**: Emails look great on all devices
- **🔄 Fallback System**: Console logging when SMTP is not configured

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd backend
npm install nodemailer
```

### 2. Configure Environment Variables
Create a `.env` file in the backend directory:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-secure-app-password
```

### 3. Restart the Server
```bash
npm start
```

## 🔧 Gmail Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to "Security"
3. Enable "2-Step Verification"

### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Other (Custom name)"
3. Enter "Bella Vista Restaurant" as the name
4. Copy the generated 16-character password

### Step 3: Update Environment Variables
```bash
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-secure-app-password  # Your 16-character app password
```

## 📧 Email Templates

### Confirmation Email Includes:
- ✅ Reservation confirmation badge
- 📋 Complete reservation details
- 🪑 Table information (name, number, capacity)
- 💬 Special requests (if any)
- 📞 Restaurant contact information
- 📍 Google Maps link
- ℹ️ Important information and policies
- 🎨 Professional Bella Vista branding

### Reminder Email Includes:
- ⏰ 24-hour reminder badge
- 📋 Reservation summary
- 📝 Important reminders
- 🎯 Pre-visit information

## 🧪 Testing the Email System

### Test Endpoint
```bash
GET /api/test-email
```

This endpoint sends a test email to verify your configuration.

### Console Logging (Development)
When SMTP is not configured, emails are logged to the console:
```
📧 EMAIL WOULD BE SENT (SMTP not configured):
To: customer@example.com
Subject: 🍕 Confirmación de Reserva - Bella Vista Restaurant
HTML Content: [Full HTML email content]
Text Content: [Plain text version]
```

## 🔄 Alternative Email Services

### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-secure-password
```

### Yahoo
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-secure-app-password
```

### Custom SMTP Server
```bash
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-secure-password
```

## 🛡️ Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use app passwords** instead of regular passwords
3. **Enable 2FA** on your email account
4. **Use environment variables** in production
5. **Regularly rotate** app passwords

## 🚨 Troubleshooting

### Common Issues

#### "Authentication failed"
- Verify your email and password
- Ensure 2FA is enabled (for Gmail)
- Use app password, not regular password

#### "Connection timeout"
- Check firewall settings
- Verify SMTP host and port
- Try different ports (587, 465, 25)

#### "Email not sending"
- Check console logs for errors
- Verify environment variables are loaded
- Test with `/api/test-email` endpoint

### Debug Mode
Enable detailed logging by setting:
```bash
NODE_ENV=development
```

## 📱 Email Preview

### Desktop View
- Professional layout with restaurant branding
- Clear reservation details
- Interactive buttons (Maps, Phone)
- Responsive design

### Mobile View
- Optimized for mobile devices
- Touch-friendly buttons
- Readable text on small screens
- Fast loading

## 🔮 Future Features

- **📅 Calendar Integration**: Add to Google/Outlook calendars
- **📱 SMS Notifications**: Text message confirmations
- **🔄 Auto-reminders**: 24h, 2h, and 1h before reservation
- **📊 Email Analytics**: Track open rates and engagement
- **🎨 Template Customization**: Admin panel for email editing

## 📞 Support

If you encounter issues:
1. Check the console logs
2. Verify environment variables
3. Test with the `/api/test-email` endpoint
4. Review this documentation

## 🎉 Success Indicators

When properly configured, you should see:
```
✅ Email service connection successful
✅ Reservation confirmation email sent successfully
✅ Confirmation email sent to customer@example.com
```

---

**Happy emailing! 📧✨**
