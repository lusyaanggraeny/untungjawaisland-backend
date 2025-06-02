const fetch = require('node-fetch');

async function testBookingAPI() {
  try {
    // Test token - you may need to update this with a valid token
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMywidXNlcm5hbWUiOiJ0YXNoaW5nYSIsInJvbGUiOiJob21lc3RheV9vd25lciIsInVzZXJfdHlwZSI6ImFkbWluIiwiaWF0IjoxNzM3NzEyMzM4LCJleHAiOjE3Mzc3OTg3Mzh9.VS0jjbg18pLBTMNP_rr0vQSAoWJpZhPi9gJGMB2tLQA";
    
    console.log('Testing /api/bookings/owner/13...');
    
    const response = await fetch('http://localhost:5000/api/bookings/owner/13', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n=== API Response ===');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.data && Array.isArray(data.data)) {
        console.log(`\n=== Found ${data.data.length} bookings ===`);
        
        // Check first booking structure
        if (data.data.length > 0) {
          console.log('\n=== First Booking Structure ===');
          const firstBooking = data.data[0];
          console.log('Fields present:', Object.keys(firstBooking));
          console.log('Sample booking:', JSON.stringify(firstBooking, null, 2));
        }
      }
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testBookingAPI(); 