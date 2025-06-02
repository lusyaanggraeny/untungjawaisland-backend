# Email Notification Setup for Untungjawa-backend

The booking system now includes an email notification feature that sends:
1. Booking confirmation emails to customers
2. Booking notifications to homestay owners/admins
3. Status update emails when a booking's status changes

## Configuration

Add the following environment variables to your `.env` file:

```
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=UntungJawa Homestay <noreply@untungjawa.com>
```

## Using Gmail

If you're using Gmail as your email provider:

1. Go to your Google Account > Security
2. Under "Signing in to Google," select 2-Step Verification (enable if not already)
3. At the bottom of the page, select App passwords
4. Select "Mail" and your device, then create
5. Use the generated password as your `EMAIL_PASSWORD`

## Testing Email Setup

For development purposes, you can use a test email account through Ethereal Email:

```typescript
// The system will automatically create a test account if:
// 1. NODE_ENV is 'development'
// 2. EMAIL_USER is not provided in .env

// When a test account is created, credentials will be printed to the console
// You can view sent emails at the preview URL also printed to console
```

## Email Notification Events

The system now sends emails for the following events:

1. **New Booking Creation**
   - Customer receives a booking confirmation email
   - Homestay admin receives a notification email

2. **Guest Booking Creation**
   - Guest receives a booking confirmation email
   - Homestay admin receives a notification with guest details

3. **Booking Status Updates**
   - Customer/guest receives an email when their booking status changes
   - Status updates include: confirmed, cancelled, completed

## Customizing Email Templates

All email templates are defined in `src/services/email.service.ts`. You can:

1. Modify the HTML structure
2. Change the content
3. Update styling
4. Add/remove information displayed

The email templates use simple HTML with inline styles for better compatibility across email clients. 