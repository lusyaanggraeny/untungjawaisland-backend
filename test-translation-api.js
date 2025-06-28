// Test script for Multilingual API endpoints
// Run with: node test-translation-api.js

const BASE_URL = 'http://localhost:5000'; // Adjust port if needed

async function testAPI(endpoint, description) {
  try {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`📡 GET ${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Status: ${response.status}`);
      console.log(`📄 Response sample:`, JSON.stringify(data, null, 2).substring(0, 300) + '...');
      return data;
    } else {
      console.log(`❌ Error: ${response.status} - ${data.message || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Request failed:`, error.message);
    return null;
  }
}

async function runTranslationTests() {
  console.log('🚀 Starting Multilingual API Tests...\n');
  console.log('=' .repeat(50));
  
  // Test 1: Get all homestays in English (default)
  await testAPI('/api/homestays', 'All homestays (default English)');
  
  // Test 2: Get all homestays in Indonesian
  await testAPI('/api/homestays?lang=id', 'All homestays in Indonesian');
  
  // Test 3: Get all homestays with invalid language (should fallback to English)
  await testAPI('/api/homestays?lang=es', 'All homestays with invalid language (fallback to English)');
  
  // Test 4: Get specific homestay in English
  await testAPI('/api/homestays/1', 'Specific homestay in English');
  
  // Test 5: Get specific homestay in Indonesian
  await testAPI('/api/homestays/1?lang=id', 'Specific homestay in Indonesian');
  
  // Test 6: Get all rooms in English
  await testAPI('/api/rooms', 'All rooms in English');
  
  // Test 7: Get all rooms in Indonesian
  await testAPI('/api/rooms?lang=id', 'All rooms in Indonesian');
  
  // Test 8: Get specific room in English
  await testAPI('/api/rooms/49', 'Specific room in English');
  
  // Test 9: Get specific room in Indonesian
  await testAPI('/api/rooms/49?lang=id', 'Specific room in Indonesian');
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 Translation API tests completed!');
  console.log('\n📝 Expected Results:');
  console.log('- English requests should return English content');
  console.log('- Indonesian (?lang=id) requests should return Indonesian content');
  console.log('- Invalid language codes should fallback to English');
  console.log('- All endpoints should work with and without lang parameter');
}

// Check if fetch is available (Node.js 18+) or provide polyfill
if (typeof fetch === 'undefined') {
  console.log('⚠️  fetch() not available. Please use Node.js 18+ or install node-fetch');
  console.log('To install node-fetch: npm install node-fetch');
  console.log('Then add this to the top: const fetch = require("node-fetch");');
  process.exit(1);
}

runTranslationTests(); 