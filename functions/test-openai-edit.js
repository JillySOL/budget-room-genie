const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const fetch = require('node-fetch'); // Use node-fetch v2 for CommonJS: npm install node-fetch@2
const FormData = require('form-data');

// --- Configuration ---
// WARNING: Hardcoding API keys is insecure. Use environment variables in real applications.
const OPENAI_API_KEY = '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';
const API_ENDPOINT = 'https://api.openai.com/v1/images/edits';
const OUTPUT_FILENAME = 'output.png';
// --- End Configuration ---

async function testOpenAIEdit() {
    // --- Argument Parsing ---
    const imagePathArg = process.argv[2];
    const promptArg = process.argv[3];

    if (!imagePathArg || !promptArg) {
        console.error('Usage: node test-openai-edit.js <path_to_image> "<prompt>"');
        process.exit(1);
    }
    console.log(`Input Image Path: ${imagePathArg}`);
    console.log(`Input Prompt: "${promptArg}"`);
    // --- End Argument Parsing ---

    try {
        // --- Image Loading & Processing ---
        console.log(`Loading image from: ${imagePathArg}`);
        const originalImageBuffer = await fs.readFile(imagePathArg);
        const imageSharp = sharp(originalImageBuffer);
        const metadata = await imageSharp.metadata();
        console.log(`Original image info: ${metadata.width}x${metadata.height}, Format: ${metadata.format}, Size: ${metadata.size} bytes`);

        console.log('Ensuring alpha channel and converting to PNG buffer...');
        const pngImageBuffer = await imageSharp.ensureAlpha().png().toBuffer();
        const processedMetadata = await sharp(pngImageBuffer).metadata(); // Get metadata of final buffer
        console.log(`Processed PNG image info: ${processedMetadata.width}x${processedMetadata.height}, Size: ${pngImageBuffer.length} bytes`);
        // --- End Image Loading & Processing ---

        // --- Prepare FormData ---
        console.log('Preparing FormData for API request...');
        const formData = new FormData();
        formData.append('prompt', promptArg);
        console.log(`  > Appended field 'prompt': "${promptArg}"`);

        // Explicitly set the model to use
        formData.append('model', 'gpt-image-1');
        console.log(`  > Appended field 'model': "gpt-image-1"`);

        formData.append('image', pngImageBuffer, {
            filename: 'input.png', // OpenAI requires a filename, 'input.png' is generic
            contentType: 'image/png',
        });
        console.log(`  > Appended field 'image': input.png (type: image/png, size: ${pngImageBuffer.length} bytes)`);

        // Optional parameters (uncomment to add)
        // formData.append('n', '1');
        // formData.append('size', '1024x1024'); // For DALL-E 2 compatibility if needed, otherwise API uses original size
        // --- End Prepare FormData ---


        // --- API Call ---
        console.log(`Sending request to: ${API_ENDPOINT}`);
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                // Content-Type is set automatically by node-fetch for FormData
                // We can explicitly get FormData headers if needed for debugging:
                // ...formData.getHeaders() 
            },
            body: formData,
        };

        const response = await fetch(API_ENDPOINT, fetchOptions);
        console.log(`Response Status Code: ${response.status}`);
        // console.log('Response Headers:', response.headers.raw()); // Uncomment for detailed headers

        const responseBody = await response.json(); // Attempt to parse JSON regardless of status

        if (!response.ok) {
            console.error('API request failed!');
            console.error('Response Body:', JSON.stringify(responseBody, null, 2));
            throw new Error(`OpenAI API Error (${response.status}): ${response.statusText}`);
        }

        console.log('API request successful!');
        console.log('Response Body:', JSON.stringify(responseBody, null, 2));
        // --- End API Call ---

        // --- Process Response & Save Output ---
        if (responseBody && responseBody.data && responseBody.data.length > 0) {
            let imageDataB64 = null;
            let imageUrl = null;

            if (responseBody.data[0].url) {
                imageUrl = responseBody.data[0].url;
                console.log(`Image generated (URL): ${imageUrl}`);
                console.log('Downloading image from URL...');
                const imageResponse = await fetch(imageUrl);
                if (!imageResponse.ok) throw new Error(`Failed to download generated image: ${imageResponse.statusText}`);
                const imageBuffer = await imageResponse.buffer(); // node-fetch@2 uses .buffer()
                await fs.writeFile(OUTPUT_FILENAME, imageBuffer);
                console.log(`Successfully downloaded and saved output image to: ${OUTPUT_FILENAME}`);

            } else if (responseBody.data[0].b64_json) {
                imageDataB64 = responseBody.data[0].b64_json;
                console.log('Image generated (Base64 received)');
                const imageBuffer = Buffer.from(imageDataB64, 'base64');
                await fs.writeFile(OUTPUT_FILENAME, imageBuffer);
                console.log(`Successfully decoded and saved output image to: ${OUTPUT_FILENAME}`);
            } else {
                console.error('Response did not contain expected image URL or Base64 data.');
            }
        } else {
            console.error('Response data array is missing or empty.');
        }
        // --- End Process Response & Save Output ---

    } catch (error) {
        console.error('\n--- SCRIPT ERROR ---');
        console.error(error);
        process.exit(1);
    }
}

testOpenAIEdit(); 