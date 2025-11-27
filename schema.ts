export const PUBLIC_SCHEMA_DDL = `
-- 1) TABLE: profiles
CREATE TABLE public.profiles (
    id text PRIMARY KEY,
    email text,
    full_name text,
    role text DEFAULT 'user'::text,
    tier text DEFAULT 'Free'::text,
    egg_balance jsonb DEFAULT '{"mystery": 0, "premium": 0, "standard": 3}'::jsonb,
    created_at timestamptz DEFAULT now(),
    last_seen timestamptz DEFAULT now()
);
-- RLS: ENABLE ROW LEVEL SECURITY

-- 2) TABLE: cards
CREATE TABLE public.cards (
    id text PRIMARY KEY,
    data jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    owner_id text
);
-- Foreign keys: owner_id REFERENCES public.profiles(id)
-- RLS: ENABLE ROW LEVEL SECURITY

-- 3) TABLE: user_templates
CREATE TABLE public.user_templates (
    id text PRIMARY KEY,
    owner_id text,
    template_id text,
    template_data jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Foreign keys: owner_id REFERENCES public.profiles(id)
-- RLS: ENABLE ROW LEVEL SECURITY

-- INSTALLED EXTENSIONS:
-- intarray, xml2, pgmq, vector, pg_cron, ltree, pgtap, pg_net, pgjwt, supabase_vault, pg_graphql

-- EDGE FUNCTIONS:
-- resend-card (id: 99062919...)
`;
