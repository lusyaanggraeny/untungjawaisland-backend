// TEST SCRIPT: Verify Homestay API returns proper images
// Run with: node test_homestay_api.js

const BASE_URL = 'http://localhost:5000'; // Change to your server URL

async function testHomestayAPI() {
  console.log('🧪 TESTING HOMESTAY API FOR EXHIBITION');
  console.log('=====================================\n');

  try {
    // Test 1: Get All Homestays
    console.log('1️⃣ Testing GET /api/homestays');
    const response = await fetch(`${BASE_URL}/api/homestays`);
    const data = await response.json();
    
    if (data.status === 'success' && data.data) {
      console.log(`✅ Found ${data.data.length} homestays`);
      
      // Check each homestay has images
      let successCount = 0;
      let failCount = 0;
      
      data.data.forEach((homestay, index) => {
        console.log(`\n📍 Homestay ${homestay.id}: ${homestay.title}`);
        
        if (homestay.homestayImages && homestay.homestayImages.length > 0) {
          console.log(`  ✅ Has ${homestay.homestayImages.length} image(s)`);
          
          // Check for primary image
          const primaryImage = homestay.homestayImages.find(img => img.is_primary);
          if (primaryImage) {
            console.log(`  ✅ Primary image: ${primaryImage.img_url.substring(0, 50)}...`);
          } else {
            console.log(`  ⚠️  No primary image found`);
          }
          
          successCount++;
        } else {
          console.log(`  ❌ NO IMAGES FOUND!`);
          failCount++;
        }
      });
      
      console.log(`\n📊 SUMMARY:`);
      console.log(`  ✅ Homestays with images: ${successCount}`);
      console.log(`  ❌ Homestays without images: ${failCount}`);
      
      if (failCount === 0) {
        console.log(`\n🎉 ALL HOMESTAYS HAVE IMAGES! Exhibition ready! 🚀`);
      } else {
        console.log(`\n🚨 ${failCount} homestays still missing images!`);
      }
      
    } else {
      console.log('❌ API response invalid or no data');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
    // Test 2: Sample homestay detail
    if (data.data && data.data.length > 0) {
      const firstHomestayId = data.data[0].id;
      console.log(`\n2️⃣ Testing GET /api/homestays/${firstHomestayId}`);
      
      const detailResponse = await fetch(`${BASE_URL}/api/homestays/${firstHomestayId}`);
      const detailData = await detailResponse.json();
      
      if (detailData.status === 'success') {
        console.log(`✅ Individual homestay API working`);
        console.log(`  Images: ${detailData.data.homestayImages?.length || 0}`);
        console.log(`  Rooms: ${detailData.data.rooms?.length || 0}`);
      } else {
        console.log('❌ Individual homestay API failed');
      }
    }
    
  } catch (error) {
    console.log('❌ ERROR testing API:', error.message);
    console.log('Make sure your server is running on', BASE_URL);
  }
}

// Simple fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run the test
testHomestayAPI(); 