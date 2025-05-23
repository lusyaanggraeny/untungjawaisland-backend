// DEBUG SCRIPT: Test what API actually returns
// Run with: node debug_api_response.js

const BASE_URL = 'http://localhost:5000';

async function debugAPIResponse() {
  console.log('🔍 DEBUGGING API RESPONSE FOR HOMESTAY IMAGES');
  console.log('===============================================\n');

  try {
    // Test API response
    console.log('📡 Fetching from: GET /api/homestays');
    const response = await fetch(`${BASE_URL}/api/homestays`);
    const data = await response.json();
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📊 Response Status Text: ${response.statusText}\n`);
    
    if (!data || data.status !== 'success') {
      console.log('❌ API Error or Invalid Response:');
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    const homestays = data.data || [];
    console.log(`✅ Found ${homestays.length} homestays\n`);

    // Analyze each homestay's image data
    homestays.forEach((homestay, index) => {
      console.log(`🏠 HOMESTAY ${homestay.id}: "${homestay.title}"`);
      console.log(`   Status: ${homestay.status}`);
      console.log(`   Has homestayImages field: ${homestay.homestayImages ? 'YES' : 'NO'}`);
      
      if (homestay.homestayImages) {
        if (Array.isArray(homestay.homestayImages) && homestay.homestayImages.length > 0) {
          console.log(`   📸 Images: ${homestay.homestayImages.length} found`);
          homestay.homestayImages.forEach((img, imgIndex) => {
            console.log(`      ${imgIndex + 1}. ${img.is_primary ? '⭐ PRIMARY' : '📷 SECONDARY'}: ${img.img_url}`);
            console.log(`         Order: ${img.order}, ID: ${img.id}`);
          });
        } else {
          console.log(`   📸 Images: Empty array`);
        }
      } else {
        console.log(`   📸 Images: NULL or missing homestayImages field`);
      }
      
      // Check if using fallback (Unsplash URLs)
      if (homestay.homestayImages && homestay.homestayImages.length > 0) {
        const isUsingFallback = homestay.homestayImages[0].img_url.includes('unsplash.com');
        console.log(`   🔄 Using fallback images: ${isUsingFallback ? 'YES (DB empty)' : 'NO (DB data)'}`);
      }
      
      console.log(''); // Empty line for spacing
    });

    // Show raw JSON structure for first homestay
    if (homestays.length > 0) {
      console.log('📋 RAW JSON STRUCTURE (First homestay):');
      console.log('=====================================');
      console.log(JSON.stringify(homestays[0], null, 2));
    }

    console.log('\n🎯 FRONTEND INTEGRATION GUIDE:');
    console.log('=============================');
    console.log('Your frontend should access images like this:');
    console.log('');
    console.log('// JavaScript/React example:');
    console.log('const homestays = apiResponse.data;');
    console.log('homestays.forEach(homestay => {');
    console.log('  const images = homestay.homestayImages || [];');
    console.log('  const primaryImage = images.find(img => img.is_primary);');
    console.log('  const imageUrl = primaryImage?.img_url || images[0]?.img_url;');
    console.log('  console.log(`Homestay: ${homestay.title}, Image: ${imageUrl}`);');
    console.log('});');
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure your server is running on', BASE_URL);
    console.log('2. Check if the /api/homestays endpoint exists');
    console.log('3. Verify your database connection');
  }
}

// Simple fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

debugAPIResponse(); 