'use client'

import Image from 'next/image'
import { FaUnity } from 'react-icons/fa6'
import {
  SiUnrealengine,
  SiGodotengine,
  SiGamemaker,
  SiConstruct3,
  SiRenpy,
} from 'react-icons/si'
import { MdOutlineDashboardCustomize } from 'react-icons/md'
import { GAME_ENGINES, type GameEngineKey } from '@/lib/constants/engines'
import { cn } from '@/lib/utils'

const iconComponents = {
  FaUnity,
  SiUnrealengine,
  SiGodotengine,
  SiGamemaker,
  SiConstruct3,
  SiRenpy,
  MdOutlineDashboardCustomize,
} as const

interface EngineIconProps {
  engineKey: GameEngineKey
  size?: number
  className?: string
}

export function EngineIcon({ engineKey, size = 24, className }: EngineIconProps) {
  const engine = GAME_ENGINES[engineKey]

  if (!engine) {
    return <MdOutlineDashboardCustomize size={size} className={className} />
  }

  if (engine.iconType === 'react-icon' && engine.iconName) {
    const IconComponent = iconComponents[engine.iconName as keyof typeof iconComponents]
    if (IconComponent) {
      return <IconComponent size={size} className={className} />
    }
  }

  if (engine.iconType === 'image' && engine.iconUrl) {
    return (
      <Image
        src={engine.iconUrl}
        alt={engine.label}
        width={size}
        height={size}
        className={cn(
          'object-contain',
          engine.darkInvert && 'dark:invert',
          className
        )}
        unoptimized // For external URLs
      />
    )
  }

  return <MdOutlineDashboardCustomize size={size} className={className} />
}
