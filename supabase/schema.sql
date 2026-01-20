-- =============================================================================
-- DEVHUB DATABASE SCHEMA
-- Portal de Desarrollo Gamificado para Game Developers
-- =============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM ('user', 'pro', 'admin');
CREATE TYPE skill_level AS ENUM ('novice', 'intermediate', 'advanced', 'expert');
CREATE TYPE project_status AS ENUM ('draft', 'active', 'completed', 'archived');
CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE risk_level AS ENUM ('green', 'yellow', 'red');
CREATE TYPE asset_type AS ENUM ('sprite', 'model_3d', 'audio', 'music', 'ui', 'animation', 'shader', 'other');
CREATE TYPE jam_engine AS ENUM ('unity', 'godot', 'unreal', 'pygame', 'phaser', 'gamemaker', 'rpgmaker', 'custom', 'other');

-- =============================================================================
-- TABLAS CORE: SISTEMA DE IDENTIDAD
-- =============================================================================

-- Tabla de perfiles de usuario (extiende auth.users de Supabase)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Informacion basica
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,

    -- Sistema de roles
    role user_role DEFAULT 'user',

    -- Sistema de XP gamificado
    xp_total INTEGER DEFAULT 0,
    xp_level INTEGER DEFAULT 1,

    -- Preferencias
    preferred_engine jam_engine,
    preferred_genres TEXT[],
    timezone VARCHAR(50),

    -- Metadatos
    onboarding_completed BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de habilidades (skills tags)
CREATE TABLE public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de relacion usuario-habilidades
CREATE TABLE public.user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    level skill_level DEFAULT 'intermediate',
    endorsed_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, skill_id)
);

-- Tabla de motores por usuario (con niveles de experiencia)
CREATE TABLE public.user_engines (
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

-- Tabla de historial de XP
CREATE TABLE public.xp_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    source_type VARCHAR(50),
    source_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLAS CORE: PROJECT VAULT
-- =============================================================================

-- Tabla principal de proyectos
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Informacion basica
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url TEXT,

    -- Estado y tipo
    status project_status DEFAULT 'draft',
    is_jam_project BOOLEAN DEFAULT FALSE,

    -- Datos de la Jam (si aplica)
    jam_name VARCHAR(200),
    jam_theme VARCHAR(200),
    jam_start_date TIMESTAMPTZ,
    jam_end_date TIMESTAMPTZ,
    jam_total_hours INTEGER,

    -- Configuracion del proyecto
    engine jam_engine,
    genre VARCHAR(100),
    art_style VARCHAR(100),

    -- Metricas de scope
    scope_score INTEGER,
    risk_level risk_level,

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de contexto del proyecto (GDD, Scope Report, etc.)
CREATE TABLE public.project_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

    -- Context JSON estructurado
    gdd JSONB DEFAULT '{}',
    scope_report JSONB DEFAULT '{}',
    oracle_concepts JSONB DEFAULT '[]',

    -- Preferencias de IA para el proyecto
    ai_preferences JSONB DEFAULT '{}',

    -- Control de versiones del contexto
    version INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(project_id)
);

-- Tabla de miembros del equipo
CREATE TABLE public.project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Para miembros que no estan en el portal
    external_name VARCHAR(100),
    external_role VARCHAR(100),

    -- Nivel de habilidad (para calculo de scope)
    skill_level skill_level DEFAULT 'intermediate',

    -- Roles asignados
    roles TEXT[],

    -- Permisos
    can_edit BOOLEAN DEFAULT FALSE,
    can_manage BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT member_identity CHECK (user_id IS NOT NULL OR external_name IS NOT NULL)
);

-- =============================================================================
-- TABLAS: SMART KANBAN (TAREAS)
-- =============================================================================

CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

    -- Informacion de la tarea
    title VARCHAR(300) NOT NULL,
    description TEXT,

    -- Estado y prioridad
    status task_status DEFAULT 'backlog',
    priority task_priority DEFAULT 'medium',

    -- Asignacion
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    role_required VARCHAR(50),

    -- Estimaciones
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),

    -- Generado por IA
    is_ai_generated BOOLEAN DEFAULT FALSE,
    ai_suggestion TEXT,
    ai_risk_flag BOOLEAN DEFAULT FALSE,

    -- Orden en el tablero
    position INTEGER DEFAULT 0,

    -- Dependencias
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,

    -- Metadatos
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Etiquetas para tareas
CREATE TABLE public.task_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',

    UNIQUE(project_id, name)
);

-- Relacion tareas-etiquetas
CREATE TABLE public.task_tag_assignments (
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.task_tags(id) ON DELETE CASCADE,

    PRIMARY KEY (task_id, tag_id)
);

-- =============================================================================
-- TABLAS: ASSET MANIFEST
-- =============================================================================

CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

    -- Informacion del asset
    name VARCHAR(200) NOT NULL,
    type asset_type NOT NULL,
    description TEXT,

    -- Especificaciones tecnicas
    technical_spec JSONB DEFAULT '{}',

    -- Prompts para generacion
    ai_prompt TEXT,
    style_reference TEXT,

    -- Estado
    is_completed BOOLEAN DEFAULT FALSE,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Prioridad
    is_mvp BOOLEAN DEFAULT TRUE,
    priority task_priority DEFAULT 'medium',

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLAS: AI CONTEXT LAYER
-- =============================================================================

-- Preferencias globales del usuario para la IA
CREATE TABLE public.user_ai_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Preferencias de comunicacion
    preferred_language VARCHAR(10) DEFAULT 'es',
    response_style VARCHAR(50) DEFAULT 'balanced',

    -- Preferencias de diseno
    favorite_mechanics TEXT[],
    favorite_themes TEXT[],
    design_philosophy TEXT,

    -- Historial de interacciones (para memoria)
    interaction_summary JSONB DEFAULT '{}',

    -- Modelo preferido
    preferred_model VARCHAR(100),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Historial de conversaciones con IA
CREATE TABLE public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,

    -- Tipo de conversacion
    conversation_type VARCHAR(50) NOT NULL,

    -- Mensajes
    messages JSONB DEFAULT '[]',

    -- Metadata
    model_used VARCHAR(100),
    tokens_used INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLAS: PORTAFOLIO
-- =============================================================================

CREATE TABLE public.portfolio_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,

    -- Informacion de la entrada
    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- Media
    thumbnail_url TEXT,
    media_urls TEXT[],

    -- Enlaces
    play_url TEXT,
    source_url TEXT,

    -- Informacion adicional
    role_in_project VARCHAR(100),
    technologies_used TEXT[],
    jam_info JSONB,

    -- Visibilidad
    is_public BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Orden
    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLAS: COSTOS ESTIMADOS (para Scope Guardian)
-- =============================================================================

CREATE TABLE public.scope_heuristics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identificador de la mecanica/feature
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,

    -- Estimaciones por nivel de skill
    hours_novice DECIMAL(5,2),
    hours_intermediate DECIMAL(5,2),
    hours_advanced DECIMAL(5,2),
    hours_expert DECIMAL(5,2),

    -- Factores de riesgo
    complexity_factor DECIMAL(3,2) DEFAULT 1.0,
    dependencies TEXT[],
    common_pitfalls TEXT[],

    -- Tips
    simplification_tips TEXT[],

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(name, category)
);

-- =============================================================================
-- INDICES
-- =============================================================================

CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_xp_level ON public.profiles(xp_level);

CREATE INDEX idx_user_skills_user ON public.user_skills(user_id);
CREATE INDEX idx_user_skills_skill ON public.user_skills(skill_id);

CREATE INDEX idx_user_engines_user ON public.user_engines(user_id);
CREATE INDEX idx_user_engines_engine ON public.user_engines(engine_key);

CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_slug ON public.projects(slug);
CREATE INDEX idx_projects_jam ON public.projects(is_jam_project) WHERE is_jam_project = TRUE;

CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_position ON public.tasks(project_id, status, position);

CREATE INDEX idx_assets_project ON public.assets(project_id);
CREATE INDEX idx_assets_type ON public.assets(type);

CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_project ON public.ai_conversations(project_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_engines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_entries ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Perfiles publicos visibles para todos" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden editar su propio perfil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar su propio perfil" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies para user_skills
CREATE POLICY "Skills visibles para todos" ON public.user_skills
    FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden gestionar sus skills" ON public.user_skills
    FOR ALL USING (auth.uid() = user_id);

-- Policies para user_engines
CREATE POLICY "Engines visibles para todos" ON public.user_engines
    FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden gestionar sus engines" ON public.user_engines
    FOR ALL USING (auth.uid() = user_id);

-- Policies para projects
CREATE POLICY "Proyectos visibles para owner y miembros" ON public.projects
    FOR SELECT USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = projects.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Owner puede modificar proyecto" ON public.projects
    FOR ALL USING (owner_id = auth.uid());

-- Policies para project_contexts
CREATE POLICY "Contexto visible para owner y miembros" ON public.project_contexts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            LEFT JOIN public.project_members pm ON pm.project_id = p.id
            WHERE p.id = project_contexts.project_id
            AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
        )
    );

CREATE POLICY "Owner puede modificar contexto" ON public.project_contexts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = project_contexts.project_id AND owner_id = auth.uid()
        )
    );

-- Policies para tasks
CREATE POLICY "Tareas visibles para miembros del proyecto" ON public.tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            LEFT JOIN public.project_members pm ON pm.project_id = p.id
            WHERE p.id = tasks.project_id
            AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
        )
    );

CREATE POLICY "Miembros pueden modificar tareas" ON public.tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            LEFT JOIN public.project_members pm ON pm.project_id = p.id
            WHERE p.id = tasks.project_id
            AND (p.owner_id = auth.uid() OR (pm.user_id = auth.uid() AND pm.can_edit))
        )
    );

-- Policies para assets
CREATE POLICY "Assets visibles para miembros del proyecto" ON public.assets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            LEFT JOIN public.project_members pm ON pm.project_id = p.id
            WHERE p.id = assets.project_id
            AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
        )
    );

CREATE POLICY "Miembros pueden modificar assets" ON public.assets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            LEFT JOIN public.project_members pm ON pm.project_id = p.id
            WHERE p.id = assets.project_id
            AND (p.owner_id = auth.uid() OR (pm.user_id = auth.uid() AND pm.can_edit))
        )
    );

-- Policies para user_ai_preferences
CREATE POLICY "Usuario puede ver sus preferencias" ON public.user_ai_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuario puede modificar sus preferencias" ON public.user_ai_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Policies para ai_conversations
CREATE POLICY "Usuario puede ver sus conversaciones" ON public.ai_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuario puede gestionar sus conversaciones" ON public.ai_conversations
    FOR ALL USING (auth.uid() = user_id);

-- Policies para portfolio_entries
CREATE POLICY "Entradas publicas visibles para todos" ON public.portfolio_entries
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Usuario puede gestionar su portfolio" ON public.portfolio_entries
    FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- FUNCIONES Y TRIGGERS
-- =============================================================================

