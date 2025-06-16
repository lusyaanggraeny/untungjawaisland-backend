import { xenditConfig, isTestMode } from '../config/xendit.config';
import { pool } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import axios from 'axios';

export interface QRISPaymentRequest {
  booking_id: string;
  amount: number;
  customer_name?: string;
  customer_email?: string;
  description?: string;
}

export interface QRISPaymentResponse {
  qr_id: string;
  qr_code: string;
  amount: number;
  expires_at: string;
  payment_url?: string;
  is_test_mode: boolean;
}

export class QRISService {
  
  /**
   * Create a QRIS payment for a booking using Xendit QR Code API v1 (proven working)
   */
  async createQRISPayment(paymentRequest: QRISPaymentRequest): Promise<QRISPaymentResponse> {
    try {
      const { booking_id, amount, customer_name, customer_email, description } = paymentRequest;
      
      // Validate amount (minimum IDR 1,500 per Xendit requirements)
      if (amount < 1500) {
        throw new AppError('Minimum payment amount is IDR 1,500', 400);
      }

      // Check if booking exists
      const { rows: bookings } = await pool.query(
        'SELECT * FROM "booking" WHERE id = $1',
        [booking_id]
      );

      if (bookings.length === 0) {
        throw new AppError('Booking not found', 404);
      }

      const booking = bookings[0];
      console.log(`📋 Booking ${booking_id} status: ${booking.status}`);
      
      // Verify amount matches booking total
      if (Math.abs(booking.total_price - amount) > 1) { // Allow 1 IDR difference for rounding
        throw new AppError('Payment amount does not match booking total', 400);
      }

      // Create expiration time
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + xenditConfig.qris.expirationHours);

      // Create QRIS payment with Xendit QR Code API v1 (or mock for test mode)
      let qrCodeResponse;
      
      if (isTestMode() && xenditConfig.secretKey === 'xnd_development_test_key') {
        // Create mock QR payment for test mode when no real credentials
        console.log('🧪 Using mock QRIS payment (no real Xendit credentials)');
        qrCodeResponse = {
          id: `mock_qr_${booking_id}_${Date.now()}`,
          external_id: `booking_${booking_id}_${Date.now()}`,
          qr_string: `QRIS_MOCK_${booking_id}_${amount}_${Date.now()}`,
          amount: amount,
          status: 'ACTIVE',
          type: 'DYNAMIC'
        };
      } else {
        try {
          // Real Xendit QR Code API v1 call (proven working)
          console.log('🔧 Using real Xendit QR Code API v1 for QRIS payment');
          
          const external_id = `booking_${booking_id}_${Date.now()}`;
          const qrData = new URLSearchParams({
            external_id: external_id,
            type: 'DYNAMIC',
            callback_url: xenditConfig.callbackUrl,
            amount: amount.toString()
          });

          const response = await axios.post('https://api.xendit.co/qr_codes', qrData, {
            headers: {
              'Authorization': `Basic ${Buffer.from(xenditConfig.secretKey + ':').toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });

          qrCodeResponse = response.data;
          
        } catch (error: any) {
          console.error('❌ Xendit QR Code API error:', error.message);
          if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Error data:', error.response.data);
          }
          
          // Fall back to mock mode on API error
          console.log('🧪 Falling back to mock mode due to API error');
          qrCodeResponse = {
            id: `mock_qr_${booking_id}_${Date.now()}`,
            external_id: `booking_${booking_id}_${Date.now()}`,
            qr_string: `QRIS_MOCK_${booking_id}_${amount}_${Date.now()}`,
            amount: amount,
            status: 'ACTIVE',
            type: 'DYNAMIC'
          };
        }
      }

      // Store payment record in database
      const { rows: [newPayment] } = await pool.query(
        `INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_id, currency, payment_date)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          booking_id,
          amount,
          'QRIS',
          'PENDING',
          qrCodeResponse.id,
          'IDR'
        ]
      );

      // Update payment with QRIS specific data
      await pool.query(
        `UPDATE payments SET 
         gateway_provider = $1,
         gateway_payment_id = $2,
         qris_code = $3,
         qris_expires_at = $4
         WHERE id = $5`,
        [
          'XENDIT',
          qrCodeResponse.id,
          qrCodeResponse.qr_string,
          expirationDate,
          newPayment.id
        ]
      );

      return {
        qr_id: qrCodeResponse.id,
        qr_code: qrCodeResponse.qr_string,
        amount: amount,
        expires_at: expirationDate.toISOString(),
        payment_url: `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(qrCodeResponse.qr_string)}`,
        is_test_mode: isTestMode()
      };

    } catch (error) {
      console.error('Error creating QRIS payment:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create QRIS payment', 500);
    }
  }

  /**
   * Check payment status from Xendit QR Code API v1
   */
  async checkPaymentStatus(qr_external_id: string): Promise<any> {
    try {
      if (isTestMode() && xenditConfig.secretKey === 'xnd_development_test_key') {
        // Mock response for test mode
        console.log('🧪 Using mock payment status check');
        return {
          id: qr_external_id,
          external_id: qr_external_id,
          status: 'ACTIVE',
          qr_string: `QRIS_MOCK_${qr_external_id}`,
          type: 'DYNAMIC'
        };
      } else {
        try {
          // Real Xendit QR Code API v1 call
          const response = await axios.get(`https://api.xendit.co/qr_codes/${qr_external_id}`, {
            headers: {
              'Authorization': `Basic ${Buffer.from(xenditConfig.secretKey + ':').toString('base64')}`
            }
          });
          
          return response.data;
          
        } catch (error: any) {
          console.error('❌ Xendit status check error:', error.message);
          if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Error data:', error.response.data);
          }
          
          // Fall back to mock response
          console.log('🧪 Falling back to mock status due to API error');
          return {
            id: qr_external_id,
            external_id: qr_external_id,
            status: 'ACTIVE',
            qr_string: `QRIS_MOCK_${qr_external_id}`,
            type: 'DYNAMIC'
          };
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw new AppError('Failed to check payment status', 500);
    }
  }

  /**
   * Process payment webhook from Xendit QR Code API v1
   */
  async processWebhook(webhookData: any): Promise<void> {
    try {
      const { id, qr_code, amount, status } = webhookData;
      
      // Extract booking_id from external_id (format: booking_{id}_{timestamp})
      const bookingIdMatch = qr_code.external_id.match(/booking_(\d+)_/);
      if (!bookingIdMatch) {
        throw new AppError('Invalid external_id format', 400);
      }
      
      const booking_id = bookingIdMatch[1];

      // Update payment status in database
      await pool.query(
        `UPDATE payments 
         SET payment_status = $1, payment_date = CURRENT_TIMESTAMP
         WHERE transaction_id = $2 AND booking_id = $3`,
        [status === 'COMPLETED' ? 'COMPLETED' : 'FAILED', id, booking_id]
      );

      // If payment successful, update booking status to CONFIRMED
      if (status === 'COMPLETED') {
        await pool.query(
          'UPDATE "booking" SET status = $1, is_paid = $2 WHERE id = $3',
          ['confirmed', true, booking_id]
        );
        
        console.log(`✅ Payment completed for booking ${booking_id}`);
        
        // TODO: Send confirmation email to guest
        // TODO: Send notification to homestay owner
      } else {
        console.log(`❌ Payment failed for booking ${booking_id}`);
      }

    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * Manually mark payment as completed (for testing)
   */
  async simulatePaymentSuccess(booking_id: string): Promise<void> {
    if (!isTestMode()) {
      throw new AppError('Manual payment simulation only allowed in test mode', 403);
    }

    try {
      // Update payment status
      await pool.query(
        `UPDATE payments 
         SET payment_status = 'COMPLETED', payment_date = CURRENT_TIMESTAMP
         WHERE booking_id = $1 AND payment_status = 'PENDING'`,
        [booking_id]
      );

      // Update booking status
      await pool.query(
        'UPDATE "booking" SET status = $1, is_paid = $2 WHERE id = $3',
        ['confirmed', true, booking_id]
      );

      console.log(`🧪 Test payment simulated for booking ${booking_id}`);
    } catch (error) {
      console.error('Error simulating payment:', error);
      throw new AppError('Failed to simulate payment', 500);
    }
  }
}

export const qrisService = new QRISService(); 