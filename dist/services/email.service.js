"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBookingStatusUpdate = exports.sendBookingNotificationToAdmin = exports.sendBookingConfirmation = exports.sendEmail = void 0;
const email_1 = require("../config/email");
const nodemailer_1 = __importDefault(require("nodemailer"));
/**
 * Base email sending function
 */
const sendEmail = async (to, subject, html, from = process.env.EMAIL_FROM || 'UntungJawa Homestay <noreply@untungjawa.com>') => {
    try {
        const mailOptions = {
            from,
            to,
            subject,
            html
        };
        const info = await email_1.emailTransporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        // Log preview URL in development
        if (process.env.NODE_ENV === 'development') {
            console.log('Email preview URL:', nodemailer_1.default.getTestMessageUrl(info));
        }
        return info;
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
exports.sendEmail = sendEmail;
/**
 * Send booking confirmation to customer
 */
const sendBookingConfirmation = async (customerEmail, bookingData) => {
    const subject = `🏝️ Your Paradise Awaits! Booking Confirmed - ${bookingData.bookingNumber}`;
    const html = `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 15px;">
      
      <!-- Header Section -->
      <div style="background: white; border-radius: 15px; padding: 30px; margin-bottom: 20px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <h1 style="color: #2c3e50; margin: 0; font-size: 28px; font-weight: bold;">🌺 Welcome to Paradise! 🌺</h1>
        <h2 style="color: #3498db; margin: 10px 0; font-size: 22px;">Your Untung Jawa Adventure Begins</h2>
        <div style="width: 80px; height: 3px; background: linear-gradient(to right, #3498db, #2ecc71); margin: 20px auto;"></div>
      </div>
      
      <!-- Main Content -->
      <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <p style="font-size: 18px; color: #2c3e50; margin-bottom: 20px;">
          🎉 <strong>Congratulations ${bookingData.customerName}!</strong> 🎉
        </p>
        
        <p style="font-size: 16px; color: #34495e; line-height: 1.8; margin-bottom: 25px;">
          We're absolutely <em>thrilled</em> that you've chosen <strong>${bookingData.homestayName}</strong> for your island getaway! 
          Your booking has been confirmed and we can't wait to welcome you to our slice of paradise. 🏖️
        </p>
        
        <!-- Booking Details Card -->
        <div style="background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 8px 25px rgba(0,0,0,0.15);">
          <h3 style="margin: 0 0 20px 0; font-size: 20px; text-align: center;">✨ Your Booking Details ✨</h3>
          
          <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 20px; backdrop-filter: blur(10px);">
            <p style="margin: 8px 0; font-size: 16px;"><strong>🏷️ Booking Number:</strong> ${bookingData.bookingNumber}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>🏡 Homestay:</strong> ${bookingData.homestayName}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>🛏️ Room:</strong> ${bookingData.roomName}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>📅 Check-in:</strong> ${bookingData.checkInDate}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>📅 Check-out:</strong> ${bookingData.checkOutDate}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>👥 Guests:</strong> ${bookingData.guestCount} ${bookingData.guestCount === 1 ? 'person' : 'people'}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>💰 Total:</strong> IDR ${bookingData.totalPrice.toLocaleString()}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>📊 Status:</strong> <span style="background: #2ecc71; padding: 4px 12px; border-radius: 20px; font-size: 14px;">${bookingData.bookingStatus}</span></p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>💳 Payment:</strong> <span style="background: #f39c12; padding: 4px 12px; border-radius: 20px; font-size: 14px;">${bookingData.paymentStatus}</span></p>
            ${bookingData.specialRequests ? `<p style="margin: 8px 0; font-size: 16px;"><strong>🌟 Special Requests:</strong> ${bookingData.specialRequests}</p>` : ''}
          </div>
        </div>
        
        <!-- What's Next Section -->
        <div style="background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%); color: white; border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px; text-align: center;">🚀 What Happens Next?</h3>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>💳 <strong>Complete your payment</strong> to secure your reservation</li>
            <li>📱 We'll send you check-in details 24 hours before arrival</li>
            <li>🗺️ Start planning your island adventures!</li>
            <li>📞 Feel free to contact us with any questions</li>
          </ul>
        </div>
        
        <!-- Excitement Section -->
        <div style="text-align: center; margin: 30px 0;">
          <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 20px;">🌅 Get Ready for an Amazing Experience! 🌅</h3>
          <p style="color: #34495e; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Picture yourself waking up to the gentle sound of waves, enjoying fresh tropical air, and experiencing the warm hospitality 
            that makes Untung Jawa so special. Your perfect island escape is just around the corner! 🌊
          </p>
          
          <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <p style="color: #2c3e50; font-size: 16px; margin: 0; font-style: italic;">
              "The island is calling, and you must go!" 🏝️✨
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ecf0f1;">
          <p style="color: #7f8c8d; margin: 5px 0;">
            With tropical vibes and endless excitement,<br>
            <strong style="color: #2c3e50;">🌺 The UntungJawa Homestay Family 🌺</strong>
          </p>
          <p style="color: #95a5a6; font-size: 14px; margin-top: 15px;">
            Questions? We're here to help! Contact us anytime 💬
          </p>
        </div>
      </div>
    </div>
  `;
    return (0, exports.sendEmail)(customerEmail, subject, html);
};
exports.sendBookingConfirmation = sendBookingConfirmation;
/**
 * Send booking notification to homestay owner or admin
 */
const sendBookingNotificationToAdmin = async (adminEmail, bookingData) => {
    const isGuestBooking = 'guestEmail' in bookingData;
    const subject = `🔔 New Island Adventure Booked! - ${bookingData.bookingNumber}`;
    const guestInfoHtml = isGuestBooking
        ? `
      <p style="margin: 8px 0; font-size: 16px;"><strong>📧 Guest Email:</strong> ${bookingData.guestEmail}</p>
      <p style="margin: 8px 0; font-size: 16px;"><strong>📱 Guest Phone:</strong> ${bookingData.guestPhone}</p>
    `
        : '';
    const html = `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%); padding: 20px; border-radius: 15px;">
      
      <!-- Header -->
      <div style="background: white; border-radius: 15px; padding: 25px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <h1 style="color: #e74c3c; margin: 0; font-size: 26px;">🎉 Fantastic News! 🎉</h1>
        <h2 style="color: #2c3e50; margin: 10px 0; font-size: 20px;">New Booking Alert</h2>
        <div style="width: 60px; height: 3px; background: linear-gradient(to right, #e74c3c, #f39c12); margin: 15px auto;"></div>
      </div>
      
      <!-- Main Content -->
      <div style="background: white; border-radius: 15px; padding: 25px; margin-top: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <p style="font-size: 18px; color: #2c3e50; margin-bottom: 20px;">
          🌟 <strong>Hello Admin!</strong> 🌟
        </p>
        
        <p style="font-size: 16px; color: #34495e; line-height: 1.8; margin-bottom: 25px;">
          Exciting news! A new guest has chosen your beautiful homestay for their island adventure. 
          Here are the booking details to review and prepare for their arrival: 🏖️
        </p>
        
        <!-- Booking Details -->
        <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; border-radius: 12px; padding: 25px; margin: 20px 0;">
          <h3 style="margin: 0 0 20px 0; font-size: 20px; text-align: center;">📋 Booking Information</h3>
          
          <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 20px;">
            <p style="margin: 8px 0; font-size: 16px;"><strong>��️ Booking Number:</strong> ${bookingData.bookingNumber}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>👤 Guest Name:</strong> ${bookingData.customerName}</p>
            ${guestInfoHtml}
            <p style="margin: 8px 0; font-size: 16px;"><strong>🏡 Homestay:</strong> ${bookingData.homestayName}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>🛏️ Room:</strong> ${bookingData.roomName}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>📅 Check-in:</strong> ${bookingData.checkInDate}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>📅 Check-out:</strong> ${bookingData.checkOutDate}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>👥 Guests:</strong> ${bookingData.guestCount} ${bookingData.guestCount === 1 ? 'person' : 'people'}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>💰 Total:</strong> IDR ${bookingData.totalPrice.toLocaleString()}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>📊 Status:</strong> ${bookingData.bookingStatus}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>💳 Payment:</strong> ${bookingData.paymentStatus}</p>
            ${bookingData.specialRequests ? `<p style="margin: 8px 0; font-size: 16px;"><strong>🌟 Special Requests:</strong> ${bookingData.specialRequests}</p>` : ''}
          </div>
        </div>
        
        <!-- Action Required -->
        <div style="background: #74b9ff; color: white; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; font-size: 18px;">⚡ Action Required</h3>
          <p style="margin: 0; font-size: 16px;">Please review this booking and confirm the reservation to make your guest's stay perfect! 🌟</p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 2px solid #ecf0f1;">
          <p style="color: #7f8c8d; margin: 5px 0;">
            Happy hosting! 🏠<br>
            <strong style="color: #2c3e50;">UntungJawa Booking System</strong>
          </p>
        </div>
      </div>
    </div>
  `;
    return (0, exports.sendEmail)(adminEmail, subject, html);
};
exports.sendBookingNotificationToAdmin = sendBookingNotificationToAdmin;
/**
 * Send booking status update notification
 */
const sendBookingStatusUpdate = async (customerEmail, bookingData, newStatus) => {
    let statusText = '';
    let statusColor = '';
    let statusEmoji = '';
    let message = '';
    let excitement = '';
    switch (newStatus) {
        case 'confirmed':
            statusText = '🎉 Your Island Adventure is Confirmed!';
            statusColor = '#2ecc71';
            statusEmoji = '✅';
            message = `Pack your bags, ${bookingData.customerName}! Your tropical getaway to ${bookingData.homestayName} is now officially confirmed and we're counting down the days until your arrival! 🏝️`;
            excitement = `
        <div style="background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); color: white; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <h3 style="margin: 0 0 15px 0; font-size: 20px;">🌊 Get Ready for Paradise! 🌊</h3>
          <p style="margin: 0; font-size: 16px; line-height: 1.8;">
            The waves are calling, the sunset is waiting, and your perfect island escape is just around the corner! 
            We can't wait to share the magic of Untung Jawa with you. <strong>Enjoy your stay</strong> and create memories that will last a lifetime! ✨
          </p>
        </div>
      `;
            break;
        case 'cancelled':
            statusText = '😔 Booking Cancellation Notification';
            statusColor = '#e74c3c';
            statusEmoji = '❌';
            message = `We're sorry to inform you that your booking has been cancelled. While we're sad to see this adventure postponed, we hope to welcome you to our island paradise in the future! 🌴`;
            excitement = `
        <div style="background: #fab1a0; color: white; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px;">🤗 We Hope to See You Soon!</h3>
          <p style="margin: 0; font-size: 16px;">
            The island will always be here waiting for you. Come back anytime for your perfect tropical escape! 🏖️
          </p>
        </div>
      `;
            break;
        case 'completed':
            statusText = '🙏 Thank You for Staying With Us!';
            statusColor = '#3498db';
            statusEmoji = '🎊';
            message = `What an amazing journey it's been! We hope your stay at ${bookingData.homestayName} was everything you dreamed of and more. Thank you for choosing us for your island adventure! 🌺`;
            excitement = `
        <div style="background: linear-gradient(135deg, #a29bfe 0%, #fd79a8 100%); color: white; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <h3 style="margin: 0 0 15px 0; font-size: 20px;">🌟 Until We Meet Again! 🌟</h3>
          <p style="margin: 0; font-size: 16px; line-height: 1.8;">
            <strong>Thank you for staying at ${bookingData.homestayName}!</strong> We hope you've created beautiful memories and experienced the true spirit of island hospitality. 
            You'll always have a special place in our UntungJawa family! Come back soon! 🏝️💕
          </p>
        </div>
      `;
            break;
        default:
            statusText = `📢 Booking Update: ${newStatus}`;
            statusColor = '#f39c12';
            statusEmoji = '📋';
            message = `Your booking status has been updated. We wanted to keep you informed about any changes to your upcoming island adventure! 🌊`;
            excitement = '';
    }
    const subject = `${statusEmoji} ${statusText} - ${bookingData.bookingNumber}`;
    const html = `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 15px;">
      
      <!-- Header -->
      <div style="background: white; border-radius: 15px; padding: 25px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <h1 style="color: ${statusColor}; margin: 0; font-size: 26px;">${statusEmoji} ${statusText} ${statusEmoji}</h1>
        <div style="width: 80px; height: 3px; background: ${statusColor}; margin: 15px auto; border-radius: 2px;"></div>
      </div>
      
      <!-- Main Content -->
      <div style="background: white; border-radius: 15px; padding: 30px; margin-top: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <p style="font-size: 18px; color: #2c3e50; margin-bottom: 20px;">
          🌺 <strong>Hello ${bookingData.customerName}!</strong> 🌺
        </p>
        
        <p style="font-size: 16px; color: #34495e; line-height: 1.8; margin-bottom: 25px;">
          ${message}
        </p>
        
        <!-- Booking Details -->
        <div style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); color: white; border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="margin: 0 0 20px 0; font-size: 20px; text-align: center;">📋 Your Booking Details</h3>
          
          <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 20px;">
            <p style="margin: 8px 0; font-size: 16px;"><strong>🏷️ Booking Number:</strong> ${bookingData.bookingNumber}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>🏡 Homestay:</strong> ${bookingData.homestayName}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>🛏️ Room:</strong> ${bookingData.roomName}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>📅 Check-in:</strong> ${bookingData.checkInDate}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>📅 Check-out:</strong> ${bookingData.checkOutDate}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>📊 New Status:</strong> <span style="background: rgba(255,255,255,0.3); padding: 6px 15px; border-radius: 20px; font-weight: bold;">${newStatus.toUpperCase()}</span></p>
          </div>
        </div>
        
        ${excitement}
        
        ${newStatus === 'cancelled' ? `
        <div style="background: #fab1a0; color: white; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;">If you have any questions about this cancellation, please don't hesitate to contact us. We're here to help! 💬</p>
        </div>
        ` : ''}
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ecf0f1;">
          <p style="color: #7f8c8d; margin: 5px 0;">
            ${newStatus === 'completed' ? 'With heartfelt gratitude and warm island memories,' : 'With tropical excitement and warm regards,'}<br>
            <strong style="color: #2c3e50;">🌺 The UntungJawa Homestay Family 🌺</strong>
          </p>
          <p style="color: #95a5a6; font-size: 14px; margin-top: 15px;">
            ${newStatus === 'completed' ? 'Thank you for being part of our island story! 🏝️' : 'Your island adventure awaits! 🌊'}
          </p>
        </div>
      </div>
    </div>
  `;
    return (0, exports.sendEmail)(customerEmail, subject, html);
};
exports.sendBookingStatusUpdate = sendBookingStatusUpdate;
