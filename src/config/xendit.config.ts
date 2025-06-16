import { Xendit } from 'xendit-node';

// Environment variables
const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY || 'xnd_development_test_key';
const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN || 'your_webhook_verification_token';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Xendit client with v7 API
let xenditClient: any;
try {
  console.log('🔧 Initializing Xendit v7 client with key:', XENDIT_SECRET_KEY.substring(0, 20) + '...');
  xenditClient = new Xendit({
    secretKey: XENDIT_SECRET_KEY,
  });
  console.log('✅ Xendit v7 client initialized successfully');
  console.log('🔧 Available services:', Object.keys(xenditClient));
} catch (error) {
  console.error('❌ Failed to initialize Xendit client:', error);
  xenditClient = null;
}

export { xenditClient };

// Configuration object
export const xenditConfig = {
  isProduction: NODE_ENV === 'production',
  secretKey: XENDIT_SECRET_KEY,
  webhookToken: XENDIT_WEBHOOK_TOKEN,
  baseUrl: BASE_URL,
  callbackUrl: `${BASE_URL}/api/qris/webhook`,
  
  // QRIS specific settings
  qris: {
    currency: 'IDR' as const,
    // Test mode: QR expires in 1 hour, Production: 24 hours
    expirationHours: NODE_ENV === 'production' ? 24 : 1,
  }
};

// Helper function to check if we're in test mode
export const isTestMode = (): boolean => {
  return !xenditConfig.isProduction || XENDIT_SECRET_KEY.includes('development');
};

export default xenditClient; 