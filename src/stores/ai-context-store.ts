import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProjectContext, GDD, ScopeReport, OracleConcept, AIMessage } from '@/types'

interface AIContextState {
  // Contexto del proyecto actual
  currentProjectId: string | null
  projectContext: ProjectContext

  // Preferencias del usuario
  userPreferences: {
    responseStyle: 'concise' | 'balanced' | 'detailed'
    preferredModel: string | null
    favoriteGenres: string[]
    designPhilosophy: string
  }

  // Historial de conversación actual
  conversationHistory: AIMessage[]

  // Actions
  setCurrentProject: (projectId: string) => void
  updateProjectContext: (context: Partial<ProjectContext>) => void
  updateGDD: (gdd: Partial<GDD>) => void
  setScopeReport: (report: ScopeReport) => void
  addOracleConcept: (concept: OracleConcept) => void
  setOracleConcepts: (concepts: OracleConcept[]) => void
  selectConcept: (conceptId: string) => void
  addMessage: (role: 'user' | 'assistant', content: string) => void
  clearConversation: () => void
  updateUserPreferences: (prefs: Partial<AIContextState['userPreferences']>) => void
  resetContext: () => void
}

const initialProjectContext: ProjectContext = {
  gdd: {},
  oracleConcepts: [],
}

const initialUserPreferences: AIContextState['userPreferences'] = {
  responseStyle: 'balanced',
  preferredModel: null,
  favoriteGenres: [],
  designPhilosophy: '',
}

export const useAIContextStore = create<AIContextState>()(
  persist(
    (set, get) => ({
      currentProjectId: null,
      projectContext: initialProjectContext,
      userPreferences: initialUserPreferences,
      conversationHistory: [],

      setCurrentProject: (projectId) =>
        set({
          currentProjectId: projectId,
          conversationHistory: [],
          projectContext: initialProjectContext,
        }),

      updateProjectContext: (context) =>
        set((state) => ({
          projectContext: { ...state.projectContext, ...context },
        })),

      updateGDD: (gdd) =>
        set((state) => ({
          projectContext: {
            ...state.projectContext,
            gdd: { ...state.projectContext.gdd, ...gdd },
          },
        })),

      setScopeReport: (report) =>
        set((state) => ({
          projectContext: { ...state.projectContext, scopeReport: report },
        })),

      addOracleConcept: (concept) =>
        set((state) => ({
          projectContext: {
            ...state.projectContext,
            oracleConcepts: [
              ...(state.projectContext.oracleConcepts || []),
              concept,
            ],
          },
        })),

      setOracleConcepts: (concepts) =>
        set((state) => ({
          projectContext: {
            ...state.projectContext,
            oracleConcepts: concepts,
          },
        })),

      selectConcept: (conceptId) =>
        set((state) => ({
          projectContext: {
            ...state.projectContext,
            oracleConcepts: state.projectContext.oracleConcepts?.map((c) => ({
              ...c,
              selected: c.id === conceptId,
            })),
          },
        })),

      addMessage: (role, content) =>
        set((state) => ({
          conversationHistory: [
            ...state.conversationHistory,
            { role, content, timestamp: Date.now() },
          ],
        })),

      clearConversation: () => set({ conversationHistory: [] }),

      updateUserPreferences: (prefs) =>
        set((state) => ({
          userPreferences: { ...state.userPreferences, ...prefs },
        })),

      resetContext: () =>
        set({
          currentProjectId: null,
          projectContext: initialProjectContext,
          conversationHistory: [],
        }),
    }),
    {
      name: 'devhub-ai-context',
      partialize: (state) => ({
        userPreferences: state.userPreferences,
      }),
    }
  )
)
