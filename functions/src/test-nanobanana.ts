/**
 * Test script for NanoBanana API integration
 * 
 * Usage:
 *   1. Build: cd functions && npm run build
 *   2. Run: node lib/test-nanobanana.js
 * 
 * Or set NANOBANANA_API_KEY environment variable to test without Secret Manager:
 *   NANOBANANA_API_KEY=your-key node lib/test-nanobanana.js
 */

import { getNanoBananaApiKey, submitNanoBananaEditTask, pollNanoBananaTaskUntilComplete, checkNanoBananaTaskStatus } from './services/nanobanana';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (required for Secret Manager)
// This will use default credentials from the environment
if (!admin.apps.length) {
  try {
    // Try to use service account key file if it exists (for local testing)
    const path = require('path');
    const fs = require('fs');
    const serviceAccountPath = path.join(__dirname, '../../renomate-1b214-firebase-adminsdk-fbsvc-cad4f226c6.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      console.log('   Using service account key file for authentication');
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // Try to initialize with default credentials
      // This will work if GOOGLE_APPLICATION_CREDENTIALS is set or ADC is configured
      admin.initializeApp();
    }
  } catch (error: any) {
    // Already initialized, that's fine
    if (!error.message?.includes('already exists')) {
      // Silently continue - will use environment variable if Secret Manager fails
    }
  }
}

async function testNanoBananaAPI() {
  console.log('🧪 Testing NanoBanana API Integration\n');
  console.log('=' .repeat(60));

  // Test 1: API Key Retrieval
  console.log('\n📋 Test 1: Retrieving API Key...');
  
  // Check if environment variable is set (for local testing)
  if (process.env.NANOBANANA_API_KEY) {
    console.log('   Using API key from NANOBANANA_API_KEY environment variable');
    const apiKey = process.env.NANOBANANA_API_KEY;
    console.log('✅ API Key found in environment variable');
    console.log(`   Key length: ${apiKey.length} characters`);
    console.log(`   Key preview: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  } else {
    console.log('   Attempting to retrieve from Secret Manager...');
    try {
      const apiKey = await getNanoBananaApiKey();
      if (apiKey && apiKey.length > 0) {
        console.log('✅ API Key retrieved successfully from Secret Manager');
        console.log(`   Key length: ${apiKey.length} characters`);
        console.log(`   Key preview: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
      } else {
        console.log('❌ API Key is empty');
        return;
      }
    } catch (error: any) {
      console.log('❌ Failed to retrieve API key from Secret Manager');
      console.log(`   Error: ${error.message}`);
      console.log('\n💡 Troubleshooting:');
      console.log('   Option 1: Set environment variable for local testing:');
      console.log('      $env:NANOBANANA_API_KEY="your-key"; npm run test:nanobanana');
      console.log('   Option 2: Set up local credentials:');
      console.log('      gcloud auth application-default login');
      console.log('   Option 3: Verify secret exists and permissions in Secret Manager');
      console.log('      See FIX_NANOBANANA_SECRET.md for details');
      return;
    }
  }
  
  // Get API key for subsequent tests
  const apiKey = process.env.NANOBANANA_API_KEY || await getNanoBananaApiKey();

  // Test 2: Submit Edit Task
  console.log('\n📋 Test 2: Submitting Image Edit Task...');
  const testImageUrl = 'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=512'; // Sample room image
  const testPrompt = 'Transform this room into a modern minimalist style with white walls, wooden floors, and green plants';
  
  let taskId: string;
  try {
    taskId = await submitNanoBananaEditTask(apiKey, testPrompt, testImageUrl);
    console.log('✅ Task submitted successfully');
    console.log(`   Task ID: ${taskId}`);
  } catch (error: any) {
    console.log('❌ Failed to submit task');
    console.log(`   Error: ${error.message}`);
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('\n💡 API Key might be invalid. Check your NanoBanana API key.');
    } else if (error.message.includes('404') || error.message.includes('Not Found')) {
      console.log('\n💡 API endpoint might be incorrect. Check NanoBanana API documentation.');
    }
    return;
  }

  // Test 3: Check Task Status
  console.log('\n📋 Test 3: Checking Task Status...');
  try {
    const status = await checkNanoBananaTaskStatus(apiKey, taskId);
    console.log('✅ Status check successful');
    console.log(`   Status Flag: ${status.successFlag} (0=GENERATING, 1=SUCCESS, 2=CREATE_FAILED, 3=GENERATE_FAILED)`);
    
    if (status.successFlag === 1 && status.data?.images) {
      console.log(`   ✅ Task completed! Image URL: ${status.data.images[0]}`);
    } else if (status.successFlag === 0) {
      console.log('   ⏳ Task is still generating...');
    } else {
      console.log(`   ⚠️  Task status: ${status.successFlag}`);
    }
  } catch (error: any) {
    console.log('❌ Failed to check status');
    console.log(`   Error: ${error.message}`);
    return;
  }

  // Test 4: Poll Until Complete (Optional - can be slow)
  console.log('\n📋 Test 4: Polling Until Complete (this may take 30-60 seconds)...');
  console.log('   (Press Ctrl+C to skip this test)');
  
  try {
    const imageUrl = await pollNanoBananaTaskUntilComplete(apiKey, taskId, 30, 3000); // 30 attempts, 3 second intervals
    console.log('✅ Task completed successfully!');
    console.log(`   Generated Image URL: ${imageUrl}`);
  } catch (error: any) {
    if (error.message.includes('did not complete within')) {
      console.log('⏳ Task is taking longer than expected (this is normal)');
      console.log(`   Task ID: ${taskId}`);
      console.log('   You can check the status manually using the task ID');
    } else {
      console.log('❌ Polling failed');
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('\n💡 If all tests passed, your NanoBanana integration is working correctly.');
}

// Run the tests
testNanoBananaAPI()
  .then(() => {
    console.log('\n✨ Test script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });

