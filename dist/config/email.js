"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTransporter = exports.createTestAccount = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Create reusable transporter
const transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password',
    },
});
// For testing purposes, we can use this method to create a test account
// Useful during development when you don't want to use real email credentials
const createTestAccount = async () => {
    const testAccount = await nodemailer_1.default.createTestAccount();
    console.log('Test email account created:');
    console.log('Email:', testAccount.user);
    console.log('Password:', testAccount.pass);
    return nodemailer_1.default.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
};
exports.createTestAccount = createTestAccount;
// Use test account in development if needed
const isDevelopment = process.env.NODE_ENV === 'development';
let emailTransporter = transporter;
exports.emailTransporter = emailTransporter;
if (isDevelopment && !process.env.EMAIL_USER) {
    console.log('Using test email account for development');
    (0, exports.createTestAccount)().then(testTransporter => {
        exports.emailTransporter = emailTransporter = testTransporter;
    });
}
// Verify connection configuration
emailTransporter.verify((error) => {
    if (error) {
        console.error('Email configuration error:', error);
    }
    else {
        console.log('Email server is ready to send messages');
    }
});
