
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
  COMMON = 'common',
  RARE = 'rare',
  FOIL = 'foil',
  LEGENDARY = 'legendary',
  PIDGEY = 'pidgey',
  ULTIMATE = 'snake_scale',
}

export enum StampStatus {
  DRAFT = 'draft',      // Newly created in Playground, missing metadata
  READY = 'ready',      // Metadata complete, ready to be added to a drop
  ACTIVE = 'active',    // Live in a drop or store
  ARCHIVED = 'archived',
  TEST = 'test',
}

// Broadcasts
export enum BroadcastStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  CANCELLED = 'cancelled'
}

export enum BroadcastChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push'
}

export interface Broadcast {
  id: string;
  name: string;
  subject?: string;
  channels: BroadcastChannel[];
  audience_segment: string;
  audience_size?: number;
  scheduled_at?: string;
  status: BroadcastStatus;
  stats?: {
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
  created_at: string;
}

// Promos
export enum PromoType {
  DISCOUNT = 'discount',
  EGG_BONUS = 'egg_bonus',
  FREE_STAMP = 'free_stamp',
  SEASONAL = 'seasonal_event'
}

export enum PromoStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXPIRED = 'expired'
}

export interface Promo {
  id?: string; // Optional for drafting
  name: string;
  code: string;
  type: PromoType;
  status: PromoStatus;
  description?: string;
  value: any; // e.g. { percent: 10 } or { eggs: 5 }
  start_at?: string;
  end_at?: string;
  usage_count: number;
  created_at?: string;
}

// Assets
export enum AssetType {
  IMAGE = 'image',
  STAMP_ART = 'stamp_art',
  CARD_TEMPLATE = 'card_template',
  ICON = 'icon'
}

export interface Asset {
  id: string;
  name: string;
  url: string;
  type: AssetType;
  size_kb: number;
  tags: string[];
  usage_count: number; 
  created_at: string;
  bucket?: string; // Optional reference to source bucket
}

// Deliveries (Message Health) & Flight Path
export enum DeliveryStatus {
    QUEUED = 'queued',
    SENT = 'sent',
    DELIVERED = 'delivered',
    OPENED = 'opened',
    CLICKED = 'clicked',
    BOUNCED = 'bounced',
    FAILED = 'failed',
    CARD_VIEWED = 'card_viewed',
    CARD_NOT_FOUND = 'card_not_found', // The "Lost Pidgey" scenario
    RENDER_ERROR = 'render_error',
    // New Flight Path Statuses
    REFERRAL_CLICKED = 'referral_clicked',
    REFERRAL_CONVERTED = 'referral_converted',
    MEMORY_SAVED = 'memory_saved',
    // Rescue Statuses
    RESCUED = 'rescued', // Rerouted manually by admin
    RETURNED_TO_SENDER = 'returned_to_sender' // Refunded and notified
}

export interface MessageEvent {
    id: string;
    message_id: string; // The Send ID
    recipient: string;
    channel: BroadcastChannel;
    status: DeliveryStatus;
    timestamp: string;
    meta?: any; // Error codes, user agent, referral_id, memory_id etc.
}

export interface DeliveryJourney {
    message_id: string;
    recipient: string;
    channel: BroadcastChannel;
    current_status: DeliveryStatus;
    started_at: string;
    updated_at: string;
    events: MessageEvent[];
}

// Database Entities

export interface EggBalance {
  mystery: number;
  premium: number;
  standard: number;
}

export interface Transaction {
    id: string;
    profile_id: string;
    amount: number;
    currency: 'USD' | 'EUR';
    description: string;
    status: 'succeeded' | 'refunded' | 'failed';
    created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  tier: Tier;
  egg_balance: EggBalance;
  created_at: string | null;
  last_seen: string | null;
  avatar_url?: string; // Virtual UI field
  status: 'active' | 'banned' | 'suspended'; // UI status
  
  // Player 360 Stats (Virtual)
  stats?: {
      sends: number;
      hatches: number;
      streak: number;
      stamps_owned: number;
      last_active_relative: string;
  };
  flags?: {
      churn_risk?: boolean;
      high_support?: boolean;
      whale?: boolean;
  };
  
  // Recent Activity Log (Virtual)
  activity_log?: {
      type: 'send' | 'hatch' | 'login' | 'error';
      desc: string;
      date: string;
  }[];
  
  // Economy History (Virtual)
  economy_log?: {
      amount: number;
      currency: 'eggs' | 'coins';
      reason: string;
      date: string;
  }[];
}

export interface Stamp {
  id?: string | number; // Supports DB bigint
  external_id?: string; // For string identifiers (stp_...)
  name: string;
  slug?: string;
  rarity: StampRarity;
  status: StampStatus;
  collection?: string;
  artist_id?: string;
  price_eggs?: number;
  edition_count?: number; // Total supply
  is_drop_only?: boolean;
  art_path: string;
  created_at?: string;
  design_config?: any; // JSONB for Playground settings
}

export interface Drop {
  id?: string; // Optional for drafting
  title: string;
  description: string;
  artist_id: string;
  egg_price: number;
  bundle_price?: number; // Price to buy the whole collection
  max_supply?: number;
  status: DropStatus;
  start_at: string;
  end_at: string;
  banner_path: string;
  created_at?: string;
  
  // UI Helper for the Builder Workflow
  stamps?: Partial<Stamp>[];
}

export interface Card {
  id: string;
  owner_id: string | null;
  data: any;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserTemplate {
  id: string;
  owner_id: string | null;
  template_id: string | null;
  template_data: any;
  created_at: string | null;
  updated_at: string | null;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'member' | 'admin' | 'system';
  sender_id?: string;
  body: string;
  created_at: string;
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
  messages: TicketMessage[]; // Virtual join
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    action?: any; // Generic action payload
}

// Pidgey Creations (Drafts)
export interface CreationDraft {
  id: string;
  type: 'drop' | 'broadcast' | 'promo' | 'stamp' | 'member';
  data: any;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  summary: string;
}

// --- STUDIO CONFIGURATION TYPES ---

export interface TextConfig {
    text: string;
    font: 'font-sans' | 'font-serif' | 'font-mono' | 'font-handwriting';
    size: number;
    color: string;
    shadowColor: string;
    align: 'text-left' | 'text-center' | 'text-right';
    posX: number; // Percentage 0-100
    posY: number; // Percentage 0-100
}

export interface EffectConfig {
    type: 'none' | 'snow' | 'rain' | 'confetti' | 'glitch' | 'pulse' | 'holographic';
    intensity: number;
}

export interface BorderConfig {
    enabled: boolean;
    color: string;
    thickness: number;
    style: 'solid' | 'dotted' | 'dashed' | 'double' | 'groove' | 'ridge' | 'perforated';
    radius: number; // 0-50%
    glowColor: string;
    glowIntensity: number; // 0-50px
    material: 'none' | 'gold' | 'silver' | 'neon' | 'holo' | 'matte';
    // Inner Frame
    innerColor: string;
    innerThickness: number;
}

export interface ArtConfig {
    scale: number;
    x: number;
    y: number;
}
