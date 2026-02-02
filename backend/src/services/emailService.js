const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles sending emails for notifications
 */

// Create reusable transporter
let transporter = null;

const initializeTransporter = () => {
  if (transporter) return transporter;

  // Check if SMTP credentials are provided
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    // Create transporter
    try {
      // Check if nodemailer is available/mocked
      if (typeof nodemailer.createTransport === 'function') { // Corrected to createTransport
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.ethereal.email',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER || 'ethereal_user',
            pass: process.env.SMTP_PASS || 'ethereal_pass'
          }
        });
        console.log('✅ Email service initialized');
      } else {
        console.warn('⚠️ Nodemailer createTransport is not a function. Email sending disabled.'); // Corrected to createTransport
      }
    } catch (err) {
      console.warn('⚠️ Failed to create email transporter:', err.message);
    }
  } else {
    console.log('ℹ️  SMTP credentials not provided - email notifications disabled');
  }

  return transporter;
};

// Send token issued email
const sendTokenIssuedEmail = async (user, token, queue, organisation) => {
  const transport = initializeTransporter();
  if (!transport) return { success: false, message: 'Email not configured' };

  try {
    const mailOptions = {
      from: `"${organisation.name}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Token ${token.tokenId} - ${queue.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .token-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4CAF50; }
            .token-number { font-size: 32px; font-weight: bold; color: #4CAF50; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #666; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Token Issued</h1>
            </div>
            <div class="content">
              <p>Dear ${user.firstName} ${user.lastName},</p>
              <p>Your token has been successfully created!</p>
              
              <div class="token-box">
                <div class="token-number">${token.tokenId}</div>
                <div class="info-row">
                  <span class="label">Queue:</span> ${queue.name}
                </div>
                <div class="info-row">
                  <span class="label">Organisation:</span> ${organisation.name}
                </div>
                <div class="info-row">
                  <span class="label">Position:</span> ${token.position}
                </div>
                <div class="info-row">
                  <span class="label">Estimated Wait:</span> ${Math.round((token.position || 1) * (queue.averageTime || 10))} minutes
                </div>
              </div>
              
              <p>You will receive another notification when your token is called.</p>
              <p>Track your token status at: <a href="${process.env.FRONTEND_URL}/track/${token.id}">Track Token</a></p>
            </div>
            <div class="footer">
              <p>This is an automated message from Q-Ease Queue Management System</p>
              <p>${organisation.name} | ${organisation.address || ''}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transport.sendMail(mailOptions);
    console.log('✅ Token issued email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send token called email
const sendTokenCalledEmail = async (user, token, queue, organisation) => {
  const transport = initializeTransporter();
  if (!transport) return { success: false, message: 'Email not configured' };

  try {
    const mailOptions = {
      from: `"${organisation.name}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: user.email,
      subject: `🔔 Token ${token.tokenId} Called - Please Proceed`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF5722; color: white; padding: 20px; text-center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .alert-box { background: #FFF3E0; padding: 20px; margin: 20px 0; border-left: 4px solid #FF5722; }
            .token-number { font-size: 48px; font-weight: bold; color: #FF5722; text-align: center; }
            .urgent { color: #FF5722; font-weight: bold; font-size: 18px; text-align: center; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Your Token is Called!</h1>
            </div>
            <div class="content">
              <p>Dear ${user.firstName} ${user.lastName},</p>
              
              <div class="alert-box">
                <div class="token-number">${token.tokenId}</div>
                <p class="urgent">PLEASE PROCEED TO THE COUNTER IMMEDIATELY</p>
              </div>
              
              <p><strong>Queue:</strong> ${queue.name}</p>
              <p><strong>Organisation:</strong> ${organisation.name}</p>
              <p><strong>Called At:</strong> ${new Date(token.calledAt).toLocaleString()}</p>
              
              <p style="margin-top: 20px;">Please proceed to the service counter as soon as possible.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Q-Ease Queue Management System</p>
              <p>${organisation.name} | ${organisation.address || ''}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transport.sendMail(mailOptions);
    console.log('✅ Token called email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send token reminder email
const sendTokenReminderEmail = async (user, token, queue, organisation) => {
  const transport = initializeTransporter();
  if (!transport) return { success: false, message: 'Email not configured' };

  try {
    const mailOptions = {
      from: `"${organisation.name}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: user.email,
      subject: `⏰ Token ${token.tokenId} - Your Turn is Approaching`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF9800; color: white; padding: 20px; text-center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .reminder-box { background: #FFF8E1; padding: 20px; margin: 20px 0; border-left: 4px solid #FF9800; }
            .token-number { font-size: 36px; font-weight: bold; color: #FF9800; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Your Turn is Approaching</h1>
            </div>
            <div class="content">
              <p>Dear ${user.firstName} ${user.lastName},</p>
              
              <div class="reminder-box">
                <div class="token-number">${token.tokenId}</div>
                <p>Your token will be called soon. Please be ready!</p>
              </div>
              
              <p><strong>Queue:</strong> ${queue.name}</p>
              <p><strong>Organisation:</strong> ${organisation.name}</p>
              <p><strong>Current Position:</strong> ${token.position || 'Next few'}</p>
              
              <p style="margin-top: 20px;">Please make sure you're nearby and ready when your token is called.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Q-Ease Queue Management System</p>
              <p>${organisation.name} | ${organisation.address || ''}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transport.sendMail(mailOptions);
    console.log('✅ Token reminder email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendTokenIssuedEmail,
  sendTokenCalledEmail,
  sendTokenReminderEmail
};
