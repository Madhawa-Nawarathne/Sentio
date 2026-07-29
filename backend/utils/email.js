const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Sends a 6-digit email verification code to the user.
 * @param {string} toEmail  - Recipient email address
 * @param {string} code     - 6-digit verification code
 */
async function sendVerificationCode(toEmail, code) {
  const mailOptions = {
    from: `"Sentio" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Sentio Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2d7a6b; margin-bottom: 8px;">Verify your Sentio account</h2>
        <p style="color: #444; font-size: 15px;">Use the code below to complete your registration. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2d7a6b; padding: 16px 0;">
          ${code}
        </div>
        <p style="color: #888; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationCode };
