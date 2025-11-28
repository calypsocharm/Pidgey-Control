import { supabase } from './supabaseClient';
import { MOCK_STAMPS, MOCK_ASSETS, MOCK_DROPS } from '../constants';
import { AssetType } from '../types';

export const migrateAssets = async (onLog: (msg: string) => void) => {
  onLog("🚀 Starting Asset Migration Sequence...");
  onLog("Scanning mock data registries...");

  let successCount = 0;
  let failCount = 0;

  // 1. Prepare Migration Tasks
  const tasks: { name: string; url: string; bucket: string; fileName: string }[] = [];

  // Stamps -> 'stamps' bucket
  MOCK_STAMPS.forEach(stamp => {
    if (stamp.art_path) {
        tasks.push({
            name: `Stamp: ${stamp.name}`,
            url: stamp.art_path,
            bucket: 'stamps',
            fileName: `stamp_${stamp.slug || stamp.id}.png`
        });
    }
  });

  // Assets -> Mixed buckets
  MOCK_ASSETS.forEach(asset => {
    const bucket = asset.bucket || (asset.type === AssetType.STAMP_ART ? 'stamps' : 'templates');
    tasks.push({
        name: `Asset: ${asset.name}`,
        url: asset.url,
        bucket: bucket,
        fileName: asset.name
    });
  });

  // Drop Banners -> 'admin_files' bucket
  MOCK_DROPS.forEach(drop => {
      if (drop.banner_path) {
        tasks.push({
            name: `Banner: ${drop.title}`,
            url: drop.banner_path,
            bucket: 'admin_files',
            fileName: `banner_${drop.id}.jpg`
        });
      }
  });

  onLog(`📋 Found ${tasks.length} assets queued for migration.`);

  // 2. Execute Migration
  for (const task of tasks) {
    try {
      if (!task.url || !task.url.startsWith('http')) {
        onLog(`⚠️  Skipping ${task.name}: Invalid URL`);
        continue;
      }

      onLog(`⬇️  Fetching ${task.name}...`);
      
      // Fetch Blob
      const response = await fetch(task.url);
      if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
      const blob = await response.blob();
      
      onLog(`⬆️  Uploading to [${task.bucket}] as ${task.fileName}...`);
      
      // Upload to Supabase
      const { error } = await supabase.storage
        .from(task.bucket)
        .upload(task.fileName, blob, { upsert: true });

      if (error) throw error;

      onLog(`✅ Success: ${task.fileName}`);
      successCount++;
    } catch (e: any) {
      onLog(`❌ Error migrating ${task.name}: ${e.message}`);
      failCount++;
    }
    
    // Artificial delay for better UX visualization
    await new Promise(r => setTimeout(r, 200));
  }

  onLog("------------------------------------------------");
  onLog(`🏁 MIGRATION COMPLETE`);
  onLog(`Successful: ${successCount}`);
  onLog(`Failed: ${failCount}`);
  onLog("------------------------------------------------");
};