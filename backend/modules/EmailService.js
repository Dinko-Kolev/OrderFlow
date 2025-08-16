const nodemailer = require('nodemailer')

class EmailService {
  constructor() {
    // Create transporter for sending emails
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true', // Convert string to boolean
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    // Check if all required SMTP settings are configured
    this.isConfigured = !!(
      process.env.SMTP_HOST && 
      process.env.SMTP_PORT && 
      process.env.SMTP_USER && 
      process.env.SMTP_PASS
    )
    
    if (!this.isConfigured) {
      console.log('⚠️  Email service not fully configured. Missing:')
      if (!process.env.SMTP_HOST) console.log('   - SMTP_HOST')
      if (!process.env.SMTP_PORT) console.log('   - SMTP_PORT')
      if (!process.env.SMTP_USER) console.log('   - SMTP_USER')
      if (!process.env.SMTP_PASS) console.log('   - SMTP_PASS')
      console.log('📧 Emails will be logged to console instead.')
    }
  }

  /**
   * Send reservation confirmation email
   */
  async sendReservationConfirmation(reservationData) {
    try {
      const emailContent = this.generateReservationEmail(reservationData)
      
      if (this.isConfigured) {
        // Send actual email
        const result = await this.transporter.sendMail({
          from: `"Bella Vista Restaurant" <${process.env.SMTP_USER}>`,
          to: reservationData.customerEmail,
          subject: '🍕 Confirmación de Reserva - Bella Vista Restaurant',
          html: emailContent.html,
          text: emailContent.text
        })
        
        console.log('✅ Reservation confirmation email sent successfully')
        return { success: true, messageId: result.messageId }
      } else {
        // Log email content to console (for development)
        console.log('📧 EMAIL WOULD BE SENT (SMTP not configured):')
        console.log('To:', reservationData.customerEmail)
        console.log('Subject: 🍕 Confirmación de Reserva - Bella Vista Restaurant')
        console.log('HTML Content:', emailContent.html)
        console.log('Text Content:', emailContent.text)
        
        return { success: true, messageId: 'console-log', message: 'Email logged to console (SMTP not configured)' }
      }
    } catch (error) {
      console.error('❌ Error sending reservation confirmation email:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Generate HTML email content for reservation confirmation
   */
  generateReservationEmail(reservationData) {
    const { 
      customerName, 
      reservationDate, 
      reservationTime, 
      numberOfGuests, 
      tableName, 
      tableNumber, 
      tableCapacity,
      specialRequests 
    } = reservationData

    const formattedDate = new Date(reservationDate).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Reserva</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .email-container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
          }
          .logo {
            font-size: 2.5em;
            margin-bottom: 10px;
          }
          .title {
            color: #dc2626;
            font-size: 1.8em;
            font-weight: bold;
            margin: 0;
          }
          .subtitle {
            color: #6b7280;
            font-size: 1.1em;
            margin: 5px 0 0 0;
          }
          .confirmation-badge {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            display: inline-block;
            margin: 10px 0;
          }
          .reservation-details {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #374151;
          }
          .detail-value {
            color: #1f2937;
            text-align: right;
          }
          .table-info {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .special-requests {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6b7280;
            font-size: 0.9em;
          }
          .contact-info {
            background-color: #f3f4f6;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 10px 5px;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          @media (max-width: 600px) {
            .email-container {
              padding: 20px;
            }
            .detail-row {
              flex-direction: column;
              align-items: flex-start;
            }
            .detail-value {
              text-align: left;
              margin-top: 5px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">🍕</div>
            <h1 class="title">Bella Vista Restaurant</h1>
            <p class="subtitle">Cocina italiana auténtica en el corazón de Madrid</p>
            <div class="confirmation-badge">✅ RESERVA CONFIRMADA</div>
          </div>

          <p>¡Hola <strong>${customerName}</strong>!</p>
          
          <p>Tu reserva en <strong>Bella Vista Restaurant</strong> ha sido confirmada exitosamente. 
          Estamos emocionados de recibirte y asegurarnos de que tengas una experiencia gastronómica excepcional.</p>

          <div class="reservation-details">
            <h3 style="margin-top: 0; color: #1f2937;">📋 Detalles de tu Reserva</h3>
            
            <div class="detail-row">
              <span class="detail-label">📅 Fecha:</span>
              <span class="detail-value">${formattedDate}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">🕒 Hora:</span>
              <span class="detail-value">${reservationTime}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">👥 Comensales:</span>
              <span class="detail-value">${numberOfGuests} ${numberOfGuests === 1 ? 'persona' : 'personas'}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">📧 Email:</span>
              <span class="detail-value">${reservationData.customerEmail}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">📱 Teléfono:</span>
              <span class="detail-value">${reservationData.customerPhone}</span>
            </div>
          </div>

          <div class="table-info">
            <h3 style="margin: 0 0 10px 0;">🪑 Tu Mesa</h3>
            <p style="margin: 0; font-size: 1.1em;">
              <strong>${tableName}</strong> (Mesa ${tableNumber})<br>
              <small>Capacidad: ${tableCapacity} personas</small>
            </p>
          </div>

          ${specialRequests ? `
            <div class="special-requests">
              <h4 style="margin: 0 0 10px 0; color: #92400e;">💬 Solicitudes Especiales</h4>
              <p style="margin: 0; color: #92400e;">${specialRequests}</p>
            </div>
          ` : ''}

          <div class="contact-info">
            <h4 style="margin: 0 0 10px 0;">📞 Información de Contacto</h4>
            <p style="margin: 5px 0;">
              <strong>Dirección:</strong> Calle Gran Vía, 123, Madrid<br>
              <strong>Teléfono:</strong> +34 91 123 45 67<br>
              <strong>Email:</strong> info@bellavista.com
            </p>
          </div>

          <div style="text-align: center; margin: 25px 0;">
            <a href="https://maps.google.com" class="button">📍 Ver en Google Maps</a>
            <a href="tel:+34911234567" class="button">📞 Llamar</a>
          </div>

          <div style="background-color: #f0f9ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0369a1;">ℹ️ Información Importante</h4>
            <ul style="margin: 0; padding-left: 20px; color: #0369a1;">
              <li>Llega 10 minutos antes de tu hora de reserva</li>
              <li>Puedes cancelar hasta 2 horas antes sin coste</li>
              <li>Te enviaremos un recordatorio 24 horas antes</li>
              <li>Estacionamiento disponible en las cercanías</li>
            </ul>
          </div>

          <p>Si tienes alguna pregunta o necesitas modificar tu reserva, no dudes en contactarnos.</p>

          <p>¡Esperamos verte pronto en Bella Vista Restaurant!</p>

          <p>Saludos,<br>
          <strong>El equipo de Bella Vista Restaurant</strong></p>

          <div class="footer">
            <p>Este email fue enviado automáticamente. Por favor, no respondas a este mensaje.</p>
            <p>© 2024 Bella Vista Restaurant. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
      🍕 Bella Vista Restaurant - Confirmación de Reserva

      ✅ RESERVA CONFIRMADA

      Hola ${customerName},

      Tu reserva en Bella Vista Restaurant ha sido confirmada exitosamente.

      📋 DETALLES DE LA RESERVA:
      - Fecha: ${formattedDate}
      - Hora: ${reservationTime}
      - Comensales: ${numberOfGuests} ${numberOfGuests === 1 ? 'persona' : 'personas'}
      - Mesa: ${tableName} (Mesa ${tableNumber}) - Capacidad: ${tableCapacity} personas
      - Email: ${reservationData.customerEmail}
      - Teléfono: ${reservationData.customerPhone}

      ${specialRequests ? `💬 SOLICITUDES ESPECIALES: ${specialRequests}\n` : ''}

      📞 INFORMACIÓN DE CONTACTO:
      - Dirección: Calle Gran Vía, 123, Madrid
      - Teléfono: +34 91 123 45 67
      - Email: info@bellavista.com

      ℹ️ INFORMACIÓN IMPORTANTE:
      - Llega 10 minutos antes de tu hora de reserva
      - Puedes cancelar hasta 2 horas antes sin coste
      - Te enviaremos un recordatorio 24 horas antes
      - Estacionamiento disponible en las cercanías

      Si tienes alguna pregunta, contacta con nosotros.

      ¡Esperamos verte pronto!

      Saludos,
      El equipo de Bella Vista Restaurant

      © 2024 Bella Vista Restaurant
    `

    return { html, text }
  }

  /**
   * Send reservation reminder email (24 hours before)
   */
  async sendReservationReminder(reservationData) {
    try {
      const emailContent = this.generateReminderEmail(reservationData)
      
      if (this.isConfigured) {
        const result = await this.transporter.sendMail({
          from: `"Bella Vista Restaurant" <${process.env.SMTP_USER}>`,
          to: reservationData.customerEmail,
          subject: '⏰ Recordatorio: Tu reserva es mañana - Bella Vista Restaurant',
          html: emailContent.html,
          text: emailContent.text
        })
        
        console.log('✅ Reservation reminder email sent successfully')
        return { success: true, messageId: result.messageId }
      } else {
        console.log('📧 REMINDER EMAIL WOULD BE SENT (SMTP not configured):')
        console.log('To:', reservationData.customerEmail)
        console.log('Subject: ⏰ Recordatorio: Tu reserva es mañana - Bella Vista Restaurant')
        
        return { success: true, messageId: 'console-log', message: 'Reminder email logged to console' }
      }
    } catch (error) {
      console.error('❌ Error sending reservation reminder email:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Generate reminder email content
   */
  generateReminderEmail(reservationData) {
    const { customerName, reservationDate, reservationTime, numberOfGuests, tableName, tableNumber } = reservationData
    
    const formattedDate = new Date(reservationDate).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recordatorio de Reserva</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .email-container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
          }
          .logo {
            font-size: 2.5em;
            margin-bottom: 10px;
          }
          .title {
            color: #dc2626;
            font-size: 1.8em;
            font-weight: bold;
            margin: 0;
          }
          .reminder-badge {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            display: inline-block;
            margin: 10px 0;
          }
          .reservation-details {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #374151;
          }
          .detail-value {
            color: #1f2937;
            text-align: right;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6b7280;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">🍕</div>
            <h1 class="title">Bella Vista Restaurant</h1>
            <div class="reminder-badge">⏰ RECORDATORIO DE RESERVA</div>
          </div>

          <p>¡Hola <strong>${customerName}</strong>!</p>
          
          <p>Te recordamos que <strong>mañana</strong> tienes una reserva en Bella Vista Restaurant. 
          Estamos preparando todo para que tengas una experiencia gastronómica excepcional.</p>

          <div class="reservation-details">
            <h3 style="margin-top: 0; color: #1f2937;">📋 Detalles de tu Reserva</h3>
            
            <div class="detail-row">
              <span class="detail-label">📅 Fecha:</span>
              <span class="detail-value">${formattedDate}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">🕒 Hora:</span>
              <span class="detail-value">${reservationTime}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">👥 Comensales:</span>
              <span class="detail-value">${numberOfGuests} ${numberOfGuests === 1 ? 'persona' : 'personas'}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">🪑 Mesa:</span>
              <span class="detail-value">${tableName} (Mesa ${tableNumber})</span>
            </div>
          </div>

          <div style="background-color: #f0f9ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0369a1;">📝 Recordatorios Importantes</h4>
            <ul style="margin: 0; padding-left: 20px; color: #0369a1;">
              <li>Llega 10 minutos antes de tu hora de reserva</li>
              <li>Si necesitas cancelar, hazlo al menos 2 horas antes</li>
              <li>Tenemos estacionamiento disponible en las cercanías</li>
              <li>Dress code: Casual elegante</li>
            </ul>
          </div>

          <p>¡Nos vemos mañana en Bella Vista Restaurant!</p>

          <p>Saludos,<br>
          <strong>El equipo de Bella Vista Restaurant</strong></p>

          <div class="footer">
            <p>Este email fue enviado automáticamente. Por favor, no respondas a este mensaje.</p>
            <p>© 2024 Bella Vista Restaurant. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
      🍕 Bella Vista Restaurant - Recordatorio de Reserva

      ⏰ RECORDATORIO DE RESERVA

      Hola ${customerName},

      Te recordamos que mañana tienes una reserva en Bella Vista Restaurant.

      📋 DETALLES DE LA RESERVA:
      - Fecha: ${formattedDate}
      - Hora: ${reservationTime}
      - Comensales: ${numberOfGuests} ${numberOfGuests === 1 ? 'persona' : 'personas'}
      - Mesa: ${tableName} (Mesa ${tableNumber})

      📝 RECORDATORIOS IMPORTANTES:
      - Llega 10 minutos antes de tu hora de reserva
      - Si necesitas cancelar, hazlo al menos 2 horas antes
      - Tenemos estacionamiento disponible en las cercanías
      - Dress code: Casual elegante

      ¡Nos vemos mañana!

      Saludos,
      El equipo de Bella Vista Restaurant

      © 2024 Bella Vista Restaurant
    `

    return { html, text }
  }

  /**
   * Test email service configuration
   */
  async testConnection() {
    try {
      if (!this.isConfigured) {
        return { success: false, message: 'Email service not configured' }
      }

      await this.transporter.verify()
      return { success: true, message: 'Email service connection successful' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

module.exports = { EmailService }
