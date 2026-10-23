-- =====================================================================
-- Grimório Narrador — Trava do Narrador + INSERT do Jogador + Realtime
--                     + Correções de segurança (escopo por crônica)
-- Tabela alvo: public.players
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Colunas novas
--    is_locked  : trava de edição controlada pelo Narrador
--    sheet_data : ficha V5 completa (atributos, perícias, disciplinas,
--                 vantagens, convicções, dano...). As colunas escalares
--                 (hunger, humanity, health_*, willpower_*) continuam
--                 sendo a fonte da verdade para os trackers rápidos.
-- ---------------------------------------------------------------------
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS sheet_data JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.players.is_locked IS
  'Quando true, o jogador dono da ficha não pode editá-la (apenas o Narrador).';
COMMENT ON COLUMN public.players.sheet_data IS
  'Ficha V5 completa serializada (atributos, perícias, disciplinas, vantagens, convicções).';

-- Backfill: copia a ficha completa do blob legado narrator_data (v5_coterie)
-- para as linhas já existentes em players, respeitando o narrador da crônica.
UPDATE public.players p
SET sheet_data = e.elem
FROM public.narrator_data nd
JOIN public.chronicles c ON c.narrator_id = nd.user_id
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(nd.data_value) = 'array' THEN nd.data_value ELSE '[]'::jsonb END
) AS e(elem)
WHERE nd.data_key LIKE '%v5_coterie'
  AND (e.elem ->> 'id') = p.id::text
  AND c.id = p.chronicle_id
  AND p.sheet_data = '{}'::jsonb;

-- ---------------------------------------------------------------------
-- 2. [SEGURANÇA] Narrador: acesso total SOMENTE às fichas da(s) sua(s)
--    crônica(s). Substitui o is_narrator() global (vazamento entre mesas).
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Narrators have full access to players" ON public.players;
DROP POLICY IF EXISTS "Chronicle narrators have full access to players" ON public.players;

CREATE POLICY "Chronicle narrators have full access to players"
  ON public.players
  FOR ALL
  TO authenticated
  USING (public.is_chronicle_narrator(chronicle_id))
  WITH CHECK (public.is_chronicle_narrator(chronicle_id));

-- ---------------------------------------------------------------------
-- 3. UPDATE do jogador: somente a própria ficha E destravada
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Players can update own character" ON public.players;
DROP POLICY IF EXISTS "Players can update own unlocked character" ON public.players;

CREATE POLICY "Players can update own unlocked character"
  ON public.players
  FOR UPDATE
  TO authenticated
  USING (
    player_id = auth.uid()
    AND is_locked = false
  )
  WITH CHECK (
    player_id = auth.uid()
    AND is_locked = false
  );

-- ---------------------------------------------------------------------
-- 4. INSERT do jogador: player_id = ele mesmo e membro da crônica
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Players can insert own character" ON public.players;

