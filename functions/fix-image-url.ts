/**
 * Script to fix the image URL for an existing project
 * Run with: npx ts-node functions/fix-image-url.ts <projectId>
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'renomate-1b214'
  });
}

const projectId = process.argv[2];

if (!projectId) {
  console.error('❌ Please provide a project ID');
  console.log('Usage: npx ts-node functions/fix-image-url.ts <projectId>');
  process.exit(1);
}

async function fixImageUrl() {
  try {
    console.log(`\n🔧 Fixing image URL for project: ${projectId}`);
    
    // Get the project document
    const projectRef = admin.firestore().collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();
    
    if (!projectDoc.exists) {
      console.error(`❌ Project ${projectId} not found`);
      process.exit(1);
    }
    
    const projectData = projectDoc.data();
    const currentUrl = projectData?.aiGeneratedImageURL;
    
    if (!currentUrl) {
      console.error(`❌ No aiGeneratedImageURL found for project ${projectId}`);
      process.exit(1);
    }
    
    console.log(`Current URL: ${currentUrl}`);
    
    // Extract the file path from the URL
    // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
    const urlMatch = currentUrl.match(/\/o\/(.+?)\?alt=media/);
    if (!urlMatch) {
      console.error(`❌ Could not parse file path from URL`);
      process.exit(1);
    }
    
    const filePath = decodeURIComponent(urlMatch[1]);
    console.log(`File path: ${filePath}`);
    
    // Get the file reference
    const bucket = admin.storage().bucket();
    const fileRef = bucket.file(filePath);
    
    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      console.error(`❌ File does not exist at path: ${filePath}`);
      process.exit(1);
    }
    
    console.log(`✅ File exists`);
    
    // Make sure it's public
    await fileRef.makePublic();
    console.log(`✅ File is now public`);
    
    // Get the signed URL
    const [signedUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-09-2491' // Far future date
    });
    
    console.log(`✅ Generated signed URL: ${signedUrl}`);
    
    // Update Firestore
    await projectRef.update({
      aiGeneratedImageURL: signedUrl
    });
    
    console.log(`✅ Updated Firestore with new URL`);
    console.log(`\n🎉 Success! The image URL has been fixed.`);
    
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

fixImageUrl();

