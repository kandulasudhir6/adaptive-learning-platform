import dotenv from 'dotenv';
dotenv.config();

export const sendOtpEmail = async (toEmail, otp) => {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not set. Skipping real email transmission.');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'PRIVID Authentication <onboarding@resend.dev>',
        to: [toEmail],
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
        </div>`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email via Resend');
    }

    console.log(`📧 Resend email sent successfully to ${toEmail}. ID: ${data.id}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email via Resend:', error);
    throw error;
  }
};