CREATE POLICY "Players can insert own character"
  ON public.players
  FOR INSERT
  TO authenticated
  WITH CHECK (
    player_id = auth.uid()
    AND is_locked = false
    AND chronicle_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.chronicle_members cm
      WHERE cm.chronicle_id = players.chronicle_id
        AND cm.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 5. Guarda de colunas protegidas (RLS não compara OLD x NEW)
--    Impede que um não-narrador altere is_locked ou mova a ficha para
--    outra crônica — inclusive via RPCs SECURITY DEFINER.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_players_protected_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- service_role / SQL Editor (sem JWT de usuário) passam direto
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Narrador da crônica da ficha pode tudo
  IF public.is_chronicle_narrator(OLD.chronicle_id) THEN
    RETURN NEW;
  END IF;

  IF NEW.is_locked IS DISTINCT FROM OLD.is_locked THEN
    RAISE EXCEPTION 'Apenas o Narrador pode travar/destravar uma ficha.'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.chronicle_id IS DISTINCT FROM OLD.chronicle_id THEN
    RAISE EXCEPTION 'Não é permitido mover a ficha para outra crônica.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_players_protected_columns ON public.players;
CREATE TRIGGER guard_players_protected_columns
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_players_protected_columns();

-- ---------------------------------------------------------------------
-- 6. [SEGURANÇA] unlink_player_invite: apenas o Narrador da crônica
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.unlink_player_invite(p_character_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_chronicle_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  SELECT chronicle_id INTO v_chronicle_id
  FROM public.players
  WHERE id = p_character_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ficha não encontrada.';
  END IF;

  IF v_chronicle_id IS NULL OR NOT public.is_chronicle_narrator(v_chronicle_id) THEN
    RAISE EXCEPTION 'Apenas o Narrador desta crônica pode desvincular jogadores.'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.players
  SET player_id = NULL,
      updated_at = now()
  WHERE id = p_character_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.unlink_player_invite(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unlink_player_invite(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 7. [SEGURANÇA] save_player_invite: apenas o Narrador da crônica
--    Antes: qualquer usuário autenticado podia sobrescrever QUALQUER
--    ficha por id (ON CONFLICT DO UPDATE em SECURITY DEFINER), furando
--    RLS e a trava is_locked. Assinatura mantida (frontend inalterado).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_player_invite(
  p_character_id uuid,
  p_character_name text,
  p_clan text DEFAULT NULL::text,
  p_sire text DEFAULT NULL::text,
  p_generation integer DEFAULT 13,
  p_hunger integer DEFAULT 0,
  p_humanity integer DEFAULT 7,
  p_health_max integer DEFAULT 7,
  p_health_current integer DEFAULT 7,
  p_willpower_max integer DEFAULT 5,
  p_willpower_current integer DEFAULT 5,
  p_chronicle_id uuid DEFAULT NULL::uuid,
  p_invite_token text DEFAULT NULL::text,
  p_invite_password text DEFAULT NULL::text,
  p_image_url text DEFAULT NULL::text,
  p_disciplines text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_target_chronicle_id UUID := p_chronicle_id;
  v_existing_chronicle_id UUID;
  v_clean_token TEXT;
  v_clean_password TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  -- Se não informou crônica ou veio nula, busca a primeira crônica onde o usuário é narrador
  IF v_target_chronicle_id IS NULL THEN
    SELECT id INTO v_target_chronicle_id
    FROM public.chronicles
    WHERE narrator_id = v_user_id
    LIMIT 1;

    -- Se o narrador não tiver nenhuma crônica, cria uma crônica automaticamente
    IF v_target_chronicle_id IS NULL THEN
      INSERT INTO public.chronicles (name, narrator_id, description)
      VALUES ('Grimório da Noite', v_user_id, 'Crônica Principal dos Membros')
      RETURNING id INTO v_target_chronicle_id;

      INSERT INTO public.chronicle_members (chronicle_id, user_id, role)
      VALUES (v_target_chronicle_id, v_user_id, 'narrator')
      ON CONFLICT (chronicle_id, user_id) DO NOTHING;
    END IF;
  END IF;

  -- Autorização: precisa ser Narrador da crônica de destino
  IF NOT public.is_chronicle_narrator(v_target_chronicle_id) THEN
    RAISE EXCEPTION 'Apenas o Narrador desta crônica pode gerar convites.'
      USING ERRCODE = '42501';
  END IF;

  -- Autorização: se a ficha já existe, precisa ser Narrador da crônica atual dela
  SELECT chronicle_id INTO v_existing_chronicle_id
  FROM public.players
  WHERE id = p_character_id;

  IF FOUND AND v_existing_chronicle_id IS NOT NULL
     AND NOT public.is_chronicle_narrator(v_existing_chronicle_id) THEN
    RAISE EXCEPTION 'Esta ficha pertence a outra crônica.'
      USING ERRCODE = '42501';
  END IF;

  v_clean_token := UPPER(trim(p_invite_token));
  IF v_clean_token IS NULL OR v_clean_token = '' THEN
    RAISE EXCEPTION 'O código de convite não pode ser vazio.';
  END IF;

  v_clean_password := trim(p_invite_password);
  IF v_clean_password = '' THEN
    v_clean_password := NULL;
  END IF;

  INSERT INTO public.players (
    id, character_name, clan, sire, generation, hunger, humanity,
    health_max, health_current, willpower_max, willpower_current,
    chronicle_id, invite_token, invite_password, image_url, disciplines, updated_at
  )
  VALUES (
    p_character_id, p_character_name, p_clan, p_sire, p_generation, p_hunger, p_humanity,
    p_health_max, p_health_current, p_willpower_max, p_willpower_current,
    v_target_chronicle_id, v_clean_token, v_clean_password, p_image_url, p_disciplines, now()
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
$function$;

REVOKE ALL ON FUNCTION public.save_player_invite(
  uuid, text, text, text, integer, integer, integer, integer, integer,
  integer, integer, uuid, text, text, text, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_player_invite(
  uuid, text, text, text, integer, integer, integer, integer, integer,
  integer, integer, uuid, text, text, text, text
) TO authenticated;

-- ---------------------------------------------------------------------
-- 8. Realtime: publicar a tabela players
--    postgres_changes respeita a policy de SELECT -> jogador só recebe
--    eventos da própria ficha; narrador recebe as da sua crônica.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
  END IF;
END;
$$;

COMMIT;
