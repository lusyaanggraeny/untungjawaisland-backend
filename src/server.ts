import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import homestayRoutes from './routes/homestay.routes';
import { authRoutes } from './routes/auth.routes';
import paymentRoutes from './routes/payment.routes';
import { landingUserRoutes } from './routes/landing_user.routes';
import { bookingRoutes } from './routes/booking.routes';
import { errorHandler } from './middleware/error.middleware';
import { testConnection } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/homestays', homestayRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', landingUserRoutes);
app.use('/api/bookings', bookingRoutes);

// Error handling
app.use(errorHandler);

// Test database connection and start server
const startServer = async () => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Failed to connect to database. Please check your MySQL connection.');
      process.exit(1);
    }
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 