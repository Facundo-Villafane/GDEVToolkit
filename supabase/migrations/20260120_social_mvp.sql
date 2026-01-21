-- =============================================================================
-- SOCIAL MVP: Invitaciones a proyectos y perfiles públicos
-- =============================================================================

-- Tabla de invitaciones a proyectos
CREATE TABLE IF NOT EXISTS public.project_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  -- No se puede invitar a la misma persona dos veces al mismo proyecto
  UNIQUE(project_id, invitee_id)
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_invitations_project ON public.project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee ON public.project_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.project_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_pending ON public.project_invitations(invitee_id) WHERE status = 'pending';

-- Índices para búsqueda de usuarios
CREATE INDEX IF NOT EXISTS idx_profiles_username_search ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_search ON public.profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON public.user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_engines_engine ON public.user_engines(engine_key);

-- =============================================================================
-- RLS POLICIES para project_invitations
-- =============================================================================

ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- Ver invitaciones: si eres el invitado, el que invitó, o dueño del proyecto
CREATE POLICY "Ver invitaciones propias o de mis proyectos"
  ON public.project_invitations
  FOR SELECT
  USING (
    auth.uid() = invitee_id
    OR auth.uid() = inviter_id
    OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- Crear invitación: solo dueño del proyecto o miembros con permiso can_manage
CREATE POLICY "Crear invitaciones como dueño o manager"
  ON public.project_invitations
  FOR INSERT
  WITH CHECK (
    auth.uid() = inviter_id
    AND (
      EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = project_id AND owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_id = project_invitations.project_id
        AND user_id = auth.uid()
        AND can_manage = true
      )
    )
  );

-- Actualizar invitación: solo el invitado puede aceptar/rechazar
CREATE POLICY "Responder a invitaciones propias"
  ON public.project_invitations
  FOR UPDATE
  USING (auth.uid() = invitee_id)
  WITH CHECK (auth.uid() = invitee_id);

-- Eliminar invitación: el que invitó o el dueño del proyecto
CREATE POLICY "Cancelar invitaciones propias o de mis proyectos"
  ON public.project_invitations
  FOR DELETE
  USING (
    auth.uid() = inviter_id
    OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- =============================================================================
-- RLS POLICIES para perfiles públicos (lectura)
-- =============================================================================

-- Asegurar que profiles sea legible públicamente (para búsqueda de usuarios)
-- La policy "Profiles are viewable by everyone" ya debería existir
-- Si no existe, la creamos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Profiles are viewable by everyone"
      ON public.profiles
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- user_skills deben ser visibles públicamente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_skills'
    AND policyname = 'User skills are viewable by everyone'
  ) THEN
    CREATE POLICY "User skills are viewable by everyone"
      ON public.user_skills
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- user_engines deben ser visibles públicamente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_engines'
    AND policyname = 'User engines are viewable by everyone'
  ) THEN
    CREATE POLICY "User engines are viewable by everyone"
      ON public.user_engines
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- =============================================================================
-- FUNCIÓN: Aceptar invitación y agregar a project_members
-- =============================================================================

CREATE OR REPLACE FUNCTION public.accept_project_invitation(invitation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Obtener la invitación
  SELECT * INTO v_invitation
  FROM public.project_invitations
  WHERE id = invitation_id AND invitee_id = auth.uid() AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitación no encontrada o no tienes permiso';
  END IF;

  -- Actualizar el estado de la invitación
  UPDATE public.project_invitations
  SET status = 'accepted', responded_at = NOW()
  WHERE id = invitation_id;

  -- Agregar al usuario como miembro del proyecto
  INSERT INTO public.project_members (project_id, user_id, roles, can_edit, can_manage)
  VALUES (v_invitation.project_id, v_invitation.invitee_id, ARRAY[v_invitation.role], true, false)
  ON CONFLICT (project_id, user_id) DO NOTHING;

  RETURN TRUE;
END;
$$;

-- =============================================================================
-- FUNCIÓN: Rechazar invitación
-- =============================================================================

CREATE OR REPLACE FUNCTION public.reject_project_invitation(invitation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.project_invitations
  SET status = 'rejected', responded_at = NOW()
  WHERE id = invitation_id AND invitee_id = auth.uid() AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitación no encontrada o no tienes permiso';
  END IF;

  RETURN TRUE;
END;
$$;

-- Permisos para las funciones
GRANT EXECUTE ON FUNCTION public.accept_project_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_project_invitation(UUID) TO authenticated;
