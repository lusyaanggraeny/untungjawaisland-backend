import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
});

const isDevelopment = process.env.NODE_ENV === 'development';

export let emailTransporter = transporter;

if (isDevelopment && !process.env.EMAIL_USER) {
  console.log('Using test email account for development');

  nodemailer.createTestAccount().then(testAccount => {
    emailTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  });
}

emailTransporter.verify((error) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server ready');
  }
});