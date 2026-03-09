"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTransporter = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const nodemailer_1 = __importDefault(require("nodemailer"));
dotenv_1.default.config();
const transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password',
    },
});
const isDevelopment = process.env.NODE_ENV === 'development';
exports.emailTransporter = transporter;
if (isDevelopment && !process.env.EMAIL_USER) {
    console.log('Using test email account for development');
    nodemailer_1.default.createTestAccount().then(testAccount => {
        exports.emailTransporter = nodemailer_1.default.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    });
}
exports.emailTransporter.verify((error) => {
    if (error) {
        console.error('Email configuration error:', error);
    }
    else {
        console.log('Email server ready');
    }
});
