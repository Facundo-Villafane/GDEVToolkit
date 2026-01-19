'use client'

import { cn } from '@/lib/utils'
import { SKILL_LEVELS, type SkillLevelKey } from '@/lib/constants/skills'

interface SkillLevelSelectorProps {
  value: SkillLevelKey
  onChange: (level: SkillLevelKey) => void
  disabled?: boolean
}

const levels: SkillLevelKey[] = ['novice', 'intermediate', 'advanced', 'expert']

export function SkillLevelSelector({ value, onChange, disabled }: SkillLevelSelectorProps) {
  const currentIndex = levels.indexOf(value)

  return (
    <div className="flex items-center gap-1">
      {levels.map((level, index) => {
        const isActive = index <= currentIndex
        const levelInfo = SKILL_LEVELS[level]

        return (
          <button
            key={level}
            type="button"
            disabled={disabled}
            onClick={() => onChange(level)}
            className={cn(
              'h-5 w-2 rounded-sm transition-all hover:scale-110',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
              isActive
                ? index === 0
                  ? 'bg-gray-400'
                  : index === 1
                  ? 'bg-blue-500'
                  : index === 2
                  ? 'bg-purple-500'
                  : 'bg-yellow-500'
                : 'bg-muted-foreground/20',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            title={levelInfo.label}
          />
        )
      })}
    </div>
  )
}

// Alternative inline version for compact spaces
export function SkillLevelBars({ level, size = 'sm' }: { level: SkillLevelKey; size?: 'sm' | 'md' }) {
  const currentIndex = levels.indexOf(level)

  const barHeight = size === 'sm' ? 'h-3' : 'h-4'
  const barWidth = size === 'sm' ? 'w-1' : 'w-1.5'

  return (
    <div className="flex items-center gap-0.5">
      {levels.map((_, index) => {
        const isActive = index <= currentIndex

        return (
          <div
            key={index}
            className={cn(
              barHeight,
              barWidth,
              'rounded-sm',
              isActive
                ? index === 0
                  ? 'bg-gray-400'
                  : index === 1
                  ? 'bg-blue-500'
                  : index === 2
                  ? 'bg-purple-500'
                  : 'bg-yellow-500'
                : 'bg-muted-foreground/20'
            )}
          />
        )
      })}
    </div>
  )
}
