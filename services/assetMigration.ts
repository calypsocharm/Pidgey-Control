
import { supabase } from './supabaseClient';
import { MOCK_STAMPS, MOCK_ASSETS, MOCK_DROPS } from '../constants';

// --- Types ---

export type MigrationItem = { 
    srcBucket?: string; 
    srcPath?: string; // If moving internal Supabase -> Supabase
    srcUrl?: string;  // If importing External -> Supabase
    dstBucket: string; 
    dstPath: string; 
    contentType?: string;
};

export type MigrationResult = { 
    path: string; 
    ok: boolean; 
    error?: string; 
};

// --- Helpers ---

/**
 * Exponential backoff retry wrapper
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, label = 'Operation'): Promise<T> {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (err: any) {
            lastErr = err;
            const waitTime = 500 * Math.pow(2, i);
            console.warn(`⚠️ [${label}] Attempt ${i + 1}/${attempts} failed. Retrying in ${waitTime}ms... Error: ${err.message}`);
            await new Promise(r => setTimeout(r, waitTime));
        }
    }
    throw lastErr;
}

/**
 * Smart Fetch: Handles both External URLs and Internal Supabase Paths
 */
async function fetchSourceBlob(item: MigrationItem): Promise<Blob> {
    // A. Internal Supabase Read (Bucket -> Bucket)
    if (item.srcBucket && item.srcPath) {
        // 1. Get Signed URL (Essential for private buckets, 10 min TTL)
        const { data: signed, error: signErr } = await supabase.storage
            .from(item.srcBucket)
            .createSignedUrl(item.srcPath, 600); 
        
        if (signErr) throw new Error(`Sign failed for ${item.srcBucket}/${item.srcPath}: ${signErr.message}`);
        if (!signed?.signedUrl) throw new Error(`No signed URL returned for ${item.srcPath}`);

        // 2. Fetch the content
        const res = await fetch(signed.signedUrl, { method: 'GET' });
        if (!res.ok) throw new Error(`Fetch signed URL failed: ${res.status} ${res.statusText}`);
        return await res.blob();
    } 
    
    // B. External Import (URL -> Bucket)
    else if (item.srcUrl) {
        const res = await fetch(item.srcUrl, { method: 'GET', mode: 'cors' });
        if (!res.ok) throw new Error(`Fetch external URL failed: ${res.status} ${res.statusText}`);
        return await res.blob();
    }
    
    throw new Error("Invalid migration item: missing source URL or Bucket/Path");
}

/**
 * Robust Upload with Upsert
 */
async function uploadBlob(blob: Blob, item: MigrationItem) {
    const { error: upErr } = await supabase.storage
        .from(item.dstBucket)
        .upload(item.dstPath, blob, {
            upsert: true, // Idempotent
            contentType: item.contentType || blob.type || 'application/octet-stream',
        });

    if (upErr) throw new Error(`Upload failed for ${item.dstPath}: ${upErr.message}`);
}

/**
 * Process Single Item
 */
async function processMigrationItem(item: MigrationItem): Promise<void> {
    const blob = await fetchSourceBlob(item);
    await uploadBlob(blob, item);
}

// --- Main Engine ---

/**
 * Batch Migration Processor
 */
export async function migrateObjects(items: MigrationItem[], onLog: (msg: string) => void): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    
    // Log CORS Checklist for debugging
    console.group('🔍 CORS & Configuration Checklist');
    console.log('1. Check Supabase Dashboard > Storage > Settings > CORS');
    console.log('2. Ensure your domain (e.g. localhost:5173 or https://myapp.com) is listed.');
    console.log('3. Allowed Methods: GET, POST, PUT, OPTIONS');
    console.log('4. Headers: Authorization, x-upsert, Content-Type');
    console.groupEnd();

    onLog(`🚀 Starting batch migration of ${items.length} assets...`);

    for (const item of items) {
        const label = item.srcUrl 
            ? `Ext -> ${item.dstBucket}/${item.dstPath}` 
            : `${item.srcBucket}/${item.srcPath} -> ${item.dstBucket}/${item.dstPath}`;
        
        try {
            await withRetry(() => processMigrationItem(item), 3, item.dstPath);
            onLog(`✅ OK: ${item.dstPath}`);
            results.push({ path: item.dstPath, ok: true });
        } catch (e: any) {
            const msg = `❌ FAIL: ${label} - ${e.message}`;
            console.error(msg);
            onLog(msg);
            results.push({ path: item.dstPath, ok: false, error: e.message });
        }
    }
    
    return results;
}