-- Funcion para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_contexts_updated_at BEFORE UPDATE ON public.project_contexts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funcion para crear perfil automaticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil al registrarse
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Funcion para agregar XP
CREATE OR REPLACE FUNCTION public.add_user_xp(
    p_user_id UUID,
    p_amount INTEGER,
    p_reason VARCHAR(255),
    p_source_type VARCHAR(50) DEFAULT NULL,
    p_source_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    -- Insertar en historial
    INSERT INTO public.xp_history (user_id, amount, reason, source_type, source_id)
    VALUES (p_user_id, p_amount, p_reason, p_source_type, p_source_id);

    -- Actualizar XP total y nivel
    UPDATE public.profiles
    SET
        xp_total = xp_total + p_amount,
        xp_level = FLOOR(SQRT((xp_total + p_amount) / 100)) + 1
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- DATOS INICIALES (SEEDS)
-- =============================================================================

-- Skills iniciales
INSERT INTO public.skills (name, category, description) VALUES
-- Programacion
('Unity C#', 'programming', 'Desarrollo en Unity con C#'),
('Godot GDScript', 'programming', 'Desarrollo en Godot con GDScript'),
('Unreal Blueprint', 'programming', 'Programacion visual en Unreal'),
('Unreal C++', 'programming', 'Desarrollo en Unreal con C++'),
('JavaScript/TypeScript', 'programming', 'Desarrollo web y juegos HTML5'),
('Python', 'programming', 'Python para juegos y herramientas'),

-- Arte
('Pixel Art', 'art', 'Arte en pixel art'),
('3D Modeling', 'art', 'Modelado 3D'),
('2D Illustration', 'art', 'Ilustracion 2D'),
('Animation 2D', 'art', 'Animacion 2D'),
('Animation 3D', 'art', 'Animacion 3D'),
('UI/UX Design', 'art', 'Diseno de interfaces'),
('Concept Art', 'art', 'Arte conceptual'),

-- Audio
('Sound Design', 'audio', 'Diseno de sonido'),
('Music Composition', 'audio', 'Composicion musical'),
('Voice Acting', 'audio', 'Actuacion de voz'),

-- Game Design
('Level Design', 'design', 'Diseno de niveles'),
('Narrative Design', 'design', 'Diseno narrativo'),
('Systems Design', 'design', 'Diseno de sistemas'),
('Game Balance', 'design', 'Balance de juegos'),

-- Management
('Project Management', 'management', 'Gestion de proyectos'),
('QA Testing', 'management', 'Control de calidad');

-- Heuristicas de scope iniciales
INSERT INTO public.scope_heuristics (name, category, hours_novice, hours_intermediate, hours_advanced, hours_expert, complexity_factor, simplification_tips) VALUES
('Basic Movement System', 'mechanic', 4, 2, 1, 0.5, 1.0, ARRAY['Usar sistema de movimiento del motor', 'Evitar movimiento custom']),
('Inventory System', 'system', 12, 6, 4, 2, 1.5, ARRAY['Limitar slots', 'Evitar drag & drop', 'Usar lista simple']),
('Dialogue System', 'system', 16, 8, 4, 2, 1.3, ARRAY['Usar dialogos lineales', 'Evitar branching complejo']),
('Combat System (Basic)', 'mechanic', 8, 4, 2, 1, 1.2, ARRAY['Un tipo de ataque', 'Sin combos']),
('Combat System (Advanced)', 'mechanic', 24, 12, 6, 3, 2.0, ARRAY['Reducir a sistema basico', 'Limitar enemigos']),
('Save/Load System', 'system', 6, 3, 1.5, 1, 1.1, ARRAY['Solo guardar progreso minimo', 'Un slot de guardado']),
('Main Menu', 'feature', 2, 1, 0.5, 0.25, 1.0, ARRAY['Minimo: Play y Exit', 'Sin opciones complejas']),
('Tutorial System', 'feature', 8, 4, 2, 1, 1.2, ARRAY['Tooltips simples', 'Evitar tutorial interactivo']),
('Pixel Art Character', 'asset_type', 4, 2, 1, 0.5, 1.0, ARRAY['Resolucion baja', 'Pocas animaciones']),
('3D Character Model', 'asset_type', 16, 8, 4, 2, 1.5, ARRAY['Low poly', 'Rig simple']),
('Background Music Track', 'asset_type', 6, 3, 1.5, 1, 1.0, ARRAY['Loop corto', 'Genero simple']),
('Sound Effect Pack', 'asset_type', 4, 2, 1, 0.5, 1.0, ARRAY['Usar librerias gratuitas', 'Efectos minimos']);
