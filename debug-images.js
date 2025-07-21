// Quick debug script to test Supabase image loading
// Run this in browser console or add to your app temporarily

const supabaseUrl = 'https://fodtwysfcqltykejkffn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZHR3eXNmY3FsdHlrZWprZmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyODcyNjgsImV4cCI6MjA1ODg2MzI2OH0.9qjI17DhndJ0tur8iI-eagkC9wjJWGWvM0tY4S2J5Os';

async function debugImages() {
  console.log('🔍 Starting image debug...');
  
  try {
    // Test 1: Check if we can connect to Supabase
    const supabase = window.supabase?.createClient ? 
      window.supabase.createClient(supabaseUrl, supabaseKey) : null;
    
    if (!supabase) {
      console.error('❌ Supabase client not available');
      return;
    }
    
    console.log('✅ Supabase client created');
    
    // Test 2: Try to fetch seeds data
    const { data: seeds, error: seedsError } = await supabase
      .from('seeds')
      .select('id, seed_name, seed_images')
      .limit(5);
    
    if (seedsError) {
      console.error('❌ Error fetching seeds:', seedsError);
      return;
    }
    
    console.log('✅ Seeds data:', seeds);
    
    // Test 3: Analyze image data structure
    if (seeds && seeds.length > 0) {
      seeds.forEach((seed, index) => {
        console.log(`\n--- Seed ${index + 1}: ${seed.seed_name} ---`);
        console.log('Raw seed_images:', seed.seed_images);
        console.log('Type:', typeof seed.seed_images);
        console.log('Is Array:', Array.isArray(seed.seed_images));
        
        if (Array.isArray(seed.seed_images) && seed.seed_images.length > 0) {
          console.log('First image object:', seed.seed_images[0]);
        }
      });
    }
    
    // Test 4: Try to list files in storage bucket
    console.log('\n🔍 Checking storage bucket...');
    const { data: files, error: storageError } = await supabase.storage
      .from('seed-images')
      .list('', { limit: 10 });
    
    if (storageError) {
      console.error('❌ Storage error:', storageError);
    } else {
      console.log('✅ Storage files:', files);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Auto-run if this is in browser console
if (typeof window !== 'undefined') {
  debugImages();
}
