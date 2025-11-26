/**
 * Local test script for Gemini API
 * Run with: npx ts-node functions/test-gemini-local.ts
 * 
 * Set your API key: export NANOBANANA_API_KEY=your_key_here
 * Or on Windows: $env:NANOBANANA_API_KEY="your_key_here"
 */

import fetch from "node-fetch";
import * as fs from "fs";
import * as path from "path";

// Allow API key to be passed as command line argument or env var
const API_KEY = process.argv[2] || process.env.NANOBANANA_API_KEY;

if (!API_KEY) {
  console.error("❌ NANOBANANA_API_KEY not set!");
  console.log("\nSet it with:");
  console.log("  PowerShell: $env:NANOBANANA_API_KEY=\"your_key\"; npm run test:gemini");
  console.log("  Or pass as argument: npm run test:gemini -- your_api_key_here");
  console.log("  Or: ts-node test-gemini-local.ts your_api_key_here");
  process.exit(1);
}

console.log(`✅ API Key found: ${API_KEY.substring(0, 8)}...`);
console.log(`   Key length: ${API_KEY.length} characters\n`);

// Test NanoBanana API
// Documentation: https://docs.nanobananaapi.ai/nanobanana-api/generate-or-edit-image

async function testNanoBananaImageEditing() {
  console.log(`\n🧪 Testing NanoBanana API: Image Editing`);
  
  const baseUrl = 'https://api.nanobananaapi.ai/api/v1/nanobanana/generate';
  console.log(`   URL: ${baseUrl}`);
  
  // Use a publicly accessible test image
  const testImageUrl = 'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=512';
  
  // Test image editing with prompt - using NanoBanana API format
  const requestBody: any = {
    prompt: "Make this room modern and minimalist with white walls",
    numImages: 1,
    imageUrls: [testImageUrl],
    type: "IMAGETOIAMGE",
    image_size: "16:9",
    callBackUrl: "https://example.com/callback" // Required field
  };
  
  try {
    console.log(`   Method: POST with Bearer token`);
    console.log(`   Request body:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const responseText = await response.text();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText}`);
    
    if (response.ok) {
      console.log(`   ✅ SUCCESS! Task submitted`);
      try {
        const data = JSON.parse(responseText);
        
        if (data.code === 200 && data.data?.taskId) {
          console.log(`   ✅ Task ID received: ${data.data.taskId}`);
          console.log(`   ⚠️  Note: Full image generation requires polling the task status endpoint`);
          console.log(`   This test confirms the API authentication and task submission works!`);
          return true;
        } else {
          console.log(`   ⚠️  Unexpected response structure`);
          console.log(`   Response:`, JSON.stringify(data, null, 2));
          return false;
        }
      } catch (e) {
        console.log(`   Response: ${responseText.substring(0, 500)}`);
        return false;
      }
    } else {
      console.log(`   ❌ FAILED`);
      try {
        const error = JSON.parse(responseText);
        console.log(`   Error code: ${error.code}`);
        console.log(`   Error message: ${error.msg || error.message || JSON.stringify(error)}`);
      } catch (e) {
        console.log(`   Error: ${responseText.substring(0, 500)}`);
      }
      return false;
    }
  } catch (error: any) {
    console.log(`   ❌ EXCEPTION: ${error.message}`);
    return false;
  }
}

async function testImageGeneration(modelName: string) {
  console.log(`\n🎨 Testing image generation with: ${modelName}`);
  
  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  
  // Try to generate an image
  const requestBody = {
    contents: [{
      parts: [{
        text: "Create a simple red circle"
      }]
    }]
  };
  
  const url = `${baseUrl}?key=${encodeURIComponent(API_KEY!)}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      // Check if response has image data
      const hasImage = data.candidates?.[0]?.content?.parts?.some((part: any) => part.inlineData);
      if (hasImage) {
        console.log(`   ✅ Image generation works!`);
        return true;
      } else {
        console.log(`   ⚠️  Model works but doesn't return images`);
        console.log(`   Response: ${JSON.stringify(data).substring(0, 200)}`);
        return false;
      }
    } else {
      const error = JSON.parse(responseText);
      console.log(`   ❌ ${error.error?.message || JSON.stringify(error)}`);
      return false;
    }
  } catch (error: any) {
    console.log(`   ❌ ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🚀 Testing NanoBanana API (Gemini-compatible)\n");
  console.log("=" .repeat(60));
  
  // Test NanoBanana image editing
  console.log("\n🎨 Test: NanoBanana Image Editing");
  console.log("-".repeat(60));
  
  const success = await testNanoBananaImageEditing();
  
  console.log("\n" + "=".repeat(60));
  if (success) {
    console.log("\n✅ TEST PASSED! NanoBanana API is working correctly.");
    console.log("   The function should work when deployed.");
  } else {
    console.log("\n❌ TEST FAILED! Check the error messages above.");
    console.log("   Do NOT deploy until this test passes.");
  }
}

main().catch(console.error);

