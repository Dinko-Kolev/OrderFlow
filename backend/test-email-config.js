// Test Email Configuration
// Run this to verify your email settings work

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConfig() {
  console.log('🧪 Testing Email Configuration...\n');
  
  // Display current configuration
  console.log('📧 Current Email Configuration:');
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   Port: ${process.env.SMTP_PORT}`);
  console.log(`   Secure: ${process.env.SMTP_SECURE}`);
  console.log(`   User: ${process.env.SMTP_USER}`);
  console.log(`   Password: ${process.env.SMTP_PASS ? '***configured***' : 'NOT SET'}\n`);

  // Check if all required settings are present
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(key => console.log(`   - ${key}`));
    console.log('\nPlease check your .env file and try again.');
    return;
  }

  try {
    // Create transporter
    console.log('🔧 Creating email transporter...');
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Test email (optional - uncomment to send test email)
    /*
    console.log('📤 Sending test email...');
    const result = await transporter.sendMail({
      from: `"Bella Vista Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself
      subject: '🧪 Test Email - Bella Vista Restaurant',
      html: '<h1>Test Email</h1><p>If you receive this, your email configuration is working!</p>'
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    */
    
    console.log('\n🎉 Email configuration is working correctly!');
    console.log('You can now use the email service in your application.');
    
  } catch (error) {
    console.error('❌ Email configuration test failed:');
    console.error('   Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Check your username and password.');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Check your host and port settings.');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 Connection timeout. Check your network and firewall settings.');
    }
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Verify your email credentials');
    console.log('   2. Check if port 465 is open on your server');
    console.log('   3. Ensure SSL/TLS is enabled');
    console.log('   4. Try using port 587 with STARTTLS instead');
  }
}

// Run the test
testEmailConfig();
