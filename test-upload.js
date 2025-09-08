import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Create a minimal valid MapLibre style
const testStyle = {
  version: 8,
  name: "Test Upload Style",
  sources: {
    "test-source": {
      type: "vector",
      url: "https://example.com/tiles.json"
    }
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#f0f0f0"
      }
    }
  ]
};

async function testUpload() {
  console.log('Testing style upload to production...');
  
  // Write test style to temporary file
  const tempFile = '/tmp/test-style.json';
  fs.writeFileSync(tempFile, JSON.stringify(testStyle, null, 2));
  
  // Create form data
  const form = new FormData();
  form.append('styleFile', fs.createReadStream(tempFile));
  form.append('name', 'test-upload');
  form.append('label', 'Test Upload Style');
  form.append('country', 'Austria'); // Testing country conversion
  form.append('type', 'vtc');
  form.append('map_category', 'background');
  form.append('description', 'Testing upload functionality');
  
  try {
    // Upload to production
    const response = await fetch('https://mapconfig.geolantis.com/api/styles/upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Upload successful!');
      console.log('Config saved:', result.config);
      console.log('Style URL:', result.url);
      console.log('Database saved:', result.databaseSaved);
      if (result.recordId) {
        console.log('Record ID:', result.recordId);
      }
      
      // Verify the uploaded data
      if (result.config.country === 'Austria') {
        console.log('✅ Country conversion working (Austria not "at")');
      } else {
        console.log('❌ Country not converted:', result.config.country);
      }
      
      if (result.config.style && result.config.style.startsWith('/styles/')) {
        console.log('✅ Style path correct (/styles/ not /api/styles/temp/)');
      } else {
        console.log('❌ Style path incorrect:', result.config.style);
      }
      
    } else {
      console.log('❌ Upload failed:', result.error);
      if (result.details) {
        console.log('Details:', result.details);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during upload:', error.message);
  } finally {
    // Clean up temp file
    fs.unlinkSync(tempFile);
  }
}

// Check if node-fetch is installed
try {
  await import('node-fetch');
  await import('form-data');
  testUpload();
} catch (e) {
  console.log('Installing required packages...');
  console.log('Run: npm install node-fetch form-data');
  console.log('Then run: node test-upload.js');
}