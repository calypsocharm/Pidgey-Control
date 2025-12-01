
import { supabase } from './supabaseClient';
import { Profile, Drop, Ticket, DropStatus, Broadcast, Promo, Asset, AssetType, DeliveryJourney, DeliveryStatus, BroadcastChannel, Transaction, Role, Tier, Stamp } from '../types';
import { MOCK_BROADCASTS, MOCK_PROMOS, MOCK_ASSETS, MOCK_DELIVERIES, MOCK_FLIGHT_PATHS, MOCK_PROFILES } from '../constants';

// Set to empty string to allow Vite proxy (setup in vite.config.js) to handle the routing
// and avoid CORS issues during development.
const BACKEND_API = '';

// Helper for ID generation that works in all contexts (including non-secure HTTP)
const safeUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if crypto.randomUUID fails (e.g. insecure context)
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Generic response type for list operations
 */
export interface ListResponse<T> {
  data: T[];
  count: number;
  error: any;
}

// Helper for recursive storage listing
const listAllFiles = async (bucket: string, path = ''): Promise<any[]> => {
  // console.log(`[Storage] Listing ${bucket} at path: "${path}"`);
  const { data, error } = await supabase.storage.from(bucket).list(path, {
      limit: 1000, // Increased limit to capture more files
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
  });
  
  if (error) {
      console.error(`[Storage] Error listing ${bucket}:`, error);
      return [];
  }
  
  let results: any[] = [];
  for (const item of data || []) {
    // Filter out system placeholders
    if (item.name === '.emptyFolderPlaceholder') continue;

    // Robust folder detection: id is null, OR metadata is missing
    const isFolder = item.id === null || !item.metadata;

    if (isFolder) {
       // Construct path carefully. If path is empty, don't add slash.
       const subPath = path ? `${path}/${item.name}` : item.name;
       const subFiles = await listAllFiles(bucket, subPath);
       results = [...results, ...subFiles];
    } else {
       // It's a file
       results.push({ 
           ...item, 
           // Store the full relative path. 
           // Important: We must preserve the structure exactly as Supabase sees it.
           fullPath: path ? `${path}/${item.name}` : item.name 
       });
    }
  }
  return results;
}

