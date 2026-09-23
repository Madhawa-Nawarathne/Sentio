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
 * @param {string} toEmail - Recipient email address
 * @param {string} code - 6-digit verification code
 */
async function sendVerificationCode(toEmail, code) {

  const mailOptions = {
    from: `"Sentio" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Sentio Verification Code',

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 500px;
        margin: auto;
        padding: 30px;
        border: 1px solid #ddd;
        border-radius: 10px;
      ">

        <h2 style="text-align: center;">
          Sentio Email Verification
        </h2>

        <p>
          Thank you for registering with Sentio.
        </p>

        <p>
          Your 6-digit verification code is:
        </p>

        <div style="
          text-align: center;
          margin: 25px 0;
        ">

          <span style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
          ">
            ${code}
          </span>

        </div>

        <p>
          This code will expire in 10 minutes.
        </p>

        <p style="color: #777;">
          If you did not create a Sentio account,
          you can safely ignore this email.
        </p>

        <hr>

        <p style="
          text-align: center;
          color: #999;
          font-size: 12px;
        ">
          Sentio AI Wellness Platform
        </p>

      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  sendVerificationCode
};