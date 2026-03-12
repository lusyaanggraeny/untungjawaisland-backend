import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

// Create Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email SMTP connection failed:', error);
  } else {
    console.log('✅ Email SMTP service ready');
  }
});

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const info = await transporter.sendMail({
      from: options.from || process.env.EMAIL_FROM || `UntungJawa Homestay <${process.env.EMAIL_USER}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

export const emailTransporter = {
  sendMail: async (mailOptions: any) => {
    const success = await sendEmail({
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      from: mailOptions.from,
    });
    if (!success) throw new Error('Failed to send email via SMTP');
    return { messageId: 'smtp-' + Date.now() };
  },
  verify: (callback: (error: Error | null) => void) => {
    transporter.verify((error) => {
      if (error) {
        console.error('❌ SMTP verification failed:', error);
        callback(error);
      } else {
        console.log('✅ SMTP email service ready');
        callback(null);
      }
    });
  }
};