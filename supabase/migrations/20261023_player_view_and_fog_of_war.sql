-- ==============================================================================
-- GRIMÓRIO NARRADOR - V5: MIGRAÇÃO PARA VISÃO DO JOGADOR & NÉVOA DE GUERRA
-- ==============================================================================

-- 0. Função utilitária para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ------------------------------------------------------------------------------
-- PARTE 1: SISTEMA DE PAPÉIS (PROFILES / USERS)
-- ------------------------------------------------------------------------------

-- 1.1 Adiciona a coluna 'role' na tabela profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'player' 
  CHECK (role IN ('narrator', 'player'));

-- 1.2 Função SECURITY DEFINER para checar se o usuário atual é Narrador
CREATE OR REPLACE FUNCTION public.is_narrator()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE id = auth.uid() 
      AND role = 'narrator'
  );
$$;

-- 1.3 Função para checar o papel atual do usuário
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'player'
  );
$$;

-- 1.4 Gatilho de segurança contra escalação de privilégios
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_narrator() THEN
    RAISE EXCEPTION 'Apenas Narradores podem alterar o papel de um usuário.';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_protect_profile_role'
  ) THEN
    CREATE TRIGGER tr_protect_profile_role
      BEFORE UPDATE OF role ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.protect_profile_role();
  END IF;
END $$;

-- 1.5 Atualiza a função de cadastro automático de usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'player')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    avatar_url = EXCLUDED.avatar_url,
    role = COALESCE(public.profiles.role, EXCLUDED.role);
  RETURN NEW;
END;
$$;

-- 1.6 Políticas RLS para a tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Narrator full access on profiles'
  ) THEN
    CREATE POLICY "Narrator full access on profiles"
      ON public.profiles FOR ALL
      TO authenticated
      USING (public.is_narrator())
      WITH CHECK (public.is_narrator());
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- PARTE 2: TABELA DE PERSONAGENS (PLAYERS / COTERIE) & OWNERSHIP
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  character_name TEXT NOT NULL,
  player_name TEXT,
  clan TEXT,
  sire TEXT,
  generation INTEGER,
  hunger INTEGER NOT NULL DEFAULT 0 CHECK (hunger >= 0 AND hunger <= 5),
  humanity INTEGER NOT NULL DEFAULT 7 CHECK (humanity >= 0 AND humanity <= 10),
  health_max INTEGER NOT NULL DEFAULT 7,
  health_current INTEGER NOT NULL DEFAULT 7,
  willpower_max INTEGER NOT NULL DEFAULT 5,
  willpower_current INTEGER NOT NULL DEFAULT 5,
  human_history TEXT,
  embrace_story TEXT,
  disciplines TEXT,
  merits TEXT,
  flaws TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.players 
  ADD COLUMN IF NOT EXISTS player_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_players_updated_at'
  ) THEN
    CREATE TRIGGER update_players_updated_at 
      BEFORE UPDATE ON public.players 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Narrators have full access to players'
  ) THEN
    CREATE POLICY "Narrators have full access to players"
      ON public.players FOR ALL
      TO authenticated
      USING (public.is_narrator())
      WITH CHECK (public.is_narrator());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Players can view own character'
  ) THEN
    CREATE POLICY "Players can view own character"
      ON public.players FOR SELECT
      TO authenticated
      USING (player_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Players can update own character'
  ) THEN
    CREATE POLICY "Players can update own character"
      ON public.players FOR UPDATE
      TO authenticated
      USING (player_id = auth.uid())
      WITH CHECK (player_id = auth.uid());
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- PARTE 3: TABELAS DE LORE / CAMPANHA & NÉVOA DE GUERRA (IS_PUBLIC)
-- ------------------------------------------------------------------------------

-- 3.1 NPCs
CREATE TABLE IF NOT EXISTS public.npcs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  species_faction TEXT,
  clan TEXT,
  status TEXT NOT NULL DEFAULT 'Vivo' CHECK (status IN ('Vivo', 'Morte Final')),
  appearance TEXT,
  history TEXT,
  motivations TEXT,
  master_secrets TEXT,
  physical_pool INTEGER DEFAULT 4,
  social_pool INTEGER DEFAULT 4,
  mental_pool INTEGER DEFAULT 4,
  specialties TEXT,
  blood_potency INTEGER DEFAULT 0,
  disciplines TEXT,
  health INTEGER DEFAULT 7,
  image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.npcs ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- 3.2 Locais / Atlas
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Santuário' CHECK (type IN ('Santuário', 'Zona de Guerra', 'Elysium', 'Refúgio', 'Território')),
  description_public TEXT,
  master_secrets TEXT,
  controller_npc_id UUID REFERENCES public.npcs(id) ON DELETE SET NULL,
  image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- 3.3 Itens / Arsenal
CREATE TABLE IF NOT EXISTS public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Artefato Místico' CHECK (category IN ('Arma', 'Ferramenta de Investigação', 'Artefato Místico', 'Documento')),
  description TEXT,
  rules_bonus TEXT,
  owner_type TEXT CHECK (owner_type IN ('player', 'npc', 'location')),
  owner_id UUID,
  image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- 3.4 Ocultismo / Mitos
