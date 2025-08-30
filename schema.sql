-- =============================================
-- SUPABASE SCHEMA - USERS, CHATBOTS & PLANS (clean install)
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CLEANUP
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created_extra ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user_extra() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

DROP TABLE IF EXISTS public.knowledge_sources CASCADE;
DROP TABLE IF EXISTS public.chats CASCADE;
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.chunks CASCADE;

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  company_name TEXT NOT NULL,
  company_slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly INTEGER DEFAULT 0,
  price_yearly  INTEGER DEFAULT 0,
  max_chats INTEGER DEFAULT 1,
  max_messages_per_month INTEGER DEFAULT 20,
  max_characters INTEGER DEFAULT 400000,
  max_file_uploads INTEGER DEFAULT 5,
  custom_domain   BOOLEAN DEFAULT false,
  remove_branding BOOLEAN DEFAULT false,
  api_access      BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  analytics       BOOLEAN DEFAULT false,
  is_active  BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  current_period_end   TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 month'),
  messages_used_this_month INTEGER DEFAULT 0,
  last_reset_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  welcome_message TEXT DEFAULT 'Hello! How can I help you today?',
  placeholder_text TEXT DEFAULT 'Type your message...',
  model TEXT DEFAULT 'gpt-3.5-turbo',
  temperature DECIMAL(3,2) DEFAULT 0.70 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 500,
  system_prompt TEXT,
  system_prompt_type TEXT,
  primary_color TEXT DEFAULT '#000000',
  background_color TEXT DEFAULT '#FFFFFF',
  font_family TEXT DEFAULT 'Inter',
  enable_web_search  BOOLEAN DEFAULT false,
  enable_file_search BOOLEAN DEFAULT true,
  collect_emails     BOOLEAN DEFAULT false,
  show_sources       BOOLEAN DEFAULT true,
  enable_voice       BOOLEAN DEFAULT false,
  total_characters_used INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','training','ready','disabled')),
  last_trained_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.knowledge_sources (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('file','text','website','qa')),
  name TEXT NOT NULL,
  content   TEXT,
  file_url  TEXT,
  file_name TEXT,
  file_size INTEGER,
  character_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','processing','failed','disabled','upload_pending')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Chunks + embeddings
