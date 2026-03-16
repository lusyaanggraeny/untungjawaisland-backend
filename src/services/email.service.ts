import { sendEmail } from '../config/email';

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

export const sendBookingConfirmation = async (
  customerEmail: string,
  bookingData: BookingEmailData
): Promise<boolean> => {
  const subject = `Booking Confirmed - ${bookingData.bookingNumber} | UntungJawa Homestay`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2c3e50; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">UntungJawa Homestay</h1>
        <p style="color: #bdc3c7; margin: 5px 0;">Booking Confirmation</p>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd;">
        <p>Hi <strong>${bookingData.customerName}</strong>,</p>
        <p>Your booking has been received! Here are your details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #ecf0f1;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Booking Number</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.bookingNumber}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Homestay</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.homestayName}</td>
          </tr>
          <tr style="background: #ecf0f1;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Room</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.roomName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Check-in</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.checkInDate}</td>
          </tr>
          <tr style="background: #ecf0f1;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Check-out</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.checkOutDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Guests</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.guestCount} person(s)</td>
          </tr>
          <tr style="background: #ecf0f1;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Price</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">IDR ${bookingData.totalPrice.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Payment Status</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.paymentStatus}</td>
          </tr>
          <tr style="background: #ecf0f1;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Booking Status</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.bookingStatus}</td>
          </tr>
          ${bookingData.specialRequests ? `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Special Requests</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.specialRequests}</td>
          </tr>` : ''}
        </table>
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <strong>⚠️ Next Step:</strong> Please complete your payment via WhatsApp to confirm your reservation.
        </div>
        <p style="color: #7f8c8d; font-size: 13px;">
          If you have questions, please contact us.<br>
          Thank you for choosing UntungJawa Homestay!
        </p>
      </div>
      <div style="background: #2c3e50; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="color: #bdc3c7; margin: 0; font-size: 12px;">© UntungJawa Homestay</p>
      </div>
    </div>
  `;
  return sendEmail({ to: customerEmail, subject, html });
};

export const sendBookingNotificationToAdmin = async (
  adminEmail: string,
  bookingData: BookingEmailData | GuestBookingData
): Promise<boolean> => {
  const isGuestBooking = 'guestEmail' in bookingData;
  const subject = `New Booking - ${bookingData.bookingNumber} | UntungJawa`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #e74c3c; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">🔔 New Booking Alert</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #ecf0f1;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Booking Number</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.bookingNumber}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Guest Name</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.customerName}</td>
          </tr>
          ${isGuestBooking ? `
          <tr style="background: #ecf0f1;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Guest Email</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${(bookingData as GuestBookingData).guestEmail}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Guest Phone</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${(bookingData as GuestBookingData).guestPhone}</td>
          </tr>` : ''}
          <tr style="background: #ecf0f1;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Homestay</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.homestayName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Room</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.roomName}</td>
          </tr>
          <tr style="background: #ecf0f1;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Check-in</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.checkInDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Check-out</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.checkOutDate}</td>
          </tr>
          <tr style="background: #ecf0f1;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">IDR ${bookingData.totalPrice.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      <div style="background: #2c3e50; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="color: #bdc3c7; margin: 0; font-size: 12px;">© UntungJawa Homestay</p>
      </div>
    </div>
  `;
  return sendEmail({ to: adminEmail, subject, html });
};

export const sendBookingStatusUpdate = async (
  customerEmail: string,
  bookingData: BookingEmailData,
  newStatus: string
): Promise<boolean> => {
  const statusMap: Record<string, { label: string; color: string }> = {
    confirmed: { label: 'Confirmed ✅', color: '#2ecc71' },
    cancelled: { label: 'Cancelled ❌', color: '#e74c3c' },
    completed: { label: 'Completed 🎊', color: '#3498db' },
  };

  const statusInfo = statusMap[newStatus] || { label: newStatus, color: '#f39c12' };
  const subject = `Booking ${statusInfo.label} - ${bookingData.bookingNumber} | UntungJawa`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${statusInfo.color}; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Booking ${statusInfo.label}</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd;">
        <p>Hi <strong>${bookingData.customerName}</strong>,</p>
        <p>Your booking <strong>${bookingData.bookingNumber}</strong> status has been updated to
          <strong style="color: ${statusInfo.color};">${statusInfo.label}</strong>.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #ecf0f1;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Homestay</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.homestayName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Room</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.roomName}</td>
          </tr>
          <tr style="background: #ecf0f1;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Check-in</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.checkInDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Check-out</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingData.checkOutDate}</td>
          </tr>
        </table>
        <p style="color: #7f8c8d; font-size: 13px;">Thank you for choosing UntungJawa Homestay!</p>
      </div>
      <div style="background: #2c3e50; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="color: #bdc3c7; margin: 0; font-size: 12px;">© UntungJawa Homestay</p>
      </div>
    </div>
  `;
  return sendEmail({ to: customerEmail, subject, html });
};