-- ==============================================================================
-- GRIMÓRIO NARRADOR: PIVOT MULTI-CRÔNICAS, CONVITES E SAGUÃO (LOBBY)
-- ==============================================================================

-- 1. TABELA DE CRÔNICAS
CREATE TABLE IF NOT EXISTS public.chronicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  narrator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. MEMBROS DA CRÔNICA (VÍNCULO USER <-> CRÔNICA)
CREATE TABLE IF NOT EXISTS public.chronicle_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chronicle_id UUID REFERENCES public.chronicles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('narrator', 'player')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chronicle_id, user_id)
);

-- 3. EXPANSÃO DA TABELA DE PERSONAGENS (PLAYERS / COTERIE)
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS chronicle_id UUID REFERENCES public.chronicles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_password TEXT;

-- 4. VÍNCULO DE CRÔNICA NAS TABELAS DE LORE / NÉVOA DE GUERRA
ALTER TABLE public.npcs ADD COLUMN IF NOT EXISTS chronicle_id UUID REFERENCES public.chronicles(id) ON DELETE CASCADE;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS chronicle_id UUID REFERENCES public.chronicles(id) ON DELETE CASCADE;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS chronicle_id UUID REFERENCES public.chronicles(id) ON DELETE CASCADE;
ALTER TABLE public.myths ADD COLUMN IF NOT EXISTS chronicle_id UUID REFERENCES public.chronicles(id) ON DELETE CASCADE;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS chronicle_id UUID REFERENCES public.chronicles(id) ON DELETE CASCADE;
ALTER TABLE public.relationships ADD COLUMN IF NOT EXISTS chronicle_id UUID REFERENCES public.chronicles(id) ON DELETE CASCADE;
ALTER TABLE public.boons ADD COLUMN IF NOT EXISTS chronicle_id UUID REFERENCES public.chronicles(id) ON DELETE CASCADE;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS chronicle_id UUID REFERENCES public.chronicles(id) ON DELETE CASCADE;

-- 5. FUNÇÕES DE SEGURANÇA POR CRÔNICA (SECURITY DEFINER)

CREATE OR REPLACE FUNCTION public.is_chronicle_narrator(p_chronicle_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chronicles c
    WHERE c.id = p_chronicle_id 
      AND (
        c.narrator_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.chronicle_members cm 
          WHERE cm.chronicle_id = p_chronicle_id 
            AND cm.user_id = auth.uid() 
            AND cm.role = 'narrator'
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_chronicle_member(p_chronicle_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chronicle_members cm
    WHERE cm.chronicle_id = p_chronicle_id 
      AND cm.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.chronicles c
    WHERE c.id = p_chronicle_id
      AND c.narrator_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_narrator()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chronicle_members cm
    WHERE cm.user_id = auth.uid() 
      AND cm.role = 'narrator'
  ) OR EXISTS (
    SELECT 1 FROM public.chronicles c
    WHERE c.narrator_id = auth.uid()
  );
$$;

-- 6. RPC: CRIAR NOVA CRÔNICA (ATÔMICA)
CREATE OR REPLACE FUNCTION public.create_chronicle(
  p_name TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_chronicle_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  INSERT INTO public.chronicles (name, narrator_id, description)
  VALUES (p_name, v_user_id, p_description)
  RETURNING id INTO v_chronicle_id;

  INSERT INTO public.chronicle_members (chronicle_id, user_id, role)
  VALUES (v_chronicle_id, v_user_id, 'narrator')
  ON CONFLICT (chronicle_id, user_id) DO UPDATE SET role = 'narrator';

  RETURN jsonb_build_object(
    'success', true,
    'chronicle_id', v_chronicle_id,
    'name', p_name
  );
END;
$$;

-- 7. RPC: RESGATAR FICHA VIA CONVITE (ONBOARDING DO SAGUÃO)
CREATE OR REPLACE FUNCTION public.claim_player_invite(
  p_invite_token TEXT,
  p_invite_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_player RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  SELECT * INTO v_player
  FROM public.players
  WHERE invite_token = trim(p_invite_token);

  IF v_player.id IS NULL THEN
    RAISE EXCEPTION 'Convite não encontrado ou token inválido.';
  END IF;

  IF v_player.invite_password IS NOT NULL AND v_player.invite_password <> '' THEN
    IF trim(COALESCE(p_invite_password, '')) <> trim(v_player.invite_password) THEN
      RAISE EXCEPTION 'Senha da ficha incorreta.';
    END IF;
  END IF;

  IF v_player.player_id IS NOT NULL AND v_player.player_id <> v_user_id THEN
    RAISE EXCEPTION 'Este personagem já foi assumido por outro membro da mesa.';
  END IF;

  UPDATE public.players
  SET player_id = v_user_id,
      updated_at = now()
  WHERE id = v_player.id;

  IF v_player.chronicle_id IS NOT NULL THEN
    INSERT INTO public.chronicle_members (chronicle_id, user_id, role)
    VALUES (v_player.chronicle_id, v_user_id, 'player')
    ON CONFLICT (chronicle_id, user_id) 
    DO UPDATE SET role = 'player';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'player_id', v_player.id,
    'character_name', v_player.character_name,
    'chronicle_id', v_player.chronicle_id
  );
END;
$$;

-- 8. POLÍTICAS DE RLS PARA CHRONICLES E CHRONICLE_MEMBERS
ALTER TABLE public.chronicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicle_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chronicles' AND policyname = 'Members can view chronicles') THEN
    CREATE POLICY "Members can view chronicles"
      ON public.chronicles FOR SELECT
      TO authenticated
      USING (narrator_id = auth.uid() OR public.is_chronicle_member(id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chronicles' AND policyname = 'Authenticated can insert chronicles') THEN
    CREATE POLICY "Authenticated can insert chronicles"
      ON public.chronicles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = narrator_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chronicles' AND policyname = 'Narrator can update chronicles') THEN
    CREATE POLICY "Narrator can update chronicles"
      ON public.chronicles FOR UPDATE
      TO authenticated
      USING (narrator_id = auth.uid())
      WITH CHECK (narrator_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chronicles' AND policyname = 'Narrator can delete chronicles') THEN
    CREATE POLICY "Narrator can delete chronicles"
      ON public.chronicles FOR DELETE
      TO authenticated
      USING (narrator_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chronicle_members' AND policyname = 'Members can view members of their chronicle') THEN
    CREATE POLICY "Members can view members of their chronicle"
      ON public.chronicle_members FOR SELECT
      TO authenticated
      USING (user_id = auth.uid() OR public.is_chronicle_member(chronicle_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chronicle_members' AND policyname = 'Narrators can manage chronicle members') THEN
    CREATE POLICY "Narrators can manage chronicle members"
      ON public.chronicle_members FOR ALL
      TO authenticated
      USING (public.is_chronicle_narrator(chronicle_id))
      WITH CHECK (public.is_chronicle_narrator(chronicle_id));
  END IF;
END $$;
