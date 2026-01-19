import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, UserSkill } from '@/types'

interface UserState {
  profile: UserProfile | null
  isLoading: boolean
  _refreshCallback: (() => Promise<void>) | null

  // Actions
  setProfile: (profile: UserProfile | null) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  setRefreshCallback: (callback: (() => Promise<void>) | null) => void
  refreshProfile: () => Promise<void>
  addSkill: (skill: UserSkill) => void
  updateSkill: (skillId: string, updates: Partial<UserSkill>) => void
  removeSkill: (skillId: string) => void
  addXP: (amount: number) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

const initialState = {
  profile: null,
  isLoading: false,
  _refreshCallback: null,
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setProfile: (profile) => set({ profile }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...updates }
            : null,
        })),

      setRefreshCallback: (callback) => set({ _refreshCallback: callback }),

      refreshProfile: async () => {
        const callback = get()._refreshCallback
        if (callback) {
          await callback()
        }
      },

      addSkill: (skill) =>
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                skills: [...state.profile.skills, skill],
              }
            : null,
        })),

      updateSkill: (skillId, updates) =>
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                skills: state.profile.skills.map((s) =>
                  s.skillId === skillId ? { ...s, ...updates } : s
                ),
              }
            : null,
        })),

      removeSkill: (skillId) =>
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                skills: state.profile.skills.filter((s) => s.skillId !== skillId),
              }
            : null,
        })),

      addXP: (amount) =>
        set((state) => {
          if (!state.profile) return state
          const newXP = state.profile.xpTotal + amount
          // Fórmula simple de nivel: sqrt(xp / 100) + 1
          const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1
          return {
            profile: {
              ...state.profile,
              xpTotal: newXP,
              xpLevel: newLevel,
            },
          }
        }),

      setLoading: (isLoading) => set({ isLoading }),

      reset: () => set(initialState),
    }),
    {
      name: 'devhub-user',
      partialize: (state) => ({
        // Solo persistir datos no sensibles
        profile: state.profile
          ? {
              id: state.profile.id,
              username: state.profile.username,
              displayName: state.profile.displayName,
              avatarUrl: state.profile.avatarUrl,
              xpLevel: state.profile.xpLevel,
            }
          : null,
      }),
    }
  )
)
