const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendVerificationEmail = async (email, verifyUrl) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"FuelTrack" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your FuelTrack Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00e6a6;">Welcome to FuelTrack!</h2>
          <p>Thanks for signing up. Please verify your email address to get started.</p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #00e6a6; color: #0a0a0a; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't create an account, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Could not send verification email');
  }
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"FuelTrack" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'FuelTrack Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00e6a6;">Reset Your Password</h2>
          <p>You requested a password reset. Click the button below to set a new password.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #00e6a6; color: #0a0a0a; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't request a password reset, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Could not send password reset email');
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
