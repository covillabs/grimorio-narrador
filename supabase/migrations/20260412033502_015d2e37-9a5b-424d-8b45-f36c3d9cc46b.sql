
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on players" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.npcs (
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on npcs" ON public.npcs FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_npcs_updated_at BEFORE UPDATE ON public.npcs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Artefato Místico' CHECK (category IN ('Arma', 'Ferramenta de Investigação', 'Artefato Místico', 'Documento')),
  description TEXT,
  rules_bonus TEXT,
  owner_type TEXT CHECK (owner_type IN ('player', 'npc', 'location')),
  owner_id UUID,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on items" ON public.items FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Santuário' CHECK (type IN ('Santuário', 'Zona de Guerra', 'Elysium', 'Refúgio', 'Território')),
  description_public TEXT,
  master_secrets TEXT,
  controller_npc_id UUID REFERENCES public.npcs(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on locations" ON public.locations FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.myths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  mortal_vision TEXT,
  supernatural_vision TEXT,
  hidden_truth TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.myths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on myths" ON public.myths FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_myths_updated_at BEFORE UPDATE ON public.myths FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.myth_discoveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  myth_id UUID NOT NULL REFERENCES public.myths(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (myth_id, player_id)
);
ALTER TABLE public.myth_discoveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on myth_discoveries" ON public.myth_discoveries FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  summary TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.session_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('player', 'npc', 'item', 'location')),
  entity_id UUID NOT NULL
);
ALTER TABLE public.session_mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on session_mentions" ON public.session_mentions FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (source_type IN ('player', 'npc')),
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('player', 'npc')),
  target_id UUID NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'aliado' CHECK (relationship_type IN ('aliado', 'inimigo', 'vínculo de sangue', 'neutro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on relationships" ON public.relationships FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.player_touchstones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  npc_id UUID NOT NULL REFERENCES public.npcs(id) ON DELETE CASCADE,
  description TEXT,
  UNIQUE (player_id, npc_id)
);
ALTER TABLE public.player_touchstones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on player_touchstones" ON public.player_touchstones FOR ALL USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('grimorio-media', 'grimorio-media', true);
CREATE POLICY "Public read grimorio-media" ON storage.objects FOR SELECT USING (bucket_id = 'grimorio-media');
CREATE POLICY "Anyone can upload grimorio-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'grimorio-media');
CREATE POLICY "Anyone can update grimorio-media" ON storage.objects FOR UPDATE USING (bucket_id = 'grimorio-media');
CREATE POLICY "Anyone can delete grimorio-media" ON storage.objects FOR DELETE USING (bucket_id = 'grimorio-media');
