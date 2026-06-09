const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send order status update email to customer.
 * @param {string} email - Recipient's email address
 * @param {object} orderDetails - Order details (orderId, amount, status)
 */
const sendStatusMail = async (email, orderDetails = {}) => {
  const { amount, orderId, status } = orderDetails;

  const statusMessages = {
    placed: 'is now placed and awaiting processing.',
    processing: 'is now being processed.',
    shipped: 'has been shipped and is on its way to you! 🚚',
    delivered: 'has been successfully delivered. Enjoy your purchase! 🎉',
    cancelled: 'has been cancelled.',
  };

  const statusMsg = statusMessages[status] || `status has been updated to ${status}.`;

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: `Order Status Update: ${status.toUpperCase()} — Zaalima`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px;">
        <h2 style="color: #4F46E5;">Order Update</h2>
        <p>Hello,</p>
        <p>Your order <strong>#${String(orderId).slice(-8).toUpperCase()}</strong> ${statusMsg}</p>
        ${amount ? `<p><strong>Total Amount:</strong> ₹${amount.toLocaleString()}</p>` : ''}
        <p>Thank you for shopping with <strong>Zaalima</strong>.</p>
        <hr style="border: 1px solid #E5E7EB; margin: 20px 0;" />
        <p style="color: #6B7280; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `,
  });
};

module.exports = sendStatusMail;
