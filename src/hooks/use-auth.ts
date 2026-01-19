'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useUserStore } from '@/stores/user-store'
import type { Tables } from '@/types/database'

type ProfileRow = Tables<'profiles'>

export function useAuth() {
  const router = useRouter()
  const supabase = createClient()
  const { user, session, isLoading, isAuthenticated, setSession, setLoading, signOut: clearAuth } = useAuthStore()
  const { setProfile, setRefreshCallback, reset: resetUser } = useUserStore()

  // Function to fetch and set profile
  const fetchAndSetProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const profile = data as ProfileRow | null

    if (profile) {
      setProfile({
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
        onboardingCompleted: profile.onboarding_completed,
        skills: [], // Skills loaded separately
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        // Include tagline if it exists
        ...(profile as { tagline?: string }).tagline && { tagline: (profile as { tagline?: string }).tagline },
      })
    }
  }, [supabase, setProfile])

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      if (session?.user) {
        await fetchAndSetProfile(session.user.id)

        // Set up refresh callback
        setRefreshCallback(async () => {
          await fetchAndSetProfile(session.user.id)
        })
      }

      setLoading(false)
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session)

        if (event === 'SIGNED_OUT') {
          resetUser()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, setSession, setLoading, fetchAndSetProfile, setRefreshCallback, resetUser])

  // Sign in with email
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return data
    },
    [supabase]
  )

  // Sign up with email
  const signUpWithEmail = useCallback(
    async (email: string, password: string, username: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (error) throw error
      return data
    },
    [supabase]
  )

  // Sign in with OAuth
  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'github' | 'discord') => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      })

      if (error) throw error
      return data
    },
    [supabase]
  )

  // Sign out
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    clearAuth()
    resetUser()
    router.push('/login')
  }, [supabase, clearAuth, resetUser, router])

  // Reset password
  const resetPassword = useCallback(
    async (email: string) => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      return data
    },
    [supabase]
  )

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    resetPassword,
  }
}
