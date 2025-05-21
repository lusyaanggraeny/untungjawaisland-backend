import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
});

// For testing purposes, we can use this method to create a test account
// Useful during development when you don't want to use real email credentials
export const createTestAccount = async () => {
  const testAccount = await nodemailer.createTestAccount();
  console.log('Test email account created:');
  console.log('Email:', testAccount.user);
  console.log('Password:', testAccount.pass);
  
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

// Use test account in development if needed
const isDevelopment = process.env.NODE_ENV === 'development';
let emailTransporter = transporter;

if (isDevelopment && !process.env.EMAIL_USER) {
  console.log('Using test email account for development');
  createTestAccount().then(testTransporter => {
    emailTransporter = testTransporter;
  });
}

export { emailTransporter };

// Verify connection configuration
emailTransporter.verify((error) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
}); 