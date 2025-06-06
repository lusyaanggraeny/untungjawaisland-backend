// Debug script for booking creation
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function debugBooking() {
  try {
    console.log('🔍 Debug: Testing booking creation step by step');
    
    // Step 1: Test same-day availability 
    console.log('\n1️⃣ Testing same-day availability...');
    const availResponse = await axios.get(`${BASE_URL}/api/bookings/room/11/same-day-availability?date=2025-06-05`);
    console.log('✅ Availability:', availResponse.data);
    
    // Step 2: Test simple guest booking
    console.log('\n2️⃣ Testing guest booking creation...');
    const bookingData = {
      start_date: '2025-06-05',
      end_date: '2025-06-05',
      room_id: 11,
      number_of_guests: 2,
      guest_name: 'Debug Test',
      guest_email: 'debug@test.com',
      guest_phone: '+1234567890'
    };
    
    console.log('Booking data:', bookingData);
    
    const bookingResponse = await axios.post(`${BASE_URL}/api/bookings/guest`, bookingData);
    console.log('✅ Booking created:', bookingResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
  }
}

debugBooking(); 