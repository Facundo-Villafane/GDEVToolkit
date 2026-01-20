-- =============================================================================
-- MIGRACION: Agregar tabla user_engines para sistema de niveles de motores
-- =============================================================================

-- Crear tabla de motores por usuario (similar a user_skills)
CREATE TABLE IF NOT EXISTS public.user_engines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    engine_key VARCHAR(50) NOT NULL, -- 'unity', 'godot', 'unreal', etc.
    custom_name VARCHAR(100), -- Para motores custom (cuando engine_key = 'other')
    level skill_level DEFAULT 'intermediate',
    is_primary BOOLEAN DEFAULT FALSE, -- Motor principal
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, engine_key, custom_name)
);

-- Indice para buscar motores por usuario
CREATE INDEX IF NOT EXISTS idx_user_engines_user ON public.user_engines(user_id);
CREATE INDEX IF NOT EXISTS idx_user_engines_engine ON public.user_engines(engine_key);

-- Habilitar RLS
ALTER TABLE public.user_engines ENABLE ROW LEVEL SECURITY;

-- Policies para user_engines (similar a user_skills)
CREATE POLICY "Engines visibles para todos" ON public.user_engines
    FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden gestionar sus engines" ON public.user_engines
    FOR ALL USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_user_engines_updated_at BEFORE UPDATE ON public.user_engines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrar datos existentes de preferred_engine a user_engines
INSERT INTO public.user_engines (user_id, engine_key, custom_name, level, is_primary)
SELECT
    id as user_id,
    CASE
        WHEN preferred_engine::text LIKE 'other:%' THEN 'other'
        WHEN preferred_engine IS NOT NULL THEN preferred_engine::text
        ELSE NULL
    END as engine_key,
    CASE
        WHEN preferred_engine::text LIKE 'other:%' THEN substring(preferred_engine::text from 7)
        ELSE NULL
    END as custom_name,
    'intermediate' as level,
    TRUE as is_primary
FROM public.profiles
WHERE preferred_engine IS NOT NULL
ON CONFLICT DO NOTHING;
