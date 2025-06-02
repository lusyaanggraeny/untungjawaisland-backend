import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/database';
import { errorHandler } from './middleware/error.middleware';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { bookingRoutes } from './routes/booking.routes';
import { landingUserRoutes } from './routes/landing_user.routes';
import homestayRoutes from './routes/homestay.routes';
import roomRoutes from './routes/room.routes';
import { reviewRoutes } from './routes/review.routes';
import paymentRoutes from './routes/payment.routes';
import { oauthRoutes } from './routes/oauth.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connection successful!');
    release();
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/landing-users', landingUserRoutes);
app.use('/api/homestays', homestayRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString() 
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 