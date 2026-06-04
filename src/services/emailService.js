// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendAdminNotification = async (userName, userEmail, userPhone, conversationSummary, userMessage) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `🔔 New Support Request from ${userName || 'Anonymous User'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #4f46e5; }
            .label { font-weight: bold; color: #4f46e5; }
            .message-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 15px; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🤖 AI Chatbot Support Request</h2>
            </div>
            <div class="content">
              <p>A user has requested to speak with a real person after interacting with the AI chatbot.</p>
              
              <div class="info-box">
                <p><span class="label">👤 Name:</span> ${userName || 'Not provided'}</p>
                <p><span class="label">📧 Email:</span> ${userEmail || 'Not provided'}</p>
                <p><span class="label">📞 Phone:</span> ${userPhone || 'Not provided'}</p>
              </div>
              
              <div class="message-box">
                <p><span class="label">💬 User's Message:</span></p>
                <p>"${userMessage || 'User wants to talk to a real person'}"</p>
              </div>
              
              <div class="info-box">
                <p><span class="label">📝 Conversation Summary:</span></p>
                <p>${conversationSummary || 'No previous conversation'}</p>
              </div>
              
              <div style="text-align: center;">
                <a href="mailto:${userEmail || process.env.ADMIN_EMAIL}" class="button">📧 Reply via Email</a>
                <a href="tel:${userPhone || process.env.ADMIN_PHONE}" class="button" style="background: #10b981; margin-left: 10px;">📞 Call Now</a>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated notification from your AI Chatbot System.</p>
              <p>You can reply directly to this email to respond to the user.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('📧 Admin notification email sent');
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

const sendUserConfirmation = async (userEmail, userName, adminPhone) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: '📞 We received your request - Turbo Desk Solutions',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; }
            .phone-box { background: #e0e7ff; padding: 15px; text-align: center; border-radius: 10px; margin: 20px 0; }
            .phone-number { font-size: 24px; font-weight: bold; color: #4f46e5; text-decoration: none; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Thank You for Reaching Out! 🙏</h2>
            </div>
            <div class="content">
              <p>Dear ${userName || 'Valued Customer'},</p>
              <p>We have received your request to speak with our support team. A representative will contact you shortly.</p>
              
              <div class="phone-box">
                <p style="margin-bottom: 10px;">📞 <strong>For immediate assistance, call us directly:</strong></p>
                <a href="tel:${adminPhone}" class="phone-number">${adminPhone}</a>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="mailto:${process.env.ADMIN_EMAIL}" class="button">📧 Send Email</a>
                <a href="tel:${adminPhone}" class="button" style="background: #10b981;">📞 Call Now</a>
              </div>
              
              <p style="margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center;">
                We typically respond within 1-2 hours during business hours (Mon-Fri, 9am-6pm).
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('📧 User confirmation email sent');
    return true;
  } catch (error) {
    console.error('User email error:', error);
    return false;
  }
};

module.exports = { sendAdminNotification, sendUserConfirmation };