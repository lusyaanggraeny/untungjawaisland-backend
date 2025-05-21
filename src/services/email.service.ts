import { emailTransporter } from '../config/email';
import nodemailer from 'nodemailer';

interface BookingEmailData {
  bookingNumber: string;
  customerName: string;
  homestayName: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  paymentStatus: string;
  bookingStatus: string;
  guestCount: number;
  specialRequests?: string;
}

interface GuestBookingData extends BookingEmailData {
  guestEmail: string;
  guestPhone: string;
}

/**
 * Base email sending function
 */
export const sendEmail = async (
  to: string, 
  subject: string, 
  html: string,
  from: string = process.env.EMAIL_FROM || 'UntungJawa Homestay <noreply@untungjawa.com>'
) => {
  try {
    const mailOptions = {
      from,
      to,
      subject,
      html
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    // Log preview URL in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Email preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send booking confirmation to customer
 */
export const sendBookingConfirmation = async (
  customerEmail: string, 
  bookingData: BookingEmailData
) => {
  const subject = `Booking Confirmation - ${bookingData.bookingNumber}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3498db;">Booking Confirmation</h2>
      <p>Hello ${bookingData.customerName},</p>
      <p>Thank you for booking with UntungJawa Homestay. Your booking details are as follows:</p>
      
      <div style="background-color: #f9f9f9; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
        <p><strong>Booking Number:</strong> ${bookingData.bookingNumber}</p>
        <p><strong>Homestay:</strong> ${bookingData.homestayName}</p>
        <p><strong>Room:</strong> ${bookingData.roomName}</p>
        <p><strong>Check-in Date:</strong> ${bookingData.checkInDate}</p>
        <p><strong>Check-out Date:</strong> ${bookingData.checkOutDate}</p>
        <p><strong>Number of Guests:</strong> ${bookingData.guestCount}</p>
        <p><strong>Total Price:</strong> IDR ${bookingData.totalPrice.toLocaleString()}</p>
        <p><strong>Booking Status:</strong> ${bookingData.bookingStatus}</p>
        <p><strong>Payment Status:</strong> ${bookingData.paymentStatus}</p>
        ${bookingData.specialRequests ? `<p><strong>Special Requests:</strong> ${bookingData.specialRequests}</p>` : ''}
      </div>
      
      <p>Please complete your payment to confirm this booking. If you have any questions, please don't hesitate to contact us.</p>
      
      <p>Best Regards,<br>UntungJawa Homestay Team</p>
    </div>
  `;

  return sendEmail(customerEmail, subject, html);
};

/**
 * Send booking notification to homestay owner or admin
 */
export const sendBookingNotificationToAdmin = async (
  adminEmail: string,
  bookingData: BookingEmailData | GuestBookingData
) => {
  const isGuestBooking = 'guestEmail' in bookingData;
  const subject = `New Booking - ${bookingData.bookingNumber}`;
  
  const guestInfoHtml = isGuestBooking 
    ? `
      <p><strong>Guest Email:</strong> ${(bookingData as GuestBookingData).guestEmail}</p>
      <p><strong>Guest Phone:</strong> ${(bookingData as GuestBookingData).guestPhone}</p>
    ` 
    : '';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e74c3c;">New Booking Alert</h2>
      <p>Hello Admin,</p>
      <p>A new booking has been made:</p>
      
      <div style="background-color: #f9f9f9; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
        <p><strong>Booking Number:</strong> ${bookingData.bookingNumber}</p>
        <p><strong>Customer:</strong> ${bookingData.customerName}</p>
        ${guestInfoHtml}
        <p><strong>Homestay:</strong> ${bookingData.homestayName}</p>
        <p><strong>Room:</strong> ${bookingData.roomName}</p>
        <p><strong>Check-in Date:</strong> ${bookingData.checkInDate}</p>
        <p><strong>Check-out Date:</strong> ${bookingData.checkOutDate}</p>
        <p><strong>Number of Guests:</strong> ${bookingData.guestCount}</p>
        <p><strong>Total Price:</strong> IDR ${bookingData.totalPrice.toLocaleString()}</p>
        <p><strong>Booking Status:</strong> ${bookingData.bookingStatus}</p>
        <p><strong>Payment Status:</strong> ${bookingData.paymentStatus}</p>
        ${bookingData.specialRequests ? `<p><strong>Special Requests:</strong> ${bookingData.specialRequests}</p>` : ''}
      </div>
      
      <p>Please review and confirm this booking.</p>
      
      <p>Best Regards,<br>UntungJawa Booking System</p>
    </div>
  `;

  return sendEmail(adminEmail, subject, html);
};

/**
 * Send booking status update notification
 */
export const sendBookingStatusUpdate = async (
  customerEmail: string,
  bookingData: BookingEmailData,
  newStatus: string
) => {
  let statusText = '';
  let statusColor = '';
  
  switch (newStatus) {
    case 'confirmed':
      statusText = 'Your booking has been confirmed';
      statusColor = '#2ecc71';
      break;
    case 'cancelled':
      statusText = 'Your booking has been cancelled';
      statusColor = '#e74c3c';
      break;
    case 'completed':
      statusText = 'Your booking has been completed';
      statusColor = '#3498db';
      break;
    default:
      statusText = `Your booking status has been updated to ${newStatus}`;
      statusColor = '#f39c12';
  }
  
  const subject = `Booking Update - ${bookingData.bookingNumber}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${statusColor};">${statusText}</h2>
      <p>Hello ${bookingData.customerName},</p>
      <p>We're writing to inform you that your booking status has been updated:</p>
      
      <div style="background-color: #f9f9f9; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0;">
        <p><strong>Booking Number:</strong> ${bookingData.bookingNumber}</p>
        <p><strong>Homestay:</strong> ${bookingData.homestayName}</p>
        <p><strong>Room:</strong> ${bookingData.roomName}</p>
        <p><strong>Check-in Date:</strong> ${bookingData.checkInDate}</p>
        <p><strong>Check-out Date:</strong> ${bookingData.checkOutDate}</p>
        <p><strong>New Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${newStatus.toUpperCase()}</span></p>
      </div>
      
      ${newStatus === 'cancelled' ? '<p>If you have any questions about this cancellation, please contact us.</p>' : ''}
      ${newStatus === 'confirmed' ? '<p>We look forward to welcoming you soon!</p>' : ''}
      
      <p>Best Regards,<br>UntungJawa Homestay Team</p>
    </div>
  `;

  return sendEmail(customerEmail, subject, html);
}; 