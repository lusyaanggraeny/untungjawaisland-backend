import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    await sgMail.send({
      to: options.to,
      from: {
        email: process.env.EMAIL_FROM!,
        name: process.env.EMAIL_FROM_NAME || 'UntungJawa Homestay'
      },
      subject: options.subject,
      html: options.html,
    });
    console.log('✅ Email sent successfully to:', options.to);
    return true;
  } catch (error: any) {
    console.error('❌ SendGrid error:', error?.response?.body || error);
    return false;
  }
};