export * from './database'

// User types
export interface UserProfile {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  role: 'user' | 'pro' | 'admin'
  xpTotal: number
  xpLevel: number
  preferredEngine: string | null
  preferredGenres: string[]
  onboardingCompleted: boolean
  skills: UserSkill[]
  createdAt: string
  updatedAt?: string
}

export interface UserSkill {
  id: string
  skillId: string
  name: string
  category: string
  level: SkillLevel
  endorsedCount: number
}

export type SkillLevel = 'novice' | 'intermediate' | 'advanced' | 'expert'

// Project types
export interface Project {
  id: string
  ownerId: string
  name: string
  slug: string
  description: string | null
  thumbnailUrl: string | null
  status: ProjectStatus
  isJamProject: boolean
  jamInfo?: JamInfo
  engine: string | null
  genre: string | null
  artStyle: string | null
  scopeScore: number | null
  riskLevel: RiskLevel | null
  createdAt: string
  updatedAt: string
}

export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived'
export type RiskLevel = 'green' | 'yellow' | 'red'

export interface JamInfo {
  name: string
  theme: string
  startDate: string
  endDate: string
  totalHours: number
}

// Task types
export interface Task {
  id: string
  projectId: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assignedTo: string | null
  roleRequired: string | null
  estimatedHours: number | null
  actualHours: number | null
  isAiGenerated: boolean
  aiSuggestion: string | null
  aiRiskFlag: boolean
  position: number
  parentTaskId: string | null
  dueDate: string | null
  completedAt: string | null
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

// Asset types
export interface Asset {
  id: string
  projectId: string
  name: string
  type: AssetType
  description: string | null
  technicalSpec: Record<string, unknown>
  aiPrompt: string | null
  styleReference: string | null
  isCompleted: boolean
  assignedTo: string | null
  isMvp: boolean
  priority: TaskPriority
}

export type AssetType = 'sprite' | 'model_3d' | 'audio' | 'music' | 'ui' | 'animation' | 'shader' | 'other'

// AI types
export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
}

export interface ProjectContext {
  gdd: GDD
  scopeReport?: ScopeReport
  oracleConcepts?: OracleConcept[]
}

export interface GDD {
  name?: string
  genre?: string
  theme?: string
  coreMechanic?: string
  targetAudience?: string
  artStyle?: string
  elevator_pitch?: string
}

export interface ScopeReport {
  score: number
  riskLevel: RiskLevel
  criticalPath: string[]
  recommendations: string[]
  riskItems: RiskItem[]
}

export interface RiskItem {
  name: string
  level: RiskLevel
  estimatedHours: number
  suggestion: string
}

export interface OracleConcept {
  id: string
  name: string
  pitch: string
  coreLoop: string
  mdaBreakdown: {
    mechanics: string
    dynamics: string
    aesthetics: string
  }
  kosterAnalysis: string
  flowAnalysis: string
  selected: boolean
}