CREATE TABLE IF NOT EXISTS public.myths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  mortal_vision TEXT,
  supernatural_vision TEXT,
  hidden_truth TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.myths ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- 3.5 Diário / Sessões
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  summary TEXT,
  notes TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- 3.6 Teia de Intrigas / Relacionamentos
CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (source_type IN ('player', 'npc')),
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('player', 'npc')),
  target_id UUID NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'aliado' CHECK (relationship_type IN ('aliado', 'inimigo', 'vínculo de sangue', 'neutro')),
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.relationships ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- 3.7 Dívidas / Boons
CREATE TABLE IF NOT EXISTS public.boons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'minor' CHECK (type IN ('trivial', 'minor', 'major', 'life')),
  from_name TEXT NOT NULL,
  to_name TEXT NOT NULL,
  description TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.boons ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- 3.8 Rumores / Quests / Plots
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'investigacao',
  status TEXT NOT NULL DEFAULT 'Em Andamento',
  client TEXT,
  assigned_to TEXT,
  description TEXT,
  loot TEXT,
  fallout TEXT,
  category TEXT DEFAULT 'side',
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;


-- ------------------------------------------------------------------------------
-- PARTE 4: APLICAÇÃO DE RLS PARA TABELAS DE LORE / NÉVOA DE GUERRA
-- ------------------------------------------------------------------------------

ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.myths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- 4.1 NPCS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'npcs' AND policyname = 'Narrator full access on npcs') THEN
    CREATE POLICY "Narrator full access on npcs" ON public.npcs FOR ALL TO authenticated
      USING (public.is_narrator()) WITH CHECK (public.is_narrator());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'npcs' AND policyname = 'Players can view public npcs') THEN
    CREATE POLICY "Players can view public npcs" ON public.npcs FOR SELECT TO authenticated
      USING (is_public = true);
  END IF;

  -- 4.2 LOCATIONS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'locations' AND policyname = 'Narrator full access on locations') THEN
    CREATE POLICY "Narrator full access on locations" ON public.locations FOR ALL TO authenticated
      USING (public.is_narrator()) WITH CHECK (public.is_narrator());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'locations' AND policyname = 'Players can view public locations') THEN
    CREATE POLICY "Players can view public locations" ON public.locations FOR SELECT TO authenticated
      USING (is_public = true);
  END IF;

  -- 4.3 ITEMS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'Narrator full access on items') THEN
    CREATE POLICY "Narrator full access on items" ON public.items FOR ALL TO authenticated
      USING (public.is_narrator()) WITH CHECK (public.is_narrator());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'Players can view public items') THEN
    CREATE POLICY "Players can view public items" ON public.items FOR SELECT TO authenticated
      USING (is_public = true);
  END IF;

  -- 4.4 MYTHS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'myths' AND policyname = 'Narrator full access on myths') THEN
    CREATE POLICY "Narrator full access on myths" ON public.myths FOR ALL TO authenticated
      USING (public.is_narrator()) WITH CHECK (public.is_narrator());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'myths' AND policyname = 'Players can view public myths') THEN
    CREATE POLICY "Players can view public myths" ON public.myths FOR SELECT TO authenticated
      USING (is_public = true);
  END IF;

  -- 4.5 SESSIONS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'Narrator full access on sessions') THEN
    CREATE POLICY "Narrator full access on sessions" ON public.sessions FOR ALL TO authenticated
      USING (public.is_narrator()) WITH CHECK (public.is_narrator());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'Players can view public sessions') THEN
    CREATE POLICY "Players can view public sessions" ON public.sessions FOR SELECT TO authenticated
      USING (is_public = true);
  END IF;

  -- 4.6 RELATIONSHIPS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relationships' AND policyname = 'Narrator full access on relationships') THEN
    CREATE POLICY "Narrator full access on relationships" ON public.relationships FOR ALL TO authenticated
      USING (public.is_narrator()) WITH CHECK (public.is_narrator());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relationships' AND policyname = 'Players can view public relationships') THEN
    CREATE POLICY "Players can view public relationships" ON public.relationships FOR SELECT TO authenticated
      USING (is_public = true);
  END IF;

  -- 4.7 BOONS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'boons' AND policyname = 'Narrator full access on boons') THEN
    CREATE POLICY "Narrator full access on boons" ON public.boons FOR ALL TO authenticated
      USING (public.is_narrator()) WITH CHECK (public.is_narrator());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'boons' AND policyname = 'Players can view public boons') THEN
    CREATE POLICY "Players can view public boons" ON public.boons FOR SELECT TO authenticated
      USING (is_public = true);
  END IF;

  -- 4.8 QUESTS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quests' AND policyname = 'Narrator full access on quests') THEN
    CREATE POLICY "Narrator full access on quests" ON public.quests FOR ALL TO authenticated
      USING (public.is_narrator()) WITH CHECK (public.is_narrator());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quests' AND policyname = 'Players can view public quests') THEN
    CREATE POLICY "Players can view public quests" ON public.quests FOR SELECT TO authenticated
      USING (is_public = true);
  END IF;
END $$;
