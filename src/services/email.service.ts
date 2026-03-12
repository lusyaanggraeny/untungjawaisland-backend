import { emailTransporter } from '../config/email';

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
  from: string = process.env.EMAIL_FROM || 'UntungJawa Homestay <onboarding@resend.dev>'
): Promise<any> => {
  try {
    const mailOptions = {
      from,
      to,
      subject,
      html
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
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
): Promise<any> => {
  const subject = `🏝️ Your Paradise Awaits! Booking Confirmed - ${bookingData.bookingNumber}`;
  const html = `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 15px;">
      <div style="background: white; border-radius: 15px; padding: 30px; margin-bottom: 20px; text-align: center;">
        <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">🌺 Welcome to Paradise! 🌺</h1>
        <h2 style="color: #3498db; margin: 10px 0; font-size: 22px;">Your Untung Jawa Adventure Begins</h2>
      </div>
      <div style="background: white; border-radius: 15px; padding: 30px;">
        <p style="font-size: 18px; color: #2c3e50;">🎉 <strong>Congratulations ${bookingData.customerName}!</strong> 🎉</p>
        <p style="font-size: 16px; color: #34495e; line-height: 1.8;">
          We're thrilled that you've chosen <strong>${bookingData.homestayName}</strong> for your island getaway! 🏖️
        </p>
        <div style="background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="margin: 0 0 20px 0; text-align: center;">✨ Your Booking Details ✨</h3>
          <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 20px;">
            <p style="margin: 8px 0;"><strong>🏷️ Booking Number:</strong> ${bookingData.bookingNumber}</p>
            <p style="margin: 8px 0;"><strong>🏡 Homestay:</strong> ${bookingData.homestayName}</p>
            <p style="margin: 8px 0;"><strong>🛏️ Room:</strong> ${bookingData.roomName}</p>
            <p style="margin: 8px 0;"><strong>📅 Check-in:</strong> ${bookingData.checkInDate}</p>
            <p style="margin: 8px 0;"><strong>📅 Check-out:</strong> ${bookingData.checkOutDate}</p>
            <p style="margin: 8px 0;"><strong>👥 Guests:</strong> ${bookingData.guestCount} ${bookingData.guestCount === 1 ? 'person' : 'people'}</p>
            <p style="margin: 8px 0;"><strong>💰 Total:</strong> IDR ${bookingData.totalPrice.toLocaleString()}</p>
            <p style="margin: 8px 0;"><strong>📊 Status:</strong> ${bookingData.bookingStatus}</p>
            <p style="margin: 8px 0;"><strong>💳 Payment:</strong> ${bookingData.paymentStatus}</p>
            ${bookingData.specialRequests ? `<p style="margin: 8px 0;"><strong>🌟 Special Requests:</strong> ${bookingData.specialRequests}</p>` : ''}
          </div>
        </div>
        <div style="background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%); color: white; border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; text-align: center;">🚀 What Happens Next?</h3>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>💳 <strong>Complete your payment</strong> to secure your reservation</li>
            <li>📱 We'll send you check-in details 24 hours before arrival</li>
            <li>🗺️ Start planning your island adventures!</li>
          </ul>
        </div>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ecf0f1;">
          <p style="color: #7f8c8d;">
            With tropical vibes,<br>
            <strong style="color: #2c3e50;">🌺 The UntungJawa Homestay Family 🌺</strong>
          </p>
        </div>
      </div>
    </div>
  `;
  return sendEmail(customerEmail, subject, html);
};

/**
 * Send booking notification to admin
 */
export const sendBookingNotificationToAdmin = async (
  adminEmail: string,
  bookingData: BookingEmailData | GuestBookingData
): Promise<any> => {
  const isGuestBooking = 'guestEmail' in bookingData;
  const subject = `🔔 New Booking! - ${bookingData.bookingNumber}`;

  const guestInfoHtml = isGuestBooking
    ? `
      <p style="margin: 8px 0;"><strong>📧 Guest Email:</strong> ${(bookingData as GuestBookingData).guestEmail}</p>
      <p style="margin: 8px 0;"><strong>📱 Guest Phone:</strong> ${(bookingData as GuestBookingData).guestPhone}</p>
    `
    : '';

  const html = `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%); padding: 20px; border-radius: 15px;">
      <div style="background: white; border-radius: 15px; padding: 25px; text-align: center;">
        <h1 style="color: #e74c3c; margin: 0;">🎉 New Booking Alert! 🎉</h1>
      </div>
      <div style="background: white; border-radius: 15px; padding: 25px; margin-top: 15px;">
        <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; border-radius: 12px; padding: 25px;">
          <h3 style="margin: 0 0 20px 0; text-align: center;">📋 Booking Information</h3>
          <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 20px;">
            <p style="margin: 8px 0;"><strong>🏷️ Booking Number:</strong> ${bookingData.bookingNumber}</p>
            <p style="margin: 8px 0;"><strong>👤 Guest Name:</strong> ${bookingData.customerName}</p>
            ${guestInfoHtml}
            <p style="margin: 8px 0;"><strong>🏡 Homestay:</strong> ${bookingData.homestayName}</p>
            <p style="margin: 8px 0;"><strong>🛏️ Room:</strong> ${bookingData.roomName}</p>
            <p style="margin: 8px 0;"><strong>📅 Check-in:</strong> ${bookingData.checkInDate}</p>
            <p style="margin: 8px 0;"><strong>📅 Check-out:</strong> ${bookingData.checkOutDate}</p>
            <p style="margin: 8px 0;"><strong>👥 Guests:</strong> ${bookingData.guestCount}</p>
            <p style="margin: 8px 0;"><strong>💰 Total:</strong> IDR ${bookingData.totalPrice.toLocaleString()}</p>
            <p style="margin: 8px 0;"><strong>📊 Status:</strong> ${bookingData.bookingStatus}</p>
            <p style="margin: 8px 0;"><strong>💳 Payment:</strong> ${bookingData.paymentStatus}</p>
            ${bookingData.specialRequests ? `<p style="margin: 8px 0;"><strong>🌟 Special Requests:</strong> ${bookingData.specialRequests}</p>` : ''}
          </div>
        </div>
        <div style="text-align: center; margin-top: 25px;">
          <p style="color: #7f8c8d;">UntungJawa Booking System 🏠</p>
        </div>
      </div>
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
): Promise<any> => {
  let statusText = '';
  let statusColor = '';
  let statusEmoji = '';
  let message = '';
  let excitement = '';

  switch (newStatus) {
    case 'confirmed':
      statusText = 'Your Island Adventure is Confirmed!';
      statusColor = '#2ecc71';
      statusEmoji = '✅';
      message = `Pack your bags, ${bookingData.customerName}! Your stay at ${bookingData.homestayName} is confirmed! 🏝️`;
      excitement = `<div style="background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); color: white; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;"><h3 style="margin: 0;">🌊 Get Ready for Paradise! 🌊</h3></div>`;
      break;
    case 'cancelled':
      statusText = 'Booking Cancellation Notification';
      statusColor = '#e74c3c';
      statusEmoji = '❌';
      message = `We're sorry your booking has been cancelled. We hope to welcome you in the future! 🌴`;
      excitement = `<div style="background: #fab1a0; color: white; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;"><h3 style="margin: 0;">🤗 We Hope to See You Soon!</h3></div>`;
      break;
    case 'completed':
      statusText = 'Thank You for Staying With Us!';
      statusColor = '#3498db';
      statusEmoji = '🎊';
      message = `Thank you for choosing ${bookingData.homestayName}! 🌺`;
      excitement = `<div style="background: linear-gradient(135deg, #a29bfe 0%, #fd79a8 100%); color: white; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;"><h3 style="margin: 0;">🌟 Until We Meet Again! 🌟</h3></div>`;
      break;
    default:
      statusText = `Booking Update: ${newStatus}`;
      statusColor = '#f39c12';
      statusEmoji = '📋';
      message = `Your booking status has been updated to ${newStatus}. 🌊`;
      excitement = '';
  }

  const subject = `${statusEmoji} ${statusText} - ${bookingData.bookingNumber}`;
  const html = `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 15px;">
      <div style="background: white; border-radius: 15px; padding: 25px; text-align: center;">
        <h1 style="color: ${statusColor}; margin: 0;">${statusEmoji} ${statusText} ${statusEmoji}</h1>
      </div>
      <div style="background: white; border-radius: 15px; padding: 30px; margin-top: 15px;">
        <p style="font-size: 18px; color: #2c3e50;">🌺 <strong>Hello ${bookingData.customerName}!</strong> 🌺</p>
        <p style="font-size: 16px; color: #34495e; line-height: 1.8;">${message}</p>
        <div style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); color: white; border-radius: 12px; padding: 25px; margin: 25px 0;">
          <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 20px;">
            <p style="margin: 8px 0;"><strong>🏷️ Booking Number:</strong> ${bookingData.bookingNumber}</p>
            <p style="margin: 8px 0;"><strong>🏡 Homestay:</strong> ${bookingData.homestayName}</p>
            <p style="margin: 8px 0;"><strong>🛏️ Room:</strong> ${bookingData.roomName}</p>
            <p style="margin: 8px 0;"><strong>📅 Check-in:</strong> ${bookingData.checkInDate}</p>
            <p style="margin: 8px 0;"><strong>📅 Check-out:</strong> ${bookingData.checkOutDate}</p>
            <p style="margin: 8px 0;"><strong>📊 New Status:</strong> ${newStatus.toUpperCase()}</p>
          </div>
        </div>
        ${excitement}
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ecf0f1;">
          <p style="color: #7f8c8d;">🌺 The UntungJawa Homestay Family 🌺</p>
        </div>
      </div>
    </div>
  `;
  return sendEmail(customerEmail, subject, html);
};