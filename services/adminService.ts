
import { supabase } from './supabaseClient';
import { Profile, Drop, Ticket, DropStatus, Broadcast, Promo, Asset, DeliveryJourney, DeliveryStatus, BroadcastChannel, Transaction, Role, Tier } from '../types';
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
              // Note: For large datasets, use a Postgres RPC function. For now, we fetch recent txs.
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
          // This is a simplified frontend aggregation. 
          // Ideally, create a Postgres View: "create view daily_revenue as select date_trunc('day', created_at)..."
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
      // Map basic DB data to have some default UI status
      const mappedData = data?.map(p => ({
          ...p,
          status: 'active' // Default status since it's not in DB schema yet
      })) || [];
      
      return { data: (mappedData as Profile[]), count: count || 0, error };
    },

    get: async (id: string) => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      return { data: data as Profile, error };
    },

    create: async (profileData: Partial<Profile>) => {
        // In reality, you'd use supabase.auth.admin.createUser, but here we insert to profiles table
        const payload = {
            id: `usr_new_${Date.now()}`,
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
        // Simulate ban by updating metadata or role
        console.log(`[AUDIT] Banning user ${id} reason: ${reason}`);
        // For visual feedback in this demo, we assume success
        return { error: null };
    },

    adjustBalance: async (id: string, amount: number, type: 'standard' | 'premium', reason: string) => {
        // Fetch current
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
        // Fetch real transactions
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
      // For drops, we usually want all active ones or a long list, simple pagination for now
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

    // Soft delete by setting status to ended or a hypothetical 'archived' state
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

  // --- Broadcasts (Hybrid: Try Supabase, fallback to Mock) ---
  broadcasts: {
    list: async (): Promise<ListResponse<Broadcast>> => {
       // Attempt fetch
       const { data, error, count } = await supabase.from('broadcasts').select('*', { count: 'exact' });
       if (error) {
           console.warn("Supabase 'broadcasts' table missing, using mocks.", error.message);
           return { data: MOCK_BROADCASTS, count: MOCK_BROADCASTS.length, error: null };
       }
       return { data: (data as unknown as Broadcast[]) || [], count: count || 0, error };
    },
    create: async (payload: Partial<Broadcast>) => {
        // Mock success
        console.log("Creating broadcast", payload);
        return { data: { ...payload, id: 'bc_new_' + Date.now() } as Broadcast, error: null };
    }
  },

  // --- Promos (Hybrid) ---
  promos: {
    list: async (): Promise<ListResponse<Promo>> => {
       const { data, error, count } = await supabase.from('promos').select('*', { count: 'exact' });
       if (error) {
           console.warn("Supabase 'promos' table missing, using mocks.");
           return { data: MOCK_PROMOS, count: MOCK_PROMOS.length, error: null };
       }
       return { data: (data as unknown as Promo[]) || [], count: count || 0, error };
    }
  },

  // --- Files (Hybrid) ---
  files: {
    list: async (typeFilter?: string): Promise<ListResponse<Asset>> => {
        // Since we don't have a direct 'assets' table in basic schema, usually this comes from Storage API
        // For Control Tower view, we'll return mocks for now to ensure the Grid works
        let files = MOCK_ASSETS;
        if (typeFilter && typeFilter !== 'all') {
            files = files.filter(f => f.type === typeFilter);
        }
        return { data: files, count: files.length, error: null };
    }
  },

  // --- Deliveries (Hybrid/Mock) ---
  deliveries: {
    list: async (statusFilter?: string): Promise<ListResponse<DeliveryJourney>> => {
        // In a real app, this queries message_events grouped by message_id
        // For now, we use the rich MOCK_DELIVERIES
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
          // Simulate searching by message_id, email, or card_id
          const q = query.toLowerCase();
          return MOCK_FLIGHT_PATHS.filter(journey => 
             journey.message_id.includes(q) || 
             journey.recipient.includes(q) ||
             journey.events.some(e => e.meta && JSON.stringify(e.meta).includes(q))
          );
      },
      
      // Admin Action: Reroute a failed message
      reroute: async (messageId: string, newEmail: string): Promise<DeliveryJourney> => {
          // In real app: Call edge function 'resend-card'
          console.log(`[ACTION] Rerouting ${messageId} to ${newEmail}`);
          
          // Mock update local state for UI
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

      // Admin Action: Return to Sender (Refund)
      returnToSender: async (messageId: string): Promise<DeliveryJourney> => {
           // In real app: Refund transaction, create notification row
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
