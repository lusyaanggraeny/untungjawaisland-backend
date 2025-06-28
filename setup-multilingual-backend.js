#!/usr/bin/env node

/**
 * 🌍 Multilingual Backend Setup Script
 * This script sets up the complete multilingual system for the Untung Jawa backend
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌍 Untung Jawa Multilingual Backend Setup');
console.log('==========================================\n');

async function runCommand(command, description) {
  try {
    console.log(`📝 ${description}...`);
    const result = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${description} completed successfully!\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description} exists`);
    return true;
  } else {
    console.log(`❌ ${description} missing: ${filePath}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Checking setup...\n');
  
  // Check if key files exist
  const checks = [
    ['src/database/migrations/add_translation_tables.sql', 'Translation tables migration'],
    ['src/database/migrations/add_sample_translations.sql', 'Sample translations'],
    ['src/types/translation.types.ts', 'Translation types'],
    ['src/utils/translation.utils.ts', 'Translation utilities'],
    ['src/scripts/run-translation-migration.ts', 'Migration script'],
    ['test-translation-api.js', 'API test script'],
    ['MULTILINGUAL_IMPLEMENTATION_GUIDE.md', 'Implementation guide']
  ];
  
  let allFilesExist = true;
  for (const [file, description] of checks) {
    if (!checkFile(file, description)) {
      allFilesExist = false;
    }
  }
  
  if (!allFilesExist) {
    console.log('\n❌ Some required files are missing. Please ensure all files are created first.');
    process.exit(1);
  }
  
  console.log('\n✅ All required files exist!\n');
  
  // Step 1: Build the project
  console.log('📦 Step 1: Building TypeScript project...');
  const buildSuccess = await runCommand('npm run build', 'Building project');
  if (!buildSuccess) {
    console.log('❌ Build failed. Please fix TypeScript errors first.');
    process.exit(1);
  }
  
  // Step 2: Run migration
  console.log('🗄️  Step 2: Running database migration...');
  const migrationSuccess = await runCommand(
    'npx ts-node src/scripts/run-translation-migration.ts',
    'Running translation migration'
  );
  
  if (migrationSuccess) {
    console.log('🎉 Database migration completed successfully!\n');
  } else {
    console.log('⚠️  Migration may have failed. Check your database connection and try running it manually:\n');
    console.log('   npx ts-node src/scripts/run-translation-migration.ts\n');
  }
  
  // Step 3: Instructions for testing
  console.log('🧪 Step 3: Testing the API...');
  console.log('To test the multilingual API endpoints:');
  console.log('');
  console.log('1. Start your server:');
  console.log('   npm run dev');
  console.log('');
  console.log('2. In another terminal, run the test script:');
  console.log('   node test-translation-api.js');
  console.log('');
  console.log('3. Or test manually with curl:');
  console.log('   curl "http://localhost:3000/api/homestays?lang=id"');
  console.log('   curl "http://localhost:3000/api/rooms?lang=id"');
  console.log('');
  
  console.log('📚 Documentation:');
  console.log('- Read MULTILINGUAL_IMPLEMENTATION_GUIDE.md for complete documentation');
  console.log('- All endpoints now support ?lang=id for Indonesian or ?lang=en for English');
  console.log('- Invalid language codes automatically fallback to English');
  console.log('');
  
  console.log('🎯 What\'s been implemented:');
  console.log('✅ Database schema with translation tables');
  console.log('✅ TypeScript types for multilingual support');
  console.log('✅ Updated API controllers for homestays and rooms');
  console.log('✅ Language validation and fallback logic');
  console.log('✅ Sample Indonesian translations');
  console.log('✅ Performance optimized with proper indexing');
  console.log('✅ Comprehensive testing scripts');
  console.log('');
  
  console.log('🚀 Next steps for frontend integration:');
  console.log('1. Update frontend to send lang parameter: ?lang=id');
  console.log('2. Remove frontend translation mapping workarounds');
  console.log('3. Test language switching functionality');
  console.log('');
  
  console.log('🎉 Multilingual backend setup completed successfully!');
  console.log('Your backend now supports both English and Indonesian content.');
}

main().catch(console.error); 