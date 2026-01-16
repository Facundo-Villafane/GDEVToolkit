import { create } from 'zustand'
import type { Project, Task, Asset } from '@/types'

interface ProjectState {
  // Current project
  currentProject: Project | null
  tasks: Task[]
  assets: Asset[]

  // All projects
  projects: Project[]
  isLoading: boolean

  // Actions - Projects
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProject: (projectId: string, updates: Partial<Project>) => void
  removeProject: (projectId: string) => void
  setCurrentProject: (project: Project | null) => void

  // Actions - Tasks
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  removeTask: (taskId: string) => void
  moveTask: (taskId: string, newStatus: Task['status'], newPosition: number) => void

  // Actions - Assets
  setAssets: (assets: Asset[]) => void
  addAsset: (asset: Asset) => void
  updateAsset: (assetId: string, updates: Partial<Asset>) => void
  removeAsset: (assetId: string) => void

  // Helpers
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

const initialState = {
  currentProject: null,
  tasks: [],
  assets: [],
  projects: [],
  isLoading: false,
}

export const useProjectStore = create<ProjectState>((set) => ({
  ...initialState,

  // Projects
  setProjects: (projects) => set({ projects }),

  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
    })),

  updateProject: (projectId, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, ...updates } : p
      ),
      currentProject:
        state.currentProject?.id === projectId
          ? { ...state.currentProject, ...updates }
          : state.currentProject,
    })),

  removeProject: (projectId) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      currentProject:
        state.currentProject?.id === projectId ? null : state.currentProject,
    })),

  setCurrentProject: (project) =>
    set({
      currentProject: project,
      tasks: [],
      assets: [],
    }),

  // Tasks
  setTasks: (tasks) => set({ tasks }),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),

  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    })),

  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    })),

  moveTask: (taskId, newStatus, newPosition) =>
    set((state) => {
      const tasks = [...state.tasks]
      const taskIndex = tasks.findIndex((t) => t.id === taskId)
      if (taskIndex === -1) return state

      const task = { ...tasks[taskIndex], status: newStatus, position: newPosition }
      tasks.splice(taskIndex, 1)

      // Reordenar tareas en la misma columna
      const sameCategoryTasks = tasks.filter((t) => t.status === newStatus)
      sameCategoryTasks.splice(newPosition, 0, task)

      // Actualizar posiciones
      const updatedTasks = tasks
        .filter((t) => t.status !== newStatus)
        .concat(
          sameCategoryTasks.map((t, index) => ({
            ...t,
            position: index,
          }))
        )

      return { tasks: updatedTasks }
    }),

  // Assets
  setAssets: (assets) => set({ assets }),

  addAsset: (asset) =>
    set((state) => ({
      assets: [...state.assets, asset],
    })),

  updateAsset: (assetId, updates) =>
    set((state) => ({
      assets: state.assets.map((a) =>
        a.id === assetId ? { ...a, ...updates } : a
      ),
    })),

  removeAsset: (assetId) =>
    set((state) => ({
      assets: state.assets.filter((a) => a.id !== assetId),
    })),

  // Helpers
  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set(initialState),
}))
