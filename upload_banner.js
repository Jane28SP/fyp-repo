// Script to upload fypBanner.png to Supabase Storage
// Run with: node upload_banner.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://sznagdhpnjexuuydnimh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bmFnZGhwbmpleHV1eWRuaW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Nzg4NjEsImV4cCI6MjA3MDE1NDg2MX0.TS8kgZjDjGhNSutksFEwJf7kslrqUddaChEbzdNqpl4';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadBanner() {
  try {
    // Path to the banner image
    const bannerPath = path.join(__dirname, 'apps', 'web', 'public', 'fypBanner.png');
    
    // Check if file exists
    if (!fs.existsSync(bannerPath)) {
      console.error('❌ Error: fypBanner.png not found at:', bannerPath);
      console.log('Please make sure the file exists at: apps/web/public/fypBanner.png');
      process.exit(1);
    }

    console.log('📤 Uploading fypBanner.png to Supabase Storage...');
    
    // Read the file
    const fileBuffer = fs.readFileSync(bannerPath);
    const fileName = 'fypBanner.png';
    const filePath = `images/${fileName}`;

    // Upload to Supabase Storage
    // First, try to create the bucket if it doesn't exist (this requires service role key)
    // For now, we'll assume the bucket exists or use 'images' bucket
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        upsert: true, // Overwrite if exists
        contentType: 'image/png'
      });

    if (error) {
      console.error('❌ Upload error:', error);
      
      // If bucket doesn't exist, provide instructions
      if (error.message?.includes('Bucket not found') || error.message?.includes('bucket')) {
        console.log('\n📝 Instructions:');
        console.log('1. Go to Supabase Dashboard → Storage → Buckets');
        console.log('2. Create a new bucket named "images"');
        console.log('3. Set it as PUBLIC (so images can be accessed without authentication)');
        console.log('4. Run this script again');
        process.exit(1);
      }
      
      throw error;
    }

    console.log('✅ Upload successful!');

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    console.log('\n🎉 Banner uploaded successfully!');
    console.log('📎 Public URL:', publicUrl);
    console.log('\n💡 You can now use this URL in your mobile app:');
    console.log(`   ${publicUrl}`);
    
  } catch (error) {
    console.error('❌ Failed to upload banner:', error.message);
    process.exit(1);
  }
}

// Run the upload
uploadBanner();

