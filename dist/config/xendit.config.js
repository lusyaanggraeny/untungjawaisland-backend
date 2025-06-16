"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTestMode = exports.xenditConfig = exports.xenditClient = void 0;
const xendit_node_1 = require("xendit-node");
// Environment variables
const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY || 'xnd_development_test_key';
const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN || 'your_webhook_verification_token';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';
// Initialize Xendit client with v7 API
let xenditClient;
try {
    console.log('🔧 Initializing Xendit v7 client with key:', XENDIT_SECRET_KEY.substring(0, 20) + '...');
    exports.xenditClient = xenditClient = new xendit_node_1.Xendit({
        secretKey: XENDIT_SECRET_KEY,
    });
    console.log('✅ Xendit v7 client initialized successfully');
    console.log('🔧 Available services:', Object.keys(xenditClient));
}
catch (error) {
    console.error('❌ Failed to initialize Xendit client:', error);
    exports.xenditClient = xenditClient = null;
}
// Configuration object
exports.xenditConfig = {
    isProduction: NODE_ENV === 'production',
    secretKey: XENDIT_SECRET_KEY,
    webhookToken: XENDIT_WEBHOOK_TOKEN,
    baseUrl: BASE_URL,
    callbackUrl: `${BASE_URL}/api/qris/webhook`,
    // QRIS specific settings
    qris: {
        currency: 'IDR',
        // Test mode: QR expires in 1 hour, Production: 24 hours
        expirationHours: NODE_ENV === 'production' ? 24 : 1,
    }
};
// Helper function to check if we're in test mode
const isTestMode = () => {
    return !exports.xenditConfig.isProduction || XENDIT_SECRET_KEY.includes('development');
};
exports.isTestMode = isTestMode;
exports.default = xenditClient;
