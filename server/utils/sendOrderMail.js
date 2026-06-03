const nodemailer = require('nodemailer');

/**
 * Email Transporter — Gmail SMTP
 * Uses EMAIL and PASSWORD from .env
 * Integrated from teammate's module.
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send order confirmation email to customer.
 * @param {string} email - Recipient's email address
 * @param {object} [orderDetails] - Optional order details to include in email
 */
const sendOrderMail = async (email, orderDetails = {}) => {
  const { amount, orderId } = orderDetails;

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: 'Order Confirmed — Zaalima',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Your order has been placed successfully! 🎉</h2>
        ${orderId ? `<p><strong>Order ID:</strong> ${orderId}</p>` : ''}
        ${amount ? `<p><strong>Amount:</strong> ₹${amount}</p>` : ''}
        <p>Thank you for shopping with <strong>Zaalima</strong>. We will notify you when your order ships.</p>
        <hr style="border: 1px solid #E5E7EB; margin: 20px 0;" />
        <p style="color: #6B7280; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `,
  });
};

module.exports = sendOrderMail;
