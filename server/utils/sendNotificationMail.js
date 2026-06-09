const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const getAdminEmail = async () => {
  try {
    const admin = await User.findOne({ role: 'superadmin' });
    if (admin && admin.email) {
      return admin.email;
    }
  } catch (err) {
    console.error('Error in getAdminEmail:', err);
  }
  return process.env.ADMIN_EMAIL || 'admin@zaalima.com';
};

/**
 * Send email to Admin when a new customer registers.
 */
const sendNewUserRegistrationMail = async (user) => {
  try {
    const adminEmail = await getAdminEmail();
    await transporter.sendMail({
      from: `"Zaalima Notification" <${process.env.EMAIL}>`,
      to: adminEmail,
      subject: 'New User Registration Alert — Zaalima',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px;">
          <h2 style="color: #4F46E5;">New User Registered</h2>
          <p>Hello Admin,</p>
          <p>A new customer has successfully registered on the Zaalima platform.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">Name:</td>
              <td style="padding: 8px 0;">${user.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;">${user.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Registered At:</td>
              <td style="padding: 8px 0;">${new Date(user.createdAt).toLocaleString()}</td>
            </tr>
          </table>
          <hr style="border: 1px solid #E5E7EB; margin: 20px 0;" />
          <p style="color: #6B7280; font-size: 12px;">This is an automated notification. Please do not reply.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send new user registration mail to admin:', error);
  }
};

/**
 * Send email to Admin when a new vendor request is submitted.
 */
const sendNewVendorRequestMail = async (vendor) => {
  try {
    const adminEmail = await getAdminEmail();
    await transporter.sendMail({
      from: `"Zaalima Notification" <${process.env.EMAIL}>`,
      to: adminEmail,
      subject: 'New Vendor Approval Request — Zaalima',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px;">
          <h2 style="color: #4F46E5;">Vendor Registration Pending Approval</h2>
          <p>Hello Admin,</p>
          <p>A new vendor has registered and is awaiting your approval to access the store dashboard.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 150px;">Business Name:</td>
              <td style="padding: 8px 0;">${vendor.businessName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Contact Name:</td>
              <td style="padding: 8px 0;">${vendor.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;">${vendor.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Description:</td>
              <td style="padding: 8px 0;">${vendor.businessDescription || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Submitted At:</td>
              <td style="padding: 8px 0;">${new Date(vendor.createdAt).toLocaleString()}</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">
            Please log into the Admin Dashboard to review and approve/reject this request.
          </p>
          <hr style="border: 1px solid #E5E7EB; margin: 20px 0;" />
          <p style="color: #6B7280; font-size: 12px;">This is an automated notification. Please do not reply.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send vendor request mail to admin:', error);
  }
};

/**
 * Send email to Vendor when their account is approved.
 */
const sendVendorApprovedMail = async (vendor) => {
  try {
    // Send email to vendor
    await transporter.sendMail({
      from: `"Zaalima Store" <${process.env.EMAIL}>`,
      to: vendor.email,
      subject: 'Your Zaalima Vendor Account Has Been Approved! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px;">
          <h2 style="color: #4F46E5;">Congratulations, ${vendor.name}!</h2>
          <p>We are excited to inform you that your vendor application for <strong>${vendor.businessName}</strong> has been approved by our admin team.</p>
          <p>Your account is now active. You can log into the Zaalima platform and start managing your store, products, and sales.</p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          <p>Thank you for partnering with Zaalima.</p>
          <hr style="border: 1px solid #E5E7EB; margin: 20px 0;" />
          <p style="color: #6B7280; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `,
    });

    // Send confirmation to admin
    const adminEmail = await getAdminEmail();
    await transporter.sendMail({
      from: `"Zaalima Notification" <${process.env.EMAIL}>`,
      to: adminEmail,
      subject: 'Vendor Account Approved Notification — Zaalima',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px;">
          <h2 style="color: #4F46E5;">Vendor Approved</h2>
          <p>Hello Admin,</p>
          <p>The vendor account for <strong>${vendor.businessName}</strong> (${vendor.email}) has been successfully approved and set to active status.</p>
          <hr style="border: 1px solid #E5E7EB; margin: 20px 0;" />
          <p style="color: #6B7280; font-size: 12px;">This is an automated notification. Please do not reply.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send vendor approval emails:', error);
  }
};

module.exports = {
  sendNewUserRegistrationMail,
  sendNewVendorRequestMail,
  sendVendorApprovedMail,
};
