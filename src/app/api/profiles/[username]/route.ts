import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ username: string }>
}

// Types for the API response
interface ProfileData {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  role: string
  xp_total: number
  xp_level: number
  preferred_engine: string | null
  preferred_genres: string[] | null
  timezone: string | null
  last_active_at: string | null
  created_at: string
  user_skills: Array<{
    skill_id: string
    level: string
    endorsed_count: number
    skills: {
      id: string
      name: string
      category: string
      icon: string | null
      description: string | null
    } | null
  }>
  user_engines: Array<{
    engine_key: string
    custom_name: string | null
    level: string
    is_primary: boolean
  }>
  portfolio_entries: Array<{
    id: string
    title: string
    description: string | null
    thumbnail_url: string | null
    media_urls: string[] | null
    play_url: string | null
    source_url: string | null
    role_in_project: string | null
    technologies_used: string[] | null
    jam_info: Record<string, unknown> | null
    is_featured: boolean
    display_order: number
  }>
}

interface ProjectData {
  id: string
  name: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  status: string
  is_jam_project: boolean
  jam_name: string | null
  engine: string | null
  genre: string | null
  art_style: string | null
  created_at: string
}

interface MemberProjectData {
  roles: string[] | null
  projects: {
    id: string
    name: string
    slug: string
    description: string | null
    thumbnail_url: string | null
    status: string
    is_jam_project: boolean
    jam_name: string | null
    engine: string | null
    genre: string | null
    created_at: string
  } | null
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { username } = await params
    const supabase = await createClient()

    // Obtener perfil con skills, engines y portfolio
    const { data: profileRaw, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        bio,
        role,
        xp_total,
        xp_level,
        preferred_engine,
        preferred_genres,
        timezone,
        last_active_at,
        created_at,
        user_skills (
          skill_id,
          level,
          endorsed_count,
          skills (
            id,
            name,
            category,
            icon,
            description
          )
        ),
        user_engines (
          engine_key,
          custom_name,
          level,
          is_primary
        ),
        portfolio_entries (
          id,
          title,
          description,
          thumbnail_url,
          media_urls,
          play_url,
          source_url,
          role_in_project,
          technologies_used,
          jam_info,
          is_featured,
          display_order
        )
      `)
      .eq('username', username)
      .eq('onboarding_completed', true)
      .single()

    if (error || !profileRaw) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const profile = profileRaw as unknown as ProfileData

    // Obtener proyectos públicos del usuario (donde es owner)
    const { data: ownedProjectsRaw } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        slug,
        description,
        thumbnail_url,
        status,
        is_jam_project,
        jam_name,
        engine,
        genre,
        art_style,
        created_at
      `)
      .eq('owner_id', profile.id)
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false })
      .limit(6)

    const ownedProjects = (ownedProjectsRaw || []) as ProjectData[]

    // Obtener proyectos donde es miembro
    const { data: memberProjectsRaw } = await supabase
      .from('project_members')
      .select(`
        roles,
        projects (
          id,
          name,
          slug,
          description,
          thumbnail_url,
          status,
          is_jam_project,
          jam_name,
          engine,
          genre,
          created_at
        )
      `)
      .eq('user_id', profile.id)
      .limit(6)

    const memberProjects = (memberProjectsRaw || []) as MemberProjectData[]

    // Transformar datos
    const publicProfile = {
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      role: profile.role,
      xpTotal: profile.xp_total,
      xpLevel: profile.xp_level,
      preferredEngine: profile.preferred_engine,
      preferredGenres: profile.preferred_genres || [],
      timezone: profile.timezone,
      lastActiveAt: profile.last_active_at,
      memberSince: profile.created_at,
      skills: (profile.user_skills || []).map(us => ({
        id: us.skills?.id,
        name: us.skills?.name,
        category: us.skills?.category,
        icon: us.skills?.icon,
        description: us.skills?.description,
        level: us.level,
        endorsedCount: us.endorsed_count,
      })).filter(s => s.id),
      engines: (profile.user_engines || []).map(ue => ({
        key: ue.engine_key,
        customName: ue.custom_name,
        level: ue.level,
        isPrimary: ue.is_primary,
      })),
      portfolio: (profile.portfolio_entries || [])
        .filter(pe => pe.is_featured !== false)
        .sort((a, b) => a.display_order - b.display_order)
        .map(pe => ({
          id: pe.id,
          title: pe.title,
          description: pe.description,
          thumbnailUrl: pe.thumbnail_url,
          mediaUrls: pe.media_urls || [],
          playUrl: pe.play_url,
          sourceUrl: pe.source_url,
          roleInProject: pe.role_in_project,
          technologiesUsed: pe.technologies_used || [],
          jamInfo: pe.jam_info,
        })),
      ownedProjects: ownedProjects.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        thumbnailUrl: p.thumbnail_url,
        status: p.status,
        isJamProject: p.is_jam_project,
        jamName: p.jam_name,
        engine: p.engine,
        genre: p.genre,
        artStyle: p.art_style,
        createdAt: p.created_at,
      })),
      memberProjects: memberProjects
        .filter(mp => mp.projects)
        .map(mp => ({
          id: mp.projects!.id,
          name: mp.projects!.name,
          slug: mp.projects!.slug,
          description: mp.projects!.description,
          thumbnailUrl: mp.projects!.thumbnail_url,
          status: mp.projects!.status,
          isJamProject: mp.projects!.is_jam_project,
          jamName: mp.projects!.jam_name,
          engine: mp.projects!.engine,
          genre: mp.projects!.genre,
          createdAt: mp.projects!.created_at,
          roles: mp.roles || [],
        })),
    }

    return NextResponse.json(publicProfile)
  } catch (error) {
    console.error('Error fetching public profile:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