// --- Public Workflows ---

/**
 * Run a minimal test to verify Read/Write permissions and CORS
 */
export const runConnectionTest = async (onLog: (msg: string) => void) => {
    onLog("🧪 Starting Connectivity Test...");
    
    // 1. Create a dummy blob
    const dummyBlob = new Blob(["Pidgey Connectivity Test"], { type: 'text/plain' });
    const timestamp = Date.now();
    const testPath = `test_connectivity_${timestamp}.txt`;
    
    const testItems: MigrationItem[] = [
        // A. Test Internal Copy (if stamp exists) - requires valid existing file, skipping for generic test
        // B. Test External Fetch & Upload
        { 
            srcUrl: 'https://picsum.photos/200', // Reliable CORS-friendly source
            dstBucket: 'assets', 
            dstPath: `tests/picsum_${timestamp}.jpg`,
            contentType: 'image/jpeg'
        }
    ];

    onLog(`Attempting to download external image and upload to 'assets/tests/${testPath}'...`);
    
    const results = await migrateObjects(testItems, onLog);
    
    if (results.every(r => r.ok)) {
        onLog("✨ Test Passed! Storage read/write is operational.");
    } else {
        onLog("⚠️ Test Failed. Check console for CORS or Permission errors.");
    }
};

/**
 * Main Migration: Mock Data -> Real Supabase Storage
 */
export const migrateAssets = async (onLog: (msg: string) => void) => {
    onLog("📦 Preparing Asset Manifest...");
    
    // 1. Ensure Buckets Exist (Blind Create)
    const buckets = ['stamps', 'templates', 'assets', 'public_stamps'];
    for (const b of buckets) {
        // We attempt to create; if it fails (already exists), we ignore.
        // Note: Client-side creation often fails due to permissions. 
        // We assume buckets exist or user uses SQL schema to create them.
        onLog(`🔹 Checking bucket: ${b}`);
    }

    // 2. Build Migration List
    const items: MigrationItem[] = [];

    // Migrate MOCK_STAMPS
    MOCK_STAMPS.forEach(s => {
        if (s.art_path && s.art_path.startsWith('http')) {
            items.push({
                srcUrl: s.art_path,
                dstBucket: 'stamps',
                dstPath: `stamp_${s.slug || s.id}.png`,
                contentType: 'image/png'
            });
        }
    });

    // Migrate MOCK_ASSETS
    MOCK_ASSETS.forEach(a => {
        let bucket = 'assets';
        if (a.type === 'card_template') bucket = 'templates';
        if (a.type === 'stamp_art') bucket = 'stamps';
        
        if (a.url && a.url.startsWith('http')) {
            items.push({
                srcUrl: a.url,
                dstBucket: bucket,
                dstPath: a.name
            });
        }
    });

    // Migrate Drop Banners
    MOCK_DROPS.forEach(d => {
        if (d.banner_path && d.banner_path.startsWith('http')) {
            items.push({
                srcUrl: d.banner_path,
                dstBucket: 'assets',
                dstPath: `banners/${d.id}_banner.jpg`,
                contentType: 'image/jpeg'
            });
        }
    });

    // 3. Execute
    const results = await migrateObjects(items, onLog);
    
    const success = results.filter(r => r.ok).length;
    const fail = results.length - success;
    
    onLog("------------------------------------------------");
    onLog(`🏁 Migration Complete. OK: ${success}, Failed: ${fail}`);
    onLog("------------------------------------------------");
};
