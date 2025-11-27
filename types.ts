// Enums matching DB constraints
export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  SUPPORT = 'support',
  MARKETING = 'marketing',
}

export enum Tier {
  FREE = 'Free',
  PREMIUM = 'Premium',
  PRO = 'Pro',
}

export enum TicketStatus {
  NEW = 'new',
  OPEN = 'open',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum DropStatus {
  DRAFT = 'draft',
  LIVE = 'live',
  ENDED = 'ended',
}

export enum StampRarity {
  COMMON = 'Common',
  RARE = 'Rare',
  LEGENDARY = 'Legendary',
  PIDGEY = 'Pidgey', // Special ultra rare
}

// Interfaces mirroring DB Tables

export interface EggBalance {
  mystery: number;
  premium: number;
  standard: number;
}

export interface Profile {
  id: string;
  email: string | null; // Nullable in DB
  full_name: string | null; // Nullable in DB
  role: Role; // text in DB
  tier: Tier; // text in DB
  egg_balance: EggBalance; // jsonb
  created_at: string | null; // timestamptz nullable
  last_seen: string | null; // timestamptz nullable
  avatar_url?: string; // Virtual field for UI
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  website: string;
  revenue_split: number;
  is_active: boolean;
}

export interface Stamp {
  id: string;
  name: string;
  slug: string;
  rarity: StampRarity;
  collection: string;
  artist_id?: string;
  price_eggs?: number;
  is_drop_only: boolean;
  art_path: string; // URL in frontend context
}

export interface Drop {
  id: string;
  title: string;
  description: string;
  artist_id: string;
  egg_price: number;
  max_supply?: number;
  status: DropStatus;
  start_at: string;
  end_at: string;
  banner_path: string; // URL
}

export interface Card {
  id: string;
  owner_id: string | null; // text nullable in DB
  data: any; // JSONB content
  created_at: string | null;
  updated_at: string | null;
}

export interface UserTemplate {
  id: string;
  owner_id: string | null; // text nullable in DB
  template_id: string | null; // text nullable in DB
  template_data: any;
  created_at: string | null;
  updated_at: string | null;
}

export interface Ticket {
  id: string;
  profile_id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  source: string;
  tags: string[];
  created_at: string;
  messages: TicketMessage[]; // Joined for UI convenience
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'member' | 'admin' | 'system';
  sender_id?: string;
  body: string;
  created_at: string;
}

export interface StatMetric {
  label: string;
  value: string | number;
  change: number; // Percentage
  trend: 'up' | 'down' | 'neutral';
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}
