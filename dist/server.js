"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const error_middleware_1 = require("./middleware/error.middleware");
const auth_routes_1 = require("./routes/auth.routes");
const user_routes_1 = require("./routes/user.routes");
const booking_routes_1 = require("./routes/booking.routes");
const landing_user_routes_1 = require("./routes/landing_user.routes");
const homestay_routes_1 = __importDefault(require("./routes/homestay.routes"));
const room_routes_1 = __importDefault(require("./routes/room.routes"));
const review_routes_1 = require("./routes/review.routes");
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const qris_payment_routes_1 = __importDefault(require("./routes/qris-payment.routes"));
const oauth_routes_1 = require("./routes/oauth.routes");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Test database connection
database_1.pool.connect((err, client, release) => {
    if (err) {
        console.error('Database connection error:', err);
    }
    else {
        console.log('Database connection successful!');
        release();
    }
});
// Routes
app.use('/api/auth', auth_routes_1.authRoutes);
app.use('/api/oauth', oauth_routes_1.oauthRoutes);
app.use('/api/users', user_routes_1.userRoutes);
app.use('/api/profile', landing_user_routes_1.landingUserRoutes);
app.use('/api/homestays', homestay_routes_1.default);
app.use('/api/rooms', room_routes_1.default);
app.use('/api/bookings', booking_routes_1.bookingRoutes);
app.use('/api/reviews', review_routes_1.reviewRoutes);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/qris', qris_payment_routes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});
// Error handling middleware (should be last)
app.use(error_middleware_1.errorHandler);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
