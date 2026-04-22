-- Tabela Universal para Sincronização de Dados do Narrador
-- Esta tabela armazena chaves/valores simulando o localStorage na nuvem.

CREATE TABLE IF NOT EXISTS public.narrator_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data_key TEXT NOT NULL,
    data_value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, data_key)
);

-- Habilitando Row Level Security (RLS)
ALTER TABLE public.narrator_data ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver e editar seus próprios dados
CREATE POLICY "Users can only access their own data"
    ON public.narrator_data
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_narrator_data_updated_at
    BEFORE UPDATE ON public.narrator_data
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
