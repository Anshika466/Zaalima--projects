const nodemailer = require('nodemailer');

/**
 * Email Transporter — Gmail SMTP
 * Reuses the same EMAIL / EMAIL_PASSWORD env vars as sendOrderMail.
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send a 6-digit OTP email.
 * @param {string} email  - Recipient address
 * @param {string} otp    - The 6-digit code
 * @param {string} purpose - 'register' | 'email-change' | 'forgot-password'
 */
const sendOtpMail = async (email, otp, purpose = 'register') => {
  const purposeText = {
    register: 'Complete Your Registration',
    'email-change': 'Verify Email Change',
    'forgot-password': 'Reset Your Password',
  };

  const subject = `${purposeText[purpose] || 'OTP Verification'} — Zaalima`;

  await transporter.sendMail({
    from: `"Zaalima Store" <${process.env.EMAIL}>`,
    to: email,
    subject,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4F46E5, #6366F1); padding: 28px 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 22px; letter-spacing: 0.5px;">
            ${purposeText[purpose] || 'Verification Code'}
          </h1>
        </div>
        <div style="padding: 32px 24px; text-align: center;">
          <p style="color: #6B7280; font-size: 15px; margin: 0 0 24px;">
            Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.
          </p>
          <div style="background: #F3F4F6; border-radius: 8px; padding: 18px; margin: 0 auto; display: inline-block;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #4F46E5; font-family: 'Courier New', monospace;">
              ${otp}
            </span>
          </div>
          <p style="color: #9CA3AF; font-size: 13px; margin: 24px 0 0;">
            If you did not request this code, please ignore this email.
          </p>
        </div>
        <div style="background: #F9FAFB; padding: 16px 24px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} Zaalima — Do not reply to this email.
          </p>
        </div>
      </div>
    `,
  });
};

module.exports = sendOtpMail;
