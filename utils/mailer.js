const nodemailer = require('nodemailer');
require('dotenv').config(); // .env ဖိုင်က environment variables တွေကို သုံးဖို့

// Nodemailer transporter ကို configure လုပ်ပါ
const transporter = nodemailer.createTransport({
  service: 'gmail', // Gmail ကိုသုံးမယ်
  auth: {
    user: process.env.EMAIL_USER, // .env ဖိုင်ထဲက Gmail address
    pass: process.env.EMAIL_PASS  // .env ဖိုင်ထဲက Gmail App Password
  },
  // Optional: TLS settings for some environments
  // tls: {
  //   rejectUnauthorized: false
  // }
});

// Verification email ပို့မယ့် function (Ensure this is declared only ONCE)
const sendVerificationEmail = async (toEmail, code) => {
  const mailOptions = {
    from: `"Your App Name" <${process.env.EMAIL_USER}>`, // Sender address (App Name ကို ပြင်ပါ)
    to: toEmail, // Recipient address
    subject: 'Verify Your Account - Your App Name', // Subject line (App Name ကို ပြင်ပါ)
    text: `Welcome! Your verification code is: ${code}\nThis code will expire in 10 minutes.`, // Plain text body
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #333;">Welcome to Your App Name!</h2>
        <p>Thank you for registering. Please use the following code to verify your email address:</p>
        <p style="font-size: 24px; font-weight: bold; color: #007bff; margin: 20px 0; letter-spacing: 2px;">${code}</p>
        <p>This code is valid for 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 0.9em; color: #aaa;">Your App Name Team</p>
      </div>
    ` // HTML body (App Name ကို ပြင်ပါ)
  };

  try {
    // --- Added logs ---
    console.log(`Attempting to send email via Nodemailer to: ${toEmail}`);
    console.log(`Using email user from .env: ${process.env.EMAIL_USER ? '******' : 'NOT SET'}`); // Don't log the actual user directly, just check if set
    // --- End of added logs ---

    let info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully: %s', info.messageId); // Log success
    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info)); // Only used for testing services like Ethereal
    return info; // Return info object on success
  } catch (error) {
    // --- Modified log ---
    console.error('!!! Nodemailer failed to send email !!!');
    console.error('Error details:', error); // Log the full error object
    // --- End of modification ---
    // Error ကို ပြန် throw လုပ်ပေးပါ၊ ဒါမှ route handler က သိနိုင်မှာပါ
    throw new Error('Could not send verification email. Please check server logs.');
  }
}; // End of the single sendVerificationEmail function definition

// Make sure the export is correct and only happens once
module.exports = { sendVerificationEmail };