// Test script for same-day booking functionality
// Run with: node test-same-day-booking.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const ROOM_ID = 11; // Use your actual room ID
const TODAY = new Date().toISOString().split('T')[0]; // Today's date

async function testSameDayBooking() {
  console.log('🧪 Testing Same-Day Booking Fix');
  console.log('=================================');
  
  try {
    // Step 1: Check same-day availability
    console.log(`\n1️⃣  Checking same-day availability for room ${ROOM_ID}...`);
    const availabilityResponse = await axios.get(`${BASE_URL}/api/bookings/room/${ROOM_ID}/same-day-availability`);
    
    console.log('✅ Same-day availability endpoint working!');
    console.log('Response:', JSON.stringify(availabilityResponse.data.data, null, 2));
    
    const availability = availabilityResponse.data.data;
    
    if (!availability.can_book_today) {
      console.log('❌ Room not available for same-day booking');
      console.log('Reason:', availability.message);
      return;
    }
    
    // Step 2: Try to create a booking
    console.log(`\n2️⃣  Attempting to create same-day booking...`);
    
    const bookingData = {
      start_date: TODAY,
      end_date: TODAY,
      room_id: ROOM_ID,
      number_of_guests: 2,
      guest_name: 'Test Guest',
      guest_email: 'test@example.com',
      guest_phone: '+1234567890',
      special_requests: 'Same-day booking test'
    };
    
    console.log('Booking data:', JSON.stringify(bookingData, null, 2));
    
    const bookingResponse = await axios.post(`${BASE_URL}/api/bookings/guest`, bookingData);
    
    console.log('✅ Same-day booking created successfully!');
    console.log('Booking details:', JSON.stringify(bookingResponse.data.data, null, 2));
    
    console.log('\n🎉 Test completed successfully!');
    console.log('The same-day booking fix is working correctly.');
    
  } catch (error) {
    console.log('\n❌ Test failed:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
    
    console.log('\n🔍 Debugging tips:');
    console.log('1. Make sure your server is running on port 5000');
    console.log('2. Check if room ID', ROOM_ID, 'exists');
    console.log('3. Make sure there\'s a completed booking for today on this room');
    console.log('4. Check server logs for detailed error information');
  }
}

// Run the test
testSameDayBooking(); 