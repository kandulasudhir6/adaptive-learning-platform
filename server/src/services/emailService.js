import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create a transporter using SMTP
// If credentials are not provided, it will gracefully fallback to console logging (which we handle in authController)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Standard Gmail SMTP. Can be changed if using Outlook, Yahoo, etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Note: For Gmail, this MUST be an 'App Password', not your normal password
  },
});

export const sendOtpEmail = async (toEmail, otp) => {
  // If the user hasn't set up their environment variables yet, just skip to avoid crashing
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ EMAIL_USER or EMAIL_PASS not set in .env. Skipping real email transmission.');
    return false;
  }

  const mailOptions = {
    from: `"PRIVID Authentication" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your PRIVID Verification Code',
    html: `
      <div style="font-family: sans-serif; max-w-md; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px; background-color: #f9fafb;">
        <h2 style="color: #6d28d9; text-align: center;">PRIVID Secure Login</h2>
        <p style="color: #374151; font-size: 16px;">Hello,</p>
        <p style="color: #374151; font-size: 16px;">You recently requested to log in or register for a PRIVID account. Here is your verification code:</p>
        
        <div style="margin: 30px 0; padding: 20px; background-color: #ffffff; border-radius: 8px; text-align: center; border: 2px dashed #a78bfa;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4c1d95;">${otp}</span>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; text-align: center;">This code will expire in 10 minutes.</p>
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 30px;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Real email sent successfully to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email. Please check server configuration.');
  }
};
