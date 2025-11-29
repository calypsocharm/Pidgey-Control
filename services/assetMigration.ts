
import { supabase } from './supabaseClient';
import { MOCK_STAMPS, MOCK_ASSETS, MOCK_DROPS } from '../constants';

const BUCKETS = ['stamps', 'templates', 'assets'];

export const migrateAssets = async (onLog: (msg: string) => void) => {
  onLog("🚀 Initializing Client-Side Migration Protocol...");
  
  try {
    // 1. Ensure Buckets Exist
    onLog("📦 Verifying Storage Buckets...");
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
        onLog(`⚠️ Could not list buckets: ${bucketError.message}`);
        // Proceeding anyway, assuming buckets might exist but listing is restricted, 
        // or we will try to create them blindly.
    }

    const existingNames = buckets?.map(b => b.name) || [];

    for (const bucket of BUCKETS) {
        if (!existingNames.includes(bucket)) {
            onLog(`🛠 Creating bucket: '${bucket}'...`);
            const { error: createError } = await supabase.storage.createBucket(bucket, {
                public: true, // Important for public access
                fileSizeLimit: 5242880, // 5MB
            });
            if (createError) {
                onLog(`❌ Failed to create '${bucket}': ${createError.message}`);
            } else {
                onLog(`✅ Bucket '${bucket}' created.`);
            }
        } else {
            onLog(`🔹 Bucket '${bucket}' exists.`);
        }
    }

    // 2. Migrate Stamps
    onLog("🎨 Migrating Stamps...");
    for (const stamp of MOCK_STAMPS) {
        await processItem(
            stamp.name, 
            stamp.art_path, 
            'stamps', 
            `stamp_${stamp.slug || stamp.id}.png`, 
            onLog
        );
    }

    // 3. Migrate Generic Assets
    onLog("📂 Migrating General Assets...");
    for (const asset of MOCK_ASSETS) {
        let bucket = 'assets';
        if (asset.type === 'card_template') bucket = 'templates';
        if (asset.type === 'stamp_art') bucket = 'stamps';
        
        await processItem(
            asset.name,
            asset.url,
            bucket,
            asset.name, // Keep original name
            onLog
        );
    }

    // 4. Migrate Drop Banners
    onLog("🚩 Migrating Drop Banners...");
    for (const drop of MOCK_DROPS) {
        if (drop.banner_path) {
            await processItem(
                `Banner: ${drop.title}`,
                drop.banner_path,
                'assets',
                `banner_${drop.id}.jpg`,
                onLog
            );
        }
    }

    onLog("🏁 Migration Sequence Complete. Please click 'Sync' to refresh the view.");

  } catch (e: any) {
    console.error("Migration Fatal Error", e);
    onLog(`💀 Fatal Error: ${e.message}`);
  }
};

// Helper to fetch url blob and upload
async function processItem(label: string, url: string, bucket: string, fileName: string, onLog: (msg: string) => void) {
    try {
        // Skip if URL is already a supabase URL
        if (url.includes('supabase.co')) {
            onLog(`⏩ Skipping ${label} (Already hosted)`);
            return;
        }

        onLog(`⬇️ Fetching ${label}...`);
        
        // Fetch Blob
        // Note: picsum.photos supports CORS. If other URLs fail, we might need a proxy.
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
        
        const blob = await response.blob();
        
        // Upload
        onLog(`⬆️ Uploading to ${bucket}/${fileName}...`);
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, blob, {
                upsert: true,
                contentType: blob.type
            });

        if (uploadError) {
            throw new Error(uploadError.message);
        }

        onLog(`✅ Success: ${fileName}`);

    } catch (e: any) {
        onLog(`❌ Error processing ${label}: ${e.message}`);
    }
}
