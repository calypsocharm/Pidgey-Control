
export const PUBLIC_SCHEMA_DDL = `
-- 1) TABLE: profiles
CREATE TABLE public.profiles (
    id text PRIMARY KEY,
    email text,
    full_name text,
    role text DEFAULT 'user'::text,
    tier text DEFAULT 'Free'::text,
    egg_balance jsonb DEFAULT '{"mystery": 0, "premium": 0, "standard": 3}'::jsonb,
    status text DEFAULT 'active'::text,
    created_at timestamptz DEFAULT now(),
    last_seen timestamptz DEFAULT now()
);

-- 2) TABLE: cards
CREATE TABLE public.cards (
    id text PRIMARY KEY,
    data jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    owner_id text
);

-- 3) TABLE: transactions (Revenue)
CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id text REFERENCES public.profiles(id),
    amount numeric,
    currency text,
    status text,
    description text,
    created_at timestamptz DEFAULT now()
);

-- 4) TABLE: tickets (Support)
CREATE TABLE public.tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id text REFERENCES public.profiles(id),
    subject text,
    status text,
    priority text,
    created_at timestamptz DEFAULT now()
);

-- 5) TABLE: activity_logs (Real-time feed)
CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.profiles(id),
    action_type text,
    description text,
    created_at timestamptz DEFAULT now()
);

-- 6) TABLE: drops
CREATE TABLE public.drops (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  description text,
  status text,
  egg_price int default 0,
  bundle_price int default 0,
  max_supply int,
  artist_id text,
  banner_path text,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 7) TABLE: stamps
CREATE TABLE public.stamps (
  id text primary key,
  name text,
  slug text,
  rarity text,
  status text, -- draft, ready, active, archived
  collection text,
  artist_id text,
  art_path text, -- URL to the file in storage
  price_eggs int default 0,
  edition_count int default 0, -- Max supply for this stamp
  is_drop_only boolean default false,
  design_config jsonb, -- Playground settings
  created_at timestamptz default now()
);

-- 8) TABLE: broadcasts
CREATE TABLE public.broadcasts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  subject text,
  channels text[], -- array of strings e.g. ['email', 'push']
  audience_segment text,
  audience_size int default 0,
  scheduled_at timestamptz,
  status text default 'draft',
  stats jsonb default '{"delivered":0, "opened":0, "clicked":0, "failed":0}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 9) TABLE: promos
CREATE TABLE public.promos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  code text,
  type text,
  status text default 'draft',
  description text,
  value jsonb,
  start_at timestamptz,
  end_at timestamptz,
  usage_count int default 0,
  created_at timestamptz DEFAULT now()
);
`;
