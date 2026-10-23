-- Migração: Correção e Blindagem do Sistema de Convites e Vínculo de Jogador
-- Data: 2026-10-23

-- 1. Permite execuções administrativas no trigger de perfis
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_narrator() THEN
    RAISE EXCEPTION 'Apenas Narradores podem alterar o papel de um usuário.';
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Atualizar a função is_narrator() para considerar também profiles.role = 'narrator'
CREATE OR REPLACE FUNCTION public.is_narrator()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chronicle_members cm
    WHERE cm.user_id = auth.uid() 
      AND cm.role = 'narrator'
  ) OR EXISTS (
    SELECT 1 FROM public.chronicles c
    WHERE c.narrator_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'narrator'
  );
$$;

-- 3. RPC save_player_invite (SECURITY DEFINER para contornar gargalos de RLS no onboarding)
CREATE OR REPLACE FUNCTION public.save_player_invite(
  p_character_id UUID,
  p_character_name TEXT,
  p_clan TEXT DEFAULT NULL,
  p_sire TEXT DEFAULT NULL,
  p_generation INT DEFAULT 13,
  p_hunger INT DEFAULT 0,
  p_humanity INT DEFAULT 7,
  p_health_max INT DEFAULT 7,
  p_health_current INT DEFAULT 7,
  p_willpower_max INT DEFAULT 5,
  p_willpower_current INT DEFAULT 5,
  p_chronicle_id UUID DEFAULT NULL,
  p_invite_token TEXT DEFAULT NULL,
  p_invite_password TEXT DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL,
  p_disciplines TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_target_chronicle_id UUID := p_chronicle_id;
  v_clean_token TEXT;
  v_clean_password TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  -- Se não informou crônica, associa à primeira crônica do narrador ou cria crônica padrão
  IF v_target_chronicle_id IS NULL THEN
    SELECT id INTO v_target_chronicle_id
    FROM public.chronicles
    WHERE narrator_id = v_user_id
    LIMIT 1;

    IF v_target_chronicle_id IS NULL THEN
      INSERT INTO public.chronicles (name, narrator_id, description)
      VALUES ('Grimório da Noite', v_user_id, 'Crônica Principal dos Membros')
      RETURNING id INTO v_target_chronicle_id;

      INSERT INTO public.chronicle_members (chronicle_id, user_id, role)
      VALUES (v_target_chronicle_id, v_user_id, 'narrator')
      ON CONFLICT (chronicle_id, user_id) DO NOTHING;
    END IF;
  END IF;

  v_clean_token := UPPER(trim(p_invite_token));
  IF v_clean_token IS NULL OR v_clean_token = '' THEN
    RAISE EXCEPTION 'O código de convite não pode ser vazio.';
  END IF;

  v_clean_password := trim(p_invite_password);
  IF v_clean_password = '' THEN
    v_clean_password := NULL;
  END IF;

  -- Upsert na tabela public.players
  INSERT INTO public.players (
    id,
    character_name,
    clan,
    sire,
    generation,
    hunger,
    humanity,
    health_max,
    health_current,
    willpower_max,
    willpower_current,
    chronicle_id,
    invite_token,
    invite_password,
    image_url,
    disciplines,
    updated_at
  )
  VALUES (
    p_character_id,
    p_character_name,
    p_clan,
    p_sire,
    p_generation,
    p_hunger,
    p_humanity,
    p_health_max,
    p_health_current,
    p_willpower_max,
    p_willpower_current,
    v_target_chronicle_id,
    v_clean_token,
    v_clean_password,
    p_image_url,
    p_disciplines,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    character_name = EXCLUDED.character_name,
    clan = EXCLUDED.clan,
    sire = EXCLUDED.sire,
    generation = EXCLUDED.generation,
    hunger = EXCLUDED.hunger,
    humanity = EXCLUDED.humanity,
    health_max = EXCLUDED.health_max,
    health_current = EXCLUDED.health_current,
    willpower_max = EXCLUDED.willpower_max,
    willpower_current = EXCLUDED.willpower_current,
    chronicle_id = EXCLUDED.chronicle_id,
    invite_token = EXCLUDED.invite_token,
    invite_password = EXCLUDED.invite_password,
    image_url = EXCLUDED.image_url,
    disciplines = EXCLUDED.disciplines,
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'player_id', p_character_id,
    'character_name', p_character_name,
    'invite_token', v_clean_token,
    'chronicle_id', v_target_chronicle_id
  );
END;
$$;

-- 4. Atualizar claim_player_invite com case-insensitivity
CREATE OR REPLACE FUNCTION public.claim_player_invite(
  p_invite_token text, 
  p_invite_password text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_player RECORD;
  v_token_clean TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  v_token_clean := UPPER(trim(p_invite_token));
  IF v_token_clean IS NULL OR v_token_clean = '' THEN
    RAISE EXCEPTION 'Código de convite inválido.';
  END IF;

  -- 1. Localiza a ficha pelo token (Case-Insensitive)
  SELECT * INTO v_player
  FROM public.players
  WHERE UPPER(trim(invite_token)) = v_token_clean;

  IF v_player.id IS NULL THEN
    RAISE EXCEPTION 'Convite não encontrado ou token inválido.';
  END IF;

  -- 2. Se houver senha na ficha, valida
  IF v_player.invite_password IS NOT NULL AND trim(v_player.invite_password) <> '' THEN
    IF trim(COALESCE(p_invite_password, '')) <> trim(v_player.invite_password) THEN
      RAISE EXCEPTION 'Senha da ficha incorreta.';
    END IF;
  END IF;

  -- 3. Verifica se outro jogador já assumiu esta ficha
  IF v_player.player_id IS NOT NULL AND v_player.player_id <> v_user_id THEN
    RAISE EXCEPTION 'Este personagem já foi assumido por outro membro da mesa.';
  END IF;

  -- 4. Vincula o player_id ao usuário autenticado
  UPDATE public.players
  SET player_id = v_user_id,
      updated_at = now()
  WHERE id = v_player.id;

  -- 5. Se o personagem possui crônica vinculada, insere o usuário como jogador da crônica
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

-- 5. RPC unlink_player_invite
CREATE OR REPLACE FUNCTION public.unlink_player_invite(
  p_character_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  UPDATE public.players
  SET player_id = NULL,
      updated_at = now()
  WHERE id = p_character_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