-- =========================================================
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.chunks (
  id           uuid primary key default extensions.gen_random_uuid(),
  chat_id      uuid not null references public.chats(id) on delete cascade,
  source_id    uuid not null references public.knowledge_sources(id) on delete cascade,
  -- 'text' (texto normal), 'table' (HTML completo en content), 'img_text' (descripción textual de imagen)
  kind         text not null check (kind in ('text', 'table', 'img_text')),
  -- Para 'text'/'img_text': contenido embebible (caption/OCR/tags/objects, etc.).
  -- Para 'table': HTML completo de la tabla (lo que se usará en la respuesta final).
  content      text not null,
  page         int,
  -- meta puede incluir, por ejemplo:
  --   para 'img_text': {"image_uid":"...", "bbox":[x0,y0,x1,y1], "order_index":N,
  --                     "tags":[...], "colors":{dominant:[...],palette:[...]},
  --                     "objects":[...], "ocr_text":"...", "approx_size":"...", "safety":{...}}
  --   para 'table':   {"table_id":"...", "plain":"..."}  -- plain = versión textual para embeddings
  meta         jsonb not null default '{}'::jsonb,
  embedding    vector(1536),
  created_at   timestamptz default now()
);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_sources_updated_at
  BEFORE UPDATE ON public.knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name   TEXT;
  v_avatar TEXT;
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.user_metadata->>'name',
    NEW.user_metadata->>'full_name',
    split_part(NEW.email, '@', 1),
    'User'
  );

  v_avatar := COALESCE(
    NEW.raw_user_meta_data->>'picture',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.user_metadata->>'picture',
    NEW.user_metadata->>'avatar_url'
  );

  INSERT INTO public.profiles (id, email, full_name, avatar_url, company_name, company_slug)
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_avatar,
    v_name || '''s Company',
    'user-' || extensions.gen_random_uuid()::text
  )
  ON CONFLICT (id) DO UPDATE
  SET email        = EXCLUDED.email,
      full_name    = EXCLUDED.full_name,
      avatar_url   = EXCLUDED.avatar_url,
      company_name = EXCLUDED.company_name;

  INSERT INTO public.user_subscriptions (user_id, plan_id, status)
  SELECT NEW.id, id, 'active'
  FROM public.subscription_plans
  WHERE slug = 'free'
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public, extensions;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- RLS
-- =============================================
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chunks              ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Subscription plans are viewable by everyone"
  ON public.subscription_plans FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chats"
  ON public.chats FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats"
  ON public.chats FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats"
  ON public.chats FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats"
  ON public.chats FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public chats are viewable by everyone"
  ON public.chats FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own knowledge sources"
  ON public.knowledge_sources FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.chats WHERE id = knowledge_sources.chat_id));

CREATE POLICY "Users can create knowledge sources for own chats"
  ON public.knowledge_sources FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.chats WHERE id = knowledge_sources.chat_id));

CREATE POLICY "Users can update own knowledge sources"
  ON public.knowledge_sources FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM public.chats WHERE id = knowledge_sources.chat_id));

CREATE POLICY "Users can delete own knowledge sources"
  ON public.knowledge_sources FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM public.chats WHERE id = knowledge_sources.chat_id));

CREATE POLICY "Users can view own chunks"
  ON public.chunks FOR SELECT
  USING (
    exists (
      select 1 from public.chats c
      where c.id = chunks.chat_id
        and c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chunks for own sources"
  ON public.chunks FOR INSERT
  WITH CHECK (
    exists (
      select 1
      from public.chats c
      join public.knowledge_sources s on s.chat_id = c.id
      where c.user_id = auth.uid()
        and s.id = chunks.source_id
    )
  );

CREATE POLICY "Users can update own chunks"
  ON public.chunks FOR UPDATE
  USING (
    exists (
      select 1 from public.chats c
      where c.id = chunks.chat_id
        and c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own chunks"
  ON public.chunks FOR DELETE
  USING (
    exists (
      select 1 from public.chats c
      where c.id = chunks.chat_id
        and c.user_id = auth.uid()
    )
  );

CREATE POLICY "Public chat chunks are viewable by everyone"
  ON public.chunks FOR SELECT
  USING (
    exists (
      select 1 from public.chats c
      where c.id = chunks.chat_id
        and c.is_public = true
    )
  );

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email            ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_company_slug     ON public.profiles(company_slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug   ON public.subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user   ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan   ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_chats_user                ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_status              ON public.chats(status);
CREATE INDEX IF NOT EXISTS idx_chats_public              ON public.chats(is_public);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_chat    ON public.knowledge_sources(chat_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_type    ON public.knowledge_sources(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_status  ON public.knowledge_sources(status);
CREATE INDEX IF NOT EXISTS idx_chunks_chat               ON public.chunks(chat_id);
CREATE INDEX IF NOT EXISTS idx_chunks_source             ON public.chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_chunks_page               ON public.chunks(page);
CREATE INDEX IF NOT EXISTS idx_chunks_kind               ON public.chunks(kind);

-- ANN para textos (incluye descripciones de imágenes y 'plain' de tablas)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON public.chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100)
  WHERE embedding IS NOT NULL;

-- ====== Índices extra para metadatos útiles ======

-- Tablas
CREATE INDEX IF NOT EXISTS idx_chunks_meta_table_id
  ON public.chunks ( (meta->>'table_id') )
  WHERE kind = 'table';

-- (opcional) versión textual de la tabla, si se usara como JSON:
-- CREATE INDEX IF NOT EXISTS idx_chunks_meta_plain
--   ON public.chunks USING GIN ( (meta->'plain') )
--   WHERE kind = 'table';

-- Imágenes: tags/objects/ocr_text para img_text también
CREATE INDEX IF NOT EXISTS idx_chunks_meta_tags_gin
  ON public.chunks USING GIN ( (meta->'tags') )
  WHERE kind IN ('text','img_text');

CREATE INDEX IF NOT EXISTS idx_chunks_meta_objects_gin
  ON public.chunks USING GIN ( (meta->'objects') )
  WHERE kind IN ('text','img_text');

CREATE INDEX IF NOT EXISTS idx_chunks_meta_ocr_text
  ON public.chunks ( (meta->>'ocr_text') )
  WHERE kind IN ('text','img_text');

-- Lookup rápido por image_uid (id lógico de imagen del extractor)
CREATE INDEX IF NOT EXISTS idx_chunks_meta_image_uid
  ON public.chunks ( (meta->>'image_uid') )
  WHERE kind = 'img_text';

-- Orden natural de lectura por Y de bbox (útil para listar por página)
CREATE INDEX IF NOT EXISTS idx_chunks_meta_bbox_y
  ON public.chunks ( ((meta->'bbox'->>1)::float8) )
  WHERE kind IN ('img_text','table');

-- (opcional) acceso rápido a imágenes por chat/source/página
CREATE INDEX IF NOT EXISTS idx_chunks_img_lookup
  ON public.chunks (chat_id, source_id, page)
  WHERE kind = 'img_text';

-- =============================================
-- SEED: PLANS
-- =============================================
INSERT INTO public.subscription_plans
  (name, slug, description, price_monthly, price_yearly, max_chats, max_messages_per_month,
   max_characters, max_file_uploads, custom_domain, remove_branding, api_access, priority_support,
   analytics, is_active, is_popular, sort_order)
VALUES
  ('Free','free','Perfect for trying out Chatbase',
    0,0, 1,20, 400000,1, false,false,false,false,false, true,false,1),
  ('Hobby','hobby','For personal projects and small websites',
    1900,19000, 2,2000, 11000000,10, false,true,true,false,true, true,false,2),
  ('Standard','standard','For growing businesses',
    9900,99000, 5,10000, 30000000,50, true,true,true,true,true, true,true,3),
  ('Unlimited','unlimited','For large businesses and agencies',
    39900,399000, 40,40000, 50000000,1000, true,true,true,true,true, true,false,4)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly  = EXCLUDED.price_yearly,
  max_chats = EXCLUDED.max_chats,
  max_messages_per_month = EXCLUDED.max_messages_per_month,
  max_characters = EXCLUDED.max_characters,
  max_file_uploads = EXCLUDED.max_file_uploads,
  custom_domain = EXCLUDED.custom_domain,
  remove_branding = EXCLUDED.remove_branding,
  api_access = EXCLUDED.api_access,
  priority_support = EXCLUDED.priority_support,
  analytics = EXCLUDED.analytics,
  is_active = EXCLUDED.is_active,
  is_popular = EXCLUDED.is_popular,
  sort_order = EXCLUDED.sort_order,
  updated_at = CURRENT_TIMESTAMP;

-- =============================================
-- GRANTS (FIX para permission denied)
-- =============================================
GRANT USAGE ON SCHEMA public     TO anon, authenticated;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles            TO anon, authenticated;
GRANT SELECT                        ON TABLE public.subscription_plans   TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_subscriptions  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chats               TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.knowledge_sources   TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chunks              TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;