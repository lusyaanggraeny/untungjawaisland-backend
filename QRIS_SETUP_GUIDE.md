# QRIS Payment Setup Guide

## 🚀 Quick Setup for QRIS Payments

### 1. Add Environment Variables

Add these to your `.env` file:

```env
# Xendit Configuration (QRIS Payments)
XENDIT_SECRET_KEY=xnd_development_your_test_key_here
XENDIT_WEBHOOK_TOKEN=your_webhook_verification_token
BASE_URL=http://localhost:5000
NODE_ENV=development
```

### 2. Get Xendit Test Credentials

1. **Sign up for Xendit:** https://dashboard.xendit.co/register
2. **Go to Settings > Developers > API Keys**
3. **Copy your TEST Secret Key** (starts with `xnd_development_`)
4. **Set up webhook URL:** `http://your-domain.com/api/payments/webhook/qris`

### 3. Build and Start Server

```bash
npm run build
npm start
```

## 🧪 Testing QRIS Payments

### Test Flow:

1. **Create a booking** (existing endpoint)
2. **Create QRIS payment:**
   ```bash
   POST /api/payments/qris/create
   {
     "booking_id": "123",
     "customer_name": "John Doe",
     "customer_email": "john@example.com"
   }
   ```

3. **Simulate payment success:**
   ```bash
   POST /api/payments/qris/simulate/123
   ```

4. **Check payment status:**
   ```bash
   GET /api/payments/qris/status/123
   ```

## 📱 API Endpoints

### Create QRIS Payment
```
POST /api/qris/qris/create
Authorization: Bearer {token}

Body:
{
  "booking_id": "123",
  "customer_name": "John Doe",
  "customer_email": "john@example.com"
}

Response:
{
  "status": "success",
  "data": {
    "qr_code": "00020101021226...",
    "amount": 500000,
    "expires_at": "2024-06-15T10:00:00Z",
    "is_test_mode": true,
    "instructions": {
      "id": "Scan QR code dengan aplikasi mobile banking atau e-wallet Anda"
    }
  }
}
```

### Check Payment Status
```
GET /api/qris/qris/status/{booking_id}
Authorization: Bearer {token}

Response:
{
  "status": "success",
  "data": {
    "payment_status": "COMPLETED",
    "amount": 500000,
    "booking_confirmed": true
  }
}
```

### Simulate Payment (TEST MODE ONLY)
```
POST /api/qris/qris/simulate/{booking_id}

Response:
{
  "status": "success",
  "message": "🧪 Payment simulation completed successfully",
  "data": {
    "booking_id": "123",
    "payment_status": "COMPLETED",
    "booking_status": "CONFIRMED"
  }
}
```

### Webhook Handler
```
POST /api/qris/webhook/qris
(Called automatically by Xendit when payment status changes)
```

## 🇮🇩 Indonesian Integration Notes

- **QR Code Display:** Show QR code with Indonesian instructions
- **Payment Methods:** QRIS works with all Indonesian banks and e-wallets
- **Currency:** Always IDR (Indonesian Rupiah)
- **Timeout:** QR codes expire in 1 hour (test) / 24 hours (production)

## 🔄 Payment Flow

1. **Guest creates booking** → Status: PENDING
2. **Guest requests payment** → QRIS QR code generated
3. **Guest scans QR code** → Payment processed by bank/e-wallet
4. **Xendit sends webhook** → Payment confirmed automatically
5. **Booking status updated** → Status: CONFIRMED
6. **Owner gets notification** → Manual confirmation (optional)

## ⚠️ Important Notes

- **Test Mode:** Use sandbox credentials for development
- **Webhooks:** Set up ngrok or public URL for webhook testing
- **Security:** Verify webhook signatures in production
- **Manual Confirmation:** Homestay owners can still manually confirm bookings

## 🚀 Next Steps

1. **Week 1:** Test basic QRIS flow
2. **Week 2:** Add WhatsApp notifications for owners
3. **Week 3:** Bahasa Indonesia interface
4. **Week 4:** Production deployment
5. **Week 5:** Training materials and handover

Ready to test! Start with creating a booking and then generating a QRIS payment. 🎉 