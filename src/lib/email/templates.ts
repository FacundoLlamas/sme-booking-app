/**
 * Email HTML Templates
 * Professional, responsive email templates for booking notifications
 */

/**
 * Base email template with responsive design
 */
function baseEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SME Services</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .booking-card {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .booking-detail {
      margin: 10px 0;
      font-size: 16px;
    }
    .booking-detail strong {
      color: #667eea;
      display: inline-block;
      min-width: 120px;
    }
    .cta-button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .cta-button:hover {
      opacity: 0.9;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #e9ecef;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .footer-links {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
    }
    .footer-links a {
      color: #999;
      text-decoration: none;
      margin: 0 10px;
    }
    .footer-disclaimer {
      margin-top: 10px;
      font-size: 11px;
      color: #999;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
      }
      .content {
        padding: 20px 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Confirmation email when booking is created
 */
export function confirmationEmail(
  customerName: string,
  bookingCode: string,
  date: string,
  time: string,
  businessPhone: string,
  serviceType?: string
): string {
  const content = `
    <div class="header">
      <h1>✓ Booking Confirmed!</h1>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Great news! Your service appointment has been confirmed.</p>
      
      <div class="booking-card">
        <div class="booking-detail"><strong>Booking Code:</strong> ${bookingCode}</div>
        <div class="booking-detail"><strong>Date:</strong> ${date}</div>
        <div class="booking-detail"><strong>Time:</strong> ${time}</div>
        ${serviceType ? `<div class="booking-detail"><strong>Service:</strong> ${serviceType}</div>` : ''}
      </div>
      
      <p>We'll send you a reminder 24 hours before your appointment.</p>
      
      <p><strong>Need to make changes?</strong><br>
      Call us at <a href="tel:${businessPhone}">${businessPhone}</a></p>
      
      <p>Thank you for choosing SME Services!</p>
    </div>
    <div class="footer">
      <p>SME Services - Professional Service Bookings</p>
      <p><a href="tel:${businessPhone}">${businessPhone}</a></p>
      <div class="footer-links">
        <a href="{{unsubscribe_url}}">Unsubscribe</a> | 
        <a href="{{preferences_url}}">Email Preferences</a>
      </div>
      <div class="footer-disclaimer">
        This is an automated message. Please do not reply to this email.
      </div>
    </div>
  `;

  return baseEmailTemplate(content);
}

/**
 * Reminder email 24 hours before appointment
 */
export function reminderEmail_24h(
  customerName: string,
  date: string,
  time: string,
  bookingCode?: string,
  businessPhone?: string
): string {
  const content = `
    <div class="header">
      <h1>⏰ Appointment Reminder</h1>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>This is a friendly reminder about your upcoming appointment <strong>tomorrow</strong>.</p>
      
      <div class="booking-card">
        ${bookingCode ? `<div class="booking-detail"><strong>Booking Code:</strong> ${bookingCode}</div>` : ''}
        <div class="booking-detail"><strong>Date:</strong> ${date}</div>
        <div class="booking-detail"><strong>Time:</strong> ${time}</div>
      </div>
      
      <p>We're looking forward to serving you!</p>
      
      ${businessPhone ? `<p><strong>Questions?</strong><br>Call us at <a href="tel:${businessPhone}">${businessPhone}</a></p>` : ''}
      
      <p>See you soon!</p>
    </div>
    <div class="footer">
      <p>SME Services - Professional Service Bookings</p>
      ${businessPhone ? `<p><a href="tel:${businessPhone}">${businessPhone}</a></p>` : ''}
      <div class="footer-links">
        <a href="{{unsubscribe_url}}">Unsubscribe</a> | 
        <a href="{{preferences_url}}">Email Preferences</a>
      </div>
      <div class="footer-disclaimer">
        This is an automated message. Please do not reply to this email.
      </div>
    </div>
  `;

  return baseEmailTemplate(content);
}

/**
 * Reminder email 2 hours before appointment
 */
export function reminderEmail_2h(
  customerName: string,
  time: string,
  address?: string,
  technicianName?: string
): string {
  const content = `
    <div class="header">
      <h1>🔔 Starting Soon!</h1>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Your appointment is starting in <strong>2 hours</strong>!</p>
      
      <div class="booking-card">
        <div class="booking-detail"><strong>Time:</strong> ${time}</div>
        ${address ? `<div class="booking-detail"><strong>Location:</strong> ${address}</div>` : ''}
        ${technicianName ? `<div class="booking-detail"><strong>Technician:</strong> ${technicianName}</div>` : ''}
      </div>
      
      <p>Please ensure someone is available to provide access to the property.</p>
      
      <p>We're looking forward to serving you!</p>
    </div>
    <div class="footer">
      <p>SME Services - Professional Service Bookings</p>
      <div class="footer-links">
        <a href="{{unsubscribe_url}}">Unsubscribe</a> | 
        <a href="{{preferences_url}}">Email Preferences</a>
      </div>
      <div class="footer-disclaimer">
        This is an automated message. Please do not reply to this email.
      </div>
    </div>
  `;

  return baseEmailTemplate(content);
}

/**
 * Cancellation confirmation email
 */
export function cancellationEmail(
  customerName: string,
  bookingCode: string,
  reason?: string,
  businessPhone?: string
): string {
  const content = `
    <div class="header">
      <h1>Booking Cancelled</h1>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Your booking has been cancelled as requested.</p>
      
      <div class="booking-card">
        <div class="booking-detail"><strong>Booking Code:</strong> ${bookingCode}</div>
        ${reason ? `<div class="booking-detail"><strong>Reason:</strong> ${reason}</div>` : ''}
        <div class="booking-detail"><strong>Status:</strong> Cancelled</div>
      </div>
      
      <p>We're sorry we couldn't serve you this time.</p>
      
      ${businessPhone ? `<p><strong>Want to rebook?</strong><br>Call us at <a href="tel:${businessPhone}">${businessPhone}</a></p>` : ''}
      
      <p>We hope to see you again soon!</p>
    </div>
    <div class="footer">
      <p>SME Services - Professional Service Bookings</p>
      ${businessPhone ? `<p><a href="tel:${businessPhone}">${businessPhone}</a></p>` : ''}
      <div class="footer-links">
        <a href="{{unsubscribe_url}}">Unsubscribe</a> | 
        <a href="{{preferences_url}}">Email Preferences</a>
      </div>
      <div class="footer-disclaimer">
        This is an automated message. Please do not reply to this email.
      </div>
    </div>
  `;

  return baseEmailTemplate(content);
}

/**
 * Rescheduling confirmation email
 */
export function rescheduleEmail(
  customerName: string,
  bookingCode: string,
  oldDate: string,
  oldTime: string,
  newDate: string,
  newTime: string
): string {
  const content = `
    <div class="header">
      <h1>📅 Appointment Rescheduled</h1>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Your appointment has been successfully rescheduled.</p>
      
      <div class="booking-card">
        <div class="booking-detail"><strong>Booking Code:</strong> ${bookingCode}</div>
        <div class="booking-detail"><strong>Previous:</strong> ${oldDate} at ${oldTime}</div>
        <div class="booking-detail"><strong>New Date:</strong> ${newDate}</div>
        <div class="booking-detail"><strong>New Time:</strong> ${newTime}</div>
      </div>
      
      <p>We'll send you a reminder before your new appointment time.</p>
      
      <p>Thank you for your flexibility!</p>
    </div>
    <div class="footer">
      <p>SME Services - Professional Service Bookings</p>
      <div class="footer-links">
        <a href="{{unsubscribe_url}}">Unsubscribe</a> | 
        <a href="{{preferences_url}}">Email Preferences</a>
      </div>
      <div class="footer-disclaimer">
        This is an automated message. Please do not reply to this email.
      </div>
    </div>
  `;

  return baseEmailTemplate(content);
}

/**
 * Service completion email with feedback request
 */
export function serviceCompletedEmail(
  customerName: string,
  bookingCode: string,
  serviceType: string,
  feedbackLink?: string
): string {
  const content = `
    <div class="header">
      <h1>✅ Service Completed</h1>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Thank you for choosing SME Services! Your service has been completed.</p>
      
      <div class="booking-card">
        <div class="booking-detail"><strong>Booking Code:</strong> ${bookingCode}</div>
        <div class="booking-detail"><strong>Service:</strong> ${serviceType}</div>
        <div class="booking-detail"><strong>Status:</strong> Completed</div>
      </div>
      
      ${feedbackLink ? `
      <p style="text-align: center;">
        <a href="${feedbackLink}" class="cta-button">Rate Your Experience</a>
      </p>
      <p>Your feedback helps us improve our service!</p>
      ` : '<p>We hope you\'re satisfied with our service!</p>'}
      
      <p>We look forward to serving you again!</p>
    </div>
    <div class="footer">
      <p>SME Services - Professional Service Bookings</p>
      <div class="footer-links">
        <a href="{{unsubscribe_url}}">Unsubscribe</a> | 
        <a href="{{preferences_url}}">Email Preferences</a>
      </div>
      <div class="footer-disclaimer">
        This is an automated message. Please do not reply to this email.
      </div>
    </div>
  `;

  return baseEmailTemplate(content);
}
