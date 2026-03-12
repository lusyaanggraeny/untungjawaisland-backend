import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'UntungJawa Homestay <onboarding@resend.dev>',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('Resend email error:', error);
      return false;
    }

    console.log('Email sent successfully via Resend:', data?.id);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const emailTransporter = {
  sendMail: async (mailOptions: any) => {
    const success = await sendEmail({
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
    });
    if (!success) throw new Error('Failed to send email via Resend');
    return { messageId: 'resend-' + Date.now() };
  },
  verify: (callback: (error: Error | null) => void) => {
    if (process.env.RESEND_API_KEY) {
      console.log('Resend email service ready');
      callback(null);
    } else {
      callback(new Error('RESEND_API_KEY is not set'));
    }
  }
};
