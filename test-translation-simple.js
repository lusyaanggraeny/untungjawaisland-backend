// Simple test to verify translations
const BASE_URL = 'http://localhost:5000';

async function testTranslation() {
  console.log('🧪 Testing Translation Functionality\n');
  
  try {
    // Test 1: English version
    console.log('1️⃣ Testing English (default):');
    const englishResponse = await fetch(`${BASE_URL}/api/homestays/50`);
    const englishData = await englishResponse.json();
    console.log(`   Title: "${englishData.data.title}"`);
    console.log(`   Description: "${englishData.data.description}"`);
    
    // Test 2: Indonesian version
    console.log('\n2️⃣ Testing Indonesian (?lang=id):');
    const indonesianResponse = await fetch(`${BASE_URL}/api/homestays/50?lang=id`);
    const indonesianData = await indonesianResponse.json();
    console.log(`   Title: "${indonesianData.data.title}"`);
    console.log(`   Description: "${indonesianData.data.description}"`);
    
    // Test 3: Compare results
    console.log('\n🔍 Analysis:');
    if (englishData.data.title === indonesianData.data.title) {
      console.log('❌ Translations NOT working - same content returned');
      console.log('💡 Server might need restart or translation logic needs debugging');
    } else {
      console.log('✅ Translations working - different content returned');
    }
    
    // Test 4: Room translation
    console.log('\n3️⃣ Testing room translation:');
    const roomResponse = await fetch(`${BASE_URL}/api/rooms/10?lang=id`);
    const roomData = await roomResponse.json();
    console.log(`   Room Title: "${roomData.data.title}"`);
    console.log(`   Room Description: "${roomData.data.description}"`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.log('⚠️  This requires Node.js 18+ or you can install node-fetch');
  process.exit(1);
}

testTranslation(); 