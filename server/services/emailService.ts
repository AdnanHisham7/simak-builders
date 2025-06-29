import nodemailer from 'nodemailer';
import { env } from '@config/env';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

// Email template styles and structure
const getEmailTemplate = (title: string, content: string, buttonText?: string, buttonUrl?: string, footer?: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f4f4f4;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .header p {
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #2d3748;
          font-size: 24px;
          margin-bottom: 20px;
          font-weight: 600;
        }
        .content p {
          font-size: 16px;
          line-height: 1.8;
          margin-bottom: 20px;
          color: #4a5568;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          transition: transform 0.2s ease;
        }
        .button:hover {
          transform: translateY(-1px);
        }
        .info-box {
          background-color: #f7fafc;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .password-display {
          background-color: #2d3748;
          color: #ffffff;
          padding: 15px 20px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          letter-spacing: 1px;
        }
        .footer {
          background-color: #f7fafc;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          font-size: 14px;
          color: #718096;
          margin-bottom: 10px;
        }
        .divider {
          height: 1px;
          background-color: #e2e8f0;
          margin: 30px 0;
        }
        .security-notice {
          background-color: #fff5f5;
          border-left: 4px solid #f56565;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .security-notice p {
          color: #c53030;
          font-size: 14px;
          margin: 0;
        }
        @media only screen and (max-width: 600px) {
          .email-container {
            margin: 0;
            border-radius: 0;
          }
          .header, .content, .footer {
            padding: 20px;
          }
          .header h1 {
            font-size: 24px;
          }
          .content h2 {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>Simak Builders</h1>
          <p>Secure • Reliable • Professional</p>
        </div>
        
        <div class="content">
          <h2>${title}</h2>
          ${content}
          
          ${buttonText && buttonUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${buttonUrl}" style="color: white;" class="button">${buttonText}</a>
            </div>
          ` : ''}
          
          ${footer ? `
            <div class="divider"></div>
            <div class="info-box">
              <p style="margin: 0; font-size: 14px;">${footer}</p>
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p><strong>Need help?</strong> Contact our support team at support@simakbuilders.com</p>
          <p>© 2025 Simak Builders. All rights reserved.</p>
          <p style="font-size: 12px; margin-top: 15px;">
            This email was sent to you because you have an account with us. 
            If you have any questions, please don't hesitate to contact us.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send verification email
export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const content = `
    <p>Welcome! We're excited to have you on board.</p>
    <p>To complete your account setup and start using our platform, please verify your email address by clicking the button below:</p>
    
    <div class="info-box">
      <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
    </div>
  `;
  
  const footer = `
    <strong>Didn't request this?</strong> If you didn't create an account with us, please ignore this email or contact our support team.
  `;
  
  await transporter.sendMail({
    to: email,
    subject: 'Verify your email address',
    html: getEmailTemplate(
      'Verify Your Email Address',
      content,
      'Verify Email Address',
      verificationUrl,
      footer
    ),
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const content = `
    <p>We received a request to reset the password for your account.</p>
    <p>If you made this request, click the button below to create a new password:</p>
    
    <div class="security-notice">
      <p><strong>Security Notice:</strong> This reset link will expire in 1 hour and can only be used once.</p>
    </div>
    
    <div class="info-box">
      <p><strong>Alternative method:</strong> If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-family: monospace; font-size: 14px;">${resetUrl}</p>
    </div>
  `;
  
  const footer = `
    <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
  `;
  
  await transporter.sendMail({
    to: email,
    subject: 'Reset your password',
    html: getEmailTemplate(
      'Reset Your Password',
      content,
      'Reset Password',
      resetUrl,
      footer
    ),
  });
};

// Send initial password email
export const sendInitialPasswordEmail = async (email: string, password: string): Promise<void> => {
  const content = `
    <p>Your account has been successfully created! We're thrilled to welcome you to our platform.</p>
    <p>Here are your login credentials:</p>
    
    <div class="info-box">
      <p><strong>Email:</strong> ${email}</p>
    </div>
    
    <div class="password-display">
      ${password}
    </div>
    
    <div class="security-notice">
      <p><strong>Important Security Notice:</strong> Please change this password immediately after your first login for security purposes.</p>
    </div>
    
    <p>You can now log in to your account and start exploring all the features we have to offer.</p>
  `;
  
  const footer = `
    <strong>Security Tips:</strong><br>
    • Never share your password with anyone<br>
    • Use a strong, unique password<br>
    • Enable two-factor authentication if available<br>
    • Log out from shared devices
  `;
  
  await transporter.sendMail({
    to: email,
    subject: '🎉 Welcome! Your account is ready',
    html: getEmailTemplate(
      'Welcome to Simak Builders',
      content,
      'Login to Your Account',
      `${env.FRONTEND_URL}/login`,
      footer
    ),
  });
};

// Send regenerated password email
export const sendRegeneratedPasswordEmail = async (email: string, password: string): Promise<void> => {
  const content = `
    <p>Your password has been successfully regenerated as requested.</p>
    <p>Here is your new password:</p>
    
    <div class="password-display">
      ${password}
    </div>
    
    <div class="security-notice">
      <p><strong>Important:</strong> For your security, please change this password to something memorable after logging in.</p>
    </div>
    
    <div class="info-box">
      <p><strong>What's next?</strong></p>
      <p>1. Log in with your new password<br>
      2. Go to your account settings<br>
      3. Change to a password you'll remember</p>
    </div>
  `;
  
  const footer = `
    <strong>Didn't request this?</strong> If you didn't request a password regeneration, please contact our support team immediately as this could indicate unauthorized access to your account.
  `;
  
  await transporter.sendMail({
    to: email,
    subject: 'Your new password is ready',
    html: getEmailTemplate(
      'Password Successfully Regenerated',
      content,
      'Login with New Password',
      `${env.FRONTEND_URL}/login`,
      footer
    ),
  });
};