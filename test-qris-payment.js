// Simple test script for QRIS payment system
// Run with: node test-qris-payment.js

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testQRISPayment() {
  console.log('🧪 Testing QRIS Payment System...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Checking server health...');
    const healthResponse = await axios.get(`${API_BASE.replace('/api', '')}/health`);
    console.log('✅ Server is running:', healthResponse.data.message);

    // Test 2: Simulate payment for an existing booking
    const testBookingId = '30'; // Change this to an existing booking ID
    
    console.log('\n2. Simulating QRIS payment...');
    const simulateResponse = await axios.post(`${API_BASE}/qris/qris/simulate/${testBookingId}`);
    console.log('✅ Payment simulation:', simulateResponse.data.message);

    // Test 3: Check payment status
    console.log('\n3. Checking payment status...');
    // Note: This requires authentication, so it might fail without a valid token
    try {
      const statusResponse = await axios.get(`${API_BASE}/qris/qris/status/${testBookingId}`);
      console.log('✅ Payment status:', statusResponse.data.data.payment_status);
    } catch (authError) {
      console.log('⚠️  Payment status check requires authentication (expected)');
    }

    console.log('\n🎉 QRIS Payment System Test Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Get Xendit test credentials from https://dashboard.xendit.co');
    console.log('2. Add XENDIT_SECRET_KEY to your .env file');
    console.log('3. Create a booking and test real QRIS payment creation');
    console.log('4. Test with Lusya using Indonesian banking apps');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your server is running: npm start');
    console.log('2. Check if you have existing bookings in your database');
    console.log('3. Verify your database connection is working');
  }
}

// Run the test
testQRISPayment(); 