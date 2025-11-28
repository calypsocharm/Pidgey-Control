
import { supabase } from './supabaseClient';
import { Profile, Drop, Ticket, DropStatus, Broadcast, Promo, Asset, AssetType, DeliveryJourney, DeliveryStatus, BroadcastChannel, Transaction, Role, Tier } from '../types';
import { MOCK_BROADCASTS, MOCK_PROMOS, MOCK_ASSETS, MOCK_DELIVERIES, MOCK_FLIGHT_PATHS } from '../constants';

/**
 * Generic response type for list operations
 */
export interface ListResponse<T> {
  data: T[];
  count: number;
  error: any;
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

      // System Seed / Migration
      seed: async () => {
          console.log("Starting Migration...");
          
          // 1. Migrate Profiles
          // Note: In real app, we can't insert into auth.users easily from client.
          // We will insert into public.profiles for demo visualization.
          /*
          for (const p of MOCK_PROFILES) {
              const { error } = await supabase.from('profiles').upsert({
                  id: p.id,
                  email: p.email,
                  full_name: p.full_name,
                  role: p.role,
                  tier: p.tier,
                  egg_balance: p.egg_balance,
                  created_at: p.created_at,
                  last_seen: p.last_seen
              });
              if (error) console.error("Profile Migrate Error", error);
          }
          */
          console.log("Migration logic would run here (commented out for safety in this demo).");
          return { success: true };
      }
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
          status: 'active'
      })) || [];
      
      return { data: (mappedData as Profile[]), count: count || 0, error };
    },

    get: async (id: string) => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      return { data: data as Profile, error };
    },

    create: async (profileData: Partial<Profile>) => {
        const payload = {
            id: `usr_${crypto.randomUUID()}`,
            role: Role.USER,
            tier: Tier.FREE,
            egg_balance: { standard: 3, premium: 0, mystery: 0 },
            created_at: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            ...profileData
        };
        const { data, error } = await supabase.from('profiles').insert(payload).select().single();
        return { data: data as Profile, error };
    },

    update: async (id: string, updates: Partial<Profile>) => {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
      console.log(`[AUDIT] Profile ${id} updated by admin`, updates);
      return { data: data as Profile, error };
    },

    ban: async (id: string, reason: string) => {
        console.log(`[AUDIT] Banning user ${id} reason: ${reason}`);
        // In real app, update a 'status' column or 'banned_at'
        return { error: null };
    },

    adjustBalance: async (id: string, amount: number, type: 'standard' | 'premium', reason: string) => {
        const { data: profile } = await supabase.from('profiles').select('egg_balance').eq('id', id).single();
        if (profile) {
            const newBalance = { ...profile.egg_balance };
            newBalance[type] = (newBalance[type] || 0) + amount;
            
            const { data, error } = await supabase.from('profiles').update({ egg_balance: newBalance }).eq('id', id).select().single();
            console.log(`[AUDIT] Adjusted eggs for ${id}: ${amount} ${type}. Reason: ${reason}`);
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

  // --- Broadcasts (Hybrid) ---
  broadcasts: {
    list: async (): Promise<ListResponse<Broadcast>> => {
       const { data, error, count } = await supabase.from('broadcasts').select('*', { count: 'exact' });
       if (error) {
           // Fallback to mocks if table doesn't exist yet
           return { data: MOCK_BROADCASTS, count: MOCK_BROADCASTS.length, error: null };
       }
       return { data: (data as unknown as Broadcast[]) || [], count: count || 0, error };
    },
    create: async (payload: Partial<Broadcast>) => {
        console.log("Creating broadcast", payload);
        return { data: { ...payload, id: 'bc_new_' + Date.now() } as Broadcast, error: null };
    }
  },

  // --- Promos (Hybrid) ---
  promos: {
    list: async (): Promise<ListResponse<Promo>> => {
       const { data, error, count } = await supabase.from('promos').select('*', { count: 'exact' });
       if (error) {
           return { data: MOCK_PROMOS, count: MOCK_PROMOS.length, error: null };
       }
       return { data: (data as unknown as Promo[]) || [], count: count || 0, error };
    }
  },

  // --- Files (Real Storage) ---
  files: {
    list: async (bucket: string = 'stamps'): Promise<ListResponse<Asset>> => {
        try {
            const { data: files, error } = await supabase.storage.from(bucket).list();
            
            if (error) throw error;

            // Helper to determine asset type from bucket
            const getAssetType = (b: string): AssetType => {
                if (b === 'stamps') return AssetType.STAMP_ART;
                if (b === 'templates') return AssetType.CARD_TEMPLATE;
                return AssetType.IMAGE;
            };

            const realAssets: Asset[] = (files || []).map(file => {
                 const { data } = supabase.storage.from(bucket).getPublicUrl(file.name);
                 return {
                    id: file.id,
                    name: file.name,
                    url: data.publicUrl,
                    type: getAssetType(bucket),
                    size_kb: Math.round((file.metadata?.size || 0) / 1024),
                    tags: ['uploaded', bucket],
                    usage_count: 0,
                    bucket: bucket,
                    created_at: file.created_at
                 };
            });

            return { data: realAssets, count: realAssets.length, error: null };

        } catch (e: any) {
            console.warn(`Storage fetch failed for bucket ${bucket}:`, e.message);
            // Return mocks only if we are browsing stamps/templates and fail (graceful degradation)
            if (bucket === 'stamps' || bucket === 'templates') {
                 return { data: MOCK_ASSETS.filter(a => a.type === (bucket === 'stamps' ? AssetType.STAMP_ART : AssetType.CARD_TEMPLATE)), count: 0, error: null };
            }
            return { data: [], count: 0, error: e };
        }
    },

    upload: async (file: File, bucket: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        
        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, file);

            if (error) throw error;

            // Get URL
            const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
            
            const newAsset: Asset = {
                id: data.path, // path acts as ID
                name: file.name,
                url: urlData.publicUrl,
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

      // Simulate syncing with external SMTP2GO API
      syncSmtpGo: async (apiKey: string): Promise<DeliveryJourney[]> => {
          console.log(`[SMTP2GO] Syncing logs with key: ${apiKey.substring(0, 4)}...`);
          
          // In a real app, this would be:
          // const res = await fetch('https://api.smtp2go.com/v3/email/search', { headers: { 'X-Smtp2go-Api-Key': apiKey } });
          
          // We return a "new" mock journey to simulate finding data
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
