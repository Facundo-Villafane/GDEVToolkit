import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Types for the query response
interface ProfileSearchResult {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  xp_level: number
  preferred_engine: string | null
  preferred_genres: string[] | null
  last_active_at: string | null
  user_skills: Array<{
    skill_id: string
    level: string
    skills: {
      id: string
      name: string
      category: string
      icon: string | null
    } | null
  }>
  user_engines: Array<{
    engine_key: string
    level: string
    is_primary: boolean
  }>
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const skill = searchParams.get('skill')
    const engine = searchParams.get('engine')
    const genre = searchParams.get('genre')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()

    // Obtener el usuario actual para excluirlo de los resultados
    const { data: { user } } = await supabase.auth.getUser()

    // Construir la query base
    let baseQuery = supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        bio,
        xp_level,
        preferred_engine,
        preferred_genres,
        last_active_at,
        user_skills (
          skill_id,
          level,
          skills (
            id,
            name,
            category,
            icon
          )
        ),
        user_engines (
          engine_key,
          level,
          is_primary
        )
      `, { count: 'exact' })
      .eq('onboarding_completed', true)
      .order('last_active_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    // Excluir al usuario actual
    if (user) {
      baseQuery = baseQuery.neq('id', user.id)
    }

    // Filtro por texto (username o display_name)
    if (query) {
      baseQuery = baseQuery.or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    }

    // Filtro por género preferido
    if (genre) {
      baseQuery = baseQuery.contains('preferred_genres', [genre])
    }

    // Filtro por engine preferido
    if (engine) {
      baseQuery = baseQuery.eq('preferred_engine', engine)
    }

    const { data: profilesRaw, error, count } = await baseQuery

    if (error) {
      console.error('Error searching profiles:', error)
      return NextResponse.json(
        { error: 'Error al buscar usuarios' },
        { status: 500 }
      )
    }

    const profiles = (profilesRaw || []) as unknown as ProfileSearchResult[]

    // Si hay filtro de skill, filtrar en memoria
    let filteredProfiles = profiles
    if (skill && filteredProfiles.length > 0) {
      filteredProfiles = filteredProfiles.filter(profile => {
        return profile.user_skills?.some(us =>
          us.skills?.name?.toLowerCase().includes(skill.toLowerCase())
        )
      })
    }

    // Transformar datos para el frontend
    const users = filteredProfiles.map(profile => ({
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      xpLevel: profile.xp_level,
      preferredEngine: profile.preferred_engine,
      preferredGenres: profile.preferred_genres || [],
      lastActiveAt: profile.last_active_at,
      skills: (profile.user_skills || []).map(us => ({
        id: us.skills?.id,
        name: us.skills?.name,
        category: us.skills?.category,
        icon: us.skills?.icon,
        level: us.level,
      })).filter(s => s.id),
      engines: (profile.user_engines || []).map(ue => ({
        key: ue.engine_key,
        level: ue.level,
        isPrimary: ue.is_primary,
      })),
    }))

    return NextResponse.json({
      users,
      total: skill ? users.length : (count || 0),
      hasMore: offset + limit < (count || 0),
    })
  } catch (error) {
    console.error('Error in profile search:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