export const AdminService = {
  
  // --- Dashboard Stats (Realtime) ---
  dashboard: {
      getStats: async () => {
          try {
              // 1. Active Members
              const { count: memberCount } = await supabase
                  .from('profiles')
                  .select('*', { count: 'exact', head: true });

              // 2. Revenue (Sum of successful transactions)
              const { data: txs } = await supabase
                  .from('transactions')
                  .select('amount')
                  .eq('status', 'succeeded');
              
              const totalRevenue = txs?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;

              // 3. Pending Tickets
              const { count: ticketCount } = await supabase
                  .from('tickets')
                  .select('*', { count: 'exact', head: true })
                  .neq('status', 'closed');

              // 4. Recent Activity
              const { data: activity } = await supabase
                  .from('activity_logs')
                  .select('*, profiles(full_name)')
                  .order('created_at', { ascending: false })
                  .limit(5);

              return {
                  members: memberCount || 0,
                  revenue: totalRevenue,
                  tickets: ticketCount || 0,
                  activity: activity || [],
                  error: null
              };
          } catch (e: any) {
              console.error("Dashboard Stats Error:", e);
              return { members: 0, revenue: 0, tickets: 0, activity: [], error: e.message };
          }
      },
      
      // Fetch Chart Data (Aggregated by day)
      getRevenueChart: async () => {
          const { data: txs } = await supabase
              .from('transactions')
              .select('amount, created_at')
              .eq('status', 'succeeded')
              .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const chartData = days.map(d => ({ name: d, revenue: 0, eggs: 0 }));
          
          if (txs) {
              txs.forEach(tx => {
                  const date = new Date(tx.created_at);
                  const dayName = days[date.getDay()];
                  const dayObj = chartData.find(d => d.name === dayName);
                  if (dayObj) {
                      dayObj.revenue += Number(tx.amount);
                      // Simulate egg correlation
                      dayObj.eggs += Math.floor(Number(tx.amount) * 10); 
                  }
              });
          }
          return chartData;
      },
  },

  // --- Profiles / Members ---
  
  profiles: {
    list: async (page = 1, limit = 10, search = ''): Promise<ListResponse<Profile>> => {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }

      const { data, count, error } = await query;
      const mappedData = data?.map(p => ({
          ...p,
          status: p.status || 'active'
      })) || [];
      
      return { data: (mappedData as Profile[]), count: count || 0, error };
    },

    get: async (id: string) => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      return { data: data as Profile, error };
    },

    // Ultimate Member Profile Blueprint Aggregator
    getCompleteProfile: async (id: string) => {
        try {
            const [
                { data: profile, error: pError },
                { data: transactions },
                { data: logs },
                { data: tickets },
                { count: cardCount },
                { data: cards }
            ] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', id).single(),
                supabase.from('transactions').select('*').eq('profile_id', id).order('created_at', { ascending: false }),
                supabase.from('activity_logs').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
                supabase.from('tickets').select('*').eq('profile_id', id).order('created_at', { ascending: false }),
                supabase.from('cards').select('*', { count: 'exact', head: true }).eq('owner_id', id),
                supabase.from('cards').select('*').eq('owner_id', id).order('created_at', { ascending: false }).limit(20)
            ]);

            if (pError) throw pError;

            // Stats Calculations
            const lifetimeRevenue = transactions?.filter(t => t.status === 'succeeded').reduce((acc, t) => acc + (Number(t.amount) || 0), 0) || 0;
            // Best guess for eggs spent from logs
            const eggsSpent = logs?.filter(l => l.action_type === 'egg_spent' || l.description?.toLowerCase().includes('spent')).length || 0;

            return {
                profile: profile as Profile,
                transactions: (transactions as Transaction[]) || [],
                logs: logs || [],
                tickets: (tickets as Ticket[]) || [],
                cards: cards || [],
                stats: {
                    cardCount: cardCount || 0,
                    lifetimeRevenue,
                    eggsSpent
                }
            };
        } catch (e) {
            console.error("Error fetching complete profile:", e);
            return null;
        }
    },

    create: async (profileData: Partial<Profile>) => {
        // Use safeUUID to prevent crashes in insecure contexts
        const payload = {
            id: `usr_${safeUUID()}`,
            role: Role.USER,
            tier: Tier.FREE,
            egg_balance: { standard: 3, premium: 0, mystery: 0 },
            created_at: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            status: 'active',
            ...profileData
        };
        const { data, error } = await supabase.from('profiles').insert(payload).select().single();
        if (error) {
            console.error("Failed to create profile:", error);
        }
        return { data: data as Profile, error };
    },

    // Seed the database with mock users for testing
    seedMockUsers: async () => {
         let results = [];
         console.log("Seeding mock users...");
         for(const p of MOCK_PROFILES) {
             const payload = { ...p, created_at: new Date().toISOString() };
             const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
             results.push({ name: p.full_name, success: !error, error });
         }
         return results;
    },

    update: async (id: string, updates: Partial<Profile>) => {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
      console.log(`[AUDIT] Profile ${id} updated by admin`, updates);
      return { data: data as Profile, error };
    },

    ban: async (id: string, reason: string) => {
        console.log(`[AUDIT] Banning user ${id} reason: ${reason}`);
        const { error } = await supabase.from('profiles').update({ status: 'banned' }).eq('id', id);
        return { error };
    },

    adjustBalance: async (id: string, amount: number, type: 'standard' | 'premium', reason: string) => {
        const { data: profile } = await supabase.from('profiles').select('egg_balance').eq('id', id).single();
        if (profile) {
            const newBalance = { ...profile.egg_balance };
            newBalance[type] = (newBalance[type] || 0) + amount;
            
            const { data, error } = await supabase.from('profiles').update({ egg_balance: newBalance }).eq('id', id).select().single();
            console.log(`[AUDIT] Adjusted eggs for ${id}: ${amount} ${type}. Reason: ${reason}`);
            
            // Log this action
            await supabase.from('activity_logs').insert({
                user_id: id,
                action_type: 'admin_adjustment',
                description: `Admin adjusted ${type} eggs by ${amount}. Reason: ${reason}`
            });

            return { data: data as Profile, error };
        }
        return { error: 'Profile not found' };
    },

    getTransactions: async (id: string): Promise<Transaction[]> => {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('profile_id', id)
            .order('created_at', { ascending: false });
            
        if (error || !data) return [];
        return data as Transaction[];
    },

    refundTransaction: async (txId: string) => {
        const { error } = await supabase
            .from('transactions')
            .update({ status: 'refunded' })
            .eq('id', txId);
            
        console.log(`[AUDIT] Refunding transaction ${txId}`);
        return { success: !error };
    }
  },

  // --- Drops ---

  drops: {
    list: async (): Promise<ListResponse<Drop>> => {
      const { data, error, count } = await supabase
        .from('drops')
        .select('*', { count: 'exact' })
        .order('start_at', { ascending: false });
        
      return { data: (data as Drop[]) || [], count: count || 0, error };
    },

    create: async (drop: Omit<Drop, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('drops').insert(drop).select().single();
      console.log(`[AUDIT] Drop created`, drop);
      return { data: data as Drop, error };
    },

    update: async (id: string, updates: Partial<Drop>) => {
      const { data, error } = await supabase.from('drops').update(updates).eq('id', id).select().single();
      console.log(`[AUDIT] Drop ${id} updated`, updates);
      return { data: data as Drop, error };
    },

    archive: async (id: string) => {
      const { data, error } = await supabase
        .from('drops')
        .update({ status: DropStatus.ENDED })
        .eq('id', id)
        .select()
        .single();
      console.log(`[AUDIT] Drop ${id} archived`);
      return { data: data as Drop, error };
    }
  },

  // --- Stamps (Real DB) ---
  stamps: {
      list: async (): Promise<ListResponse<Stamp>> => {
          const { data, count, error } = await supabase.from('stamps').select('*', { count: 'exact' });
          return { data: (data as Stamp[]) || [], count: count || 0, error };
      },
      
      create: async (stamp: any) => {
          const payload = { ...stamp };
          
          // Safe ID Handling: If string ID provided (e.g. 'stp_...'), move to external_id
          // and let DB generate numeric ID.
          // This allows clients to propose IDs (drafts) without breaking BigInt column.
          if (payload.id && typeof payload.id === 'string' && !/^\d+$/.test(payload.id)) {
              payload.external_id = payload.id;
              delete payload.id; 
          }
          
          // Note: If payload.id is a numeric string (e.g. "123"), Postgres might accept it for bigint,
          // but usually we want to delete it to let the identity column auto-increment.
          // We assume "numeric strings" should also be treated as external_id if passed explicitly,
          // unless we are doing a migration/restore. For safety in this app context:
          if (payload.id && typeof payload.id === 'string' && /^\d+$/.test(payload.id)) {
               // Optional: Decide whether to treat as ID or external. 
               // For now, we trust the DB to auto-inc, so we remove it.
               // payload.external_id = payload.id; 
               // delete payload.id;
          }
          
          const { data, error } = await supabase.from('stamps').insert(payload).select().single();
          return { data, error };
      },
      
      update: async (id: string | number, updates: Partial<Stamp>) => {
          let query = supabase.from('stamps').update(updates);
          
          // Intelligent lookup:
          // If ID is a string like "stp_12345", look up by external_id.
          // If ID is a number or numeric string "123", look up by id (primary key).
          if (typeof id === 'string' && !/^\d+$/.test(id)) {
              query = query.eq('external_id', id);
          } else {
              query = query.eq('id', id);
          }
          
          const { data, error } = await query.select().single();
          return { data: data as Stamp, error };
      },

      delete: async (id: string | number) => {
          let query = supabase.from('stamps').delete();
          
          if (typeof id === 'string' && !/^\d+$/.test(id)) {
              query = query.eq('external_id', id);
          } else {
              query = query.eq('id', id);
          }
          
          const { error } = await query;
          return { error };
      }
  },

  // --- Tickets ---

  tickets: {
    list: async (statusFilter?: string) => {
      let query = supabase.from('tickets').select('*, messages(*)').order('created_at', { ascending: false });
      
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      return { data: (data as Ticket[]) || [], error };
    },

    update: async (id: string, updates: Partial<Ticket>) => {
      const { data, error } = await supabase.from('tickets').update(updates).eq('id', id).select().single();
      return { data: data as Ticket, error };
    }
  },

  // --- Broadcasts (Real DB) ---
  broadcasts: {
    list: async (): Promise<ListResponse<Broadcast>> => {
       const { data, error, count } = await supabase.from('broadcasts').select('*', { count: 'exact' }).order('created_at', { ascending: false });
       return { data: (data as unknown as Broadcast[]) || [], count: count || 0, error };
    },
    create: async (payload: Partial<Broadcast>) => {
        // Remove draft ID if present, let Supabase generate UUID
        if (payload.id && String(payload.id).startsWith('draft_')) delete payload.id;
        
        const { data, error } = await supabase.from('broadcasts').insert(payload).select().single();
        return { data: data as Broadcast, error };
    }
  },

  // --- Promos (Real DB) ---
  promos: {
    list: async (): Promise<ListResponse<Promo>> => {
       const { data, error, count } = await supabase.from('promos').select('*', { count: 'exact' }).order('created_at', { ascending: false });
       return { data: (data as unknown as Promo[]) || [], count: count || 0, error };
    },
    create: async (payload: Partial<Promo>) => {
        // Remove draft ID if present
        if (payload.id && String(payload.id).startsWith('draft_')) delete payload.id;
        
        const { data, error } = await supabase.from('promos').insert(payload).select().single();
        return { data: data as Promo, error };
    }
  },

  // --- Files (Real Storage ONLY) ---
  files: {
    list: async (bucket: string = 'stamps'): Promise<ListResponse<Asset>> => {
        try {
            console.log(`Fetching files from bucket: ${bucket} (Recursive)`);
            
            // Use recursive helper to find files in subfolders
            const rawFiles = await listAllFiles(bucket);
            console.log(`Found ${rawFiles.length} files in ${bucket} (recursive scan)`);

            // Helper to determine asset type from bucket
            const getAssetType = (b: string): AssetType => {
                if (b === 'stamps') return AssetType.STAMP_ART;
                if (b === 'templates') return AssetType.CARD_TEMPLATE;
                return AssetType.IMAGE;
            };

            // Use Promise.all to fetch signed URLs in parallel for performance
            const realAssets: Promise<Asset>[] = rawFiles.map(async (file) => {
                 // Use the full path (including folders/spaces) exactly as Supabase sees it
                 const filePath = file.fullPath || file.name;
                 
                 let finalUrl = '';
                 
                 // Strategy: Force Signed URLs. 
                 // This is the only way to reliably serve files with "Double Slashes", "Spaces", or "Special Chars"
                 // without the browser normalizing the URL and breaking it.
                 try {
                     const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, 3600); // 1 hour expiry
                     if (error) throw error;
                     finalUrl = data.signedUrl;
                 } catch (err) {
                     console.warn(`Signed URL failed for ${filePath}, attempting public fallback`, err);
                     // Fallback: Try a standard public URL but manually encode the parts
                     const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
                     const { data } = supabase.storage.from(bucket).getPublicUrl(encodedPath);
                     finalUrl = data.publicUrl;
                 }
                 
                 return {
                    id: file.id || filePath, 
                    name: filePath, // Show full path so we know if it's in a folder
                    url: finalUrl,
                    type: getAssetType(bucket),
                    size_kb: Math.round((file.metadata?.size || 0) / 1024),
                    tags: ['uploaded', bucket],
                    usage_count: 0,
                    bucket: bucket,
                    created_at: file.created_at || new Date().toISOString()
                 };
            });
            
            const resolvedAssets = await Promise.all(realAssets);

            return { data: resolvedAssets, count: resolvedAssets.length, error: null };

        } catch (e: any) {
            console.error(`Storage fetch failed for bucket ${bucket}:`, e.message);
            return { data: [], count: 0, error: e };
        }
    },

    upload: async (file: File, bucket: string, folder?: string) => {
        // Sanitize filename to prevent future issues
        const fileExt = file.name.split('.').pop();
        const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const rawFileName = `${Date.now()}_${cleanName}.${fileExt}`;
        // Prepend folder if provided
        const fileName = folder ? `${folder}/${rawFileName}` : rawFileName;
        
        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, file);

            if (error) throw error;

            // Get Signed URL immediately
            const { data: urlData } = await supabase.storage.from(bucket).createSignedUrl(fileName, 3600);
            
            const newAsset: Asset = {
                id: data.path, // path acts as ID
                name: fileName,
                url: urlData?.signedUrl || '',
                type: bucket === 'stamps' ? AssetType.STAMP_ART : AssetType.IMAGE,
                size_kb: Math.round(file.size / 1024),
                tags: ['new', bucket],
                usage_count: 0,
                created_at: new Date().toISOString()
            };
            
            return { data: newAsset, error: null };
        } catch (e: any) {
            console.error("Upload failed", e);
            return { data: null, error: e };
        }
    },

    uploadBase64: async (base64Data: string, bucket: string, folder?: string) => {
        try {
            // Convert base64 to Blob
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });

            const rawFileName = `gen_ai_${Date.now()}.png`;
            // Prepend folder if provided
            const fileName = folder ? `${folder}/${rawFileName}` : rawFileName;
            
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, blob, { contentType: 'image/png' });

            if (error) throw error;

             // Get Signed URL immediately
            const { data: urlData } = await supabase.storage.from(bucket).createSignedUrl(fileName, 3600);
            
            return { 
                data: {
                    url: urlData?.signedUrl || '',
                    path: data.path
                },
                error: null 
            };
        } catch (e: any) {
            console.error("Upload Base64 failed", e);
            return { data: null, error: e };
        }
    },

    delete: async (bucket: string, path: string) => {
        try {
             const { data, error } = await supabase.storage.from(bucket).remove([path]);
             if (error) throw error;
             return { error: null };
        } catch (e: any) {
            console.error("Delete failed", e);
            return { error: e };
        }
    }
  },

  // --- Pidgey AI Brain (Real Data Integration) ---
  pidgey: {
      getRealContext: async () => {
        try {
            // 1. Real Tickets
            const { data: tickets } = await supabase
                .from('tickets')
                .select('id, subject, priority, status')
                .eq('status', 'open')
                .limit(50); // Increased limit for smarter context

            // 2. Real Drops
            const { data: activeDrops } = await supabase
                .from('drops')
                .select('title, status, start_at')
                .limit(20);

            // 3. Real Revenue (Last 24h)
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: recentTxs } = await supabase
                .from('transactions')
                .select('amount')
                .gte('created_at', yesterday);
            
            const revenue24h = recentTxs?.reduce((sum, t) => sum + (Number(t.amount)||0), 0) || 0;

            // 4. Activity
            const { count: memberCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

            // 5. Broadcasts & Promos (New for Smarter Pidgey)
            const { data: recentBroadcasts } = await supabase
                .from('broadcasts')
                .select('name, status, stats')
                .limit(5);
                
            const { data: activePromos } = await supabase
                .from('promos')
                .select('code, type, usage_count')
                .eq('status', 'active');

            return {
                tickets: tickets || [],
                activeDrops: activeDrops || [],
                broadcasts: recentBroadcasts || [],
                promos: activePromos || [],
                operational: {
                    revenue_24h: revenue24h,
                    total_members: memberCount || 0,
                    system_health: "Nominal"
                }
            };

        } catch (e) {
            console.error("Pidgey Context Error", e);
            return { error: "Failed to fetch real context" };
        }
      }
  },

  // --- System Health (Real Backend Integration) ---
  health: {
      getSystem: async () => {
          try {
              const res = await fetch(`${BACKEND_API}/admin/health`);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return await res.json();
          } catch (e: any) {
              return { 
                  version: 'Unknown', 
                  status: 'error', 
                  timestamp: new Date().toISOString(), 
                  error: e.message 
              };
          }
      },
      
      getSupabase: async () => {
          try {
              const res = await fetch(`${BACKEND_API}/admin/supabase-status`);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return await res.json();
          } catch (e: any) {
              return { dbStatus: 'error', storageStatus: 'error', error: e.message };
          }
      },
      
      getSmtp: async () => {
          try {
               const res = await fetch(`${BACKEND_API}/admin/smtp-status`);
               if (!res.ok) throw new Error(`HTTP ${res.status}`);
               return await res.json();
          } catch (e: any) {
              return { keyPresent: false, relayStatus: 'error', error: e.message };
          }
      }
  },

  // --- Deliveries (Hybrid/Mock) ---
  deliveries: {
    list: async (statusFilter?: string): Promise<ListResponse<DeliveryJourney>> => {
        let data = MOCK_DELIVERIES;
        if (statusFilter && statusFilter !== 'all') {
            data = data.filter(d => d.current_status === statusFilter);
        }
        return { data: data, count: data.length, error: null };
    }
  },
  
  // --- Flight Path (Deep Lifecycle) ---
  flightPath: {
      search: async (query: string): Promise<DeliveryJourney[]> => {
          const q = query.toLowerCase();
          return MOCK_FLIGHT_PATHS.filter(journey => 
             journey.message_id.includes(q) || 
             journey.recipient.includes(q) ||
             journey.events.some(e => e.meta && JSON.stringify(e.meta).includes(q))
          );
      },

      syncSmtpGo: async (apiKey: string): Promise<DeliveryJourney[]> => {
          console.log(`[SMTP2GO] Syncing logs with key: ${apiKey.substring(0, 4)}...`);
          // Mock sync logic retained for Flight Path as it connects to external API
          const newJourney: DeliveryJourney = {
              message_id: 'smtp_new_1',
              recipient: 'found.via.api@example.com',
              channel: BroadcastChannel.EMAIL,
              current_status: DeliveryStatus.DELIVERED,
              started_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              events: [
                  { 
                      id: 'evt_api_1', 
                      message_id: 'smtp_new_1', 
                      recipient: 'found.via.api@example.com', 
                      channel: BroadcastChannel.EMAIL, 
                      status: DeliveryStatus.DELIVERED, 
                      timestamp: new Date().toISOString(),
                      meta: { source: 'smtp2go_api_sync' }
                  }
              ]
          };
          
          return [newJourney];
      },
      
      reroute: async (messageId: string, newEmail: string): Promise<DeliveryJourney> => {
          console.log(`[ACTION] Rerouting ${messageId} to ${newEmail}`);
          const journey = MOCK_FLIGHT_PATHS.find(j => j.message_id === messageId);
          if (journey) {
              journey.recipient = newEmail;
              journey.current_status = DeliveryStatus.RESCUED;
              journey.events.push({
                  id: 'evt_rescue_' + Date.now(),
                  message_id: messageId,
                  recipient: newEmail,
                  channel: BroadcastChannel.EMAIL,
                  status: DeliveryStatus.RESCUED,
                  timestamp: new Date().toISOString(),
                  meta: { note: 'Admin manual reroute' }
              });
              return { ...journey };
          }
          throw new Error("Journey not found");
      },

      returnToSender: async (messageId: string): Promise<DeliveryJourney> => {
           console.log(`[ACTION] Refunding ${messageId} and notifying sender`);
           const journey = MOCK_FLIGHT_PATHS.find(j => j.message_id === messageId);
           if (journey) {
               journey.current_status = DeliveryStatus.RETURNED_TO_SENDER;
               journey.events.push({
                   id: 'evt_rts_' + Date.now(),
                   message_id: messageId,
                   recipient: journey.recipient,
                   channel: BroadcastChannel.EMAIL,
                   status: DeliveryStatus.RETURNED_TO_SENDER,
                   timestamp: new Date().toISOString(),
                   meta: { note: 'Egg refunded to sender' }
               });
               return { ...journey };
           }
           throw new Error("Journey not found");
      }
  }
};
