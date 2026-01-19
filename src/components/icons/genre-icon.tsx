'use client'

import {
  GiSwordWound,
  GiTreasureMap,
  GiMagicSwirl,
  GiChessKnight,
  GiPuzzle,
  GiRunningNinja,
  GiCrosshair,
  GiFactory,
  GiSoccerBall,
  GiRaceCar,
  GiBoxingGlove,
  GiGhost,
  GiCampfire,
  GiCube,
  GiSkullCrossedBones,
  GiDoorway,
  GiBookmarklet,
  GiMusicalNotes,
  GiCastle,
  GiCardPlay,
  GiClick,
  GiBookCover,
  GiQuillInk,
  GiThreeFriends,
  GiEarthAmerica,
  GiTrophy,
  GiNinjaHeroicStance,
  GiWorld,
  GiDungeonGate,
  GiLaserBurst,
  GiPaintBrush,
  GiJapan,
  GiCrystalBall,
  GiPencilBrush,
  GiIsland,
  GiPalette,
  GiGamepad,
} from 'react-icons/gi'
import { HiOutlineSquare2Stack } from 'react-icons/hi2'
import { MdOutline3dRotation, MdMovieFilter } from 'react-icons/md'
import { TbVectorTriangle } from 'react-icons/tb'
import { BsCamera } from 'react-icons/bs'
import { RiPixelfedLine } from 'react-icons/ri'

const genreIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  GiSwordWound,
  GiTreasureMap,
  GiMagicSwirl,
  GiChessKnight,
  GiPuzzle,
  GiRunningNinja,
  GiCrosshair,
  GiFactory,
  GiSoccerBall,
  GiRaceCar,
  GiBoxingGlove,
  GiGhost,
  GiCampfire,
  GiCube,
  GiSkullCrossedBones,
  GiDoorway,
  GiBookmarklet,
  GiMusicalNotes,
  GiCastle,
  GiCardPlay,
  GiClick,
  GiBookCover,
  GiQuillInk,
  GiThreeFriends,
  GiEarthAmerica,
  GiTrophy,
  GiNinjaHeroicStance,
  GiWorld,
  GiDungeonGate,
  GiLaserBurst,
  // Art styles
  GiPixelatedPointer: RiPixelfedLine,
  GiPaintBrush,
  GiPhotoCamera: BsCamera,
  GiJapan,
  GiVectorDown: TbVectorTriangle,
  'Gi3DGlasses': MdOutline3dRotation,
  GiCrystalBall,
  GiFilmProjector: MdMovieFilter,
  GiPencilBrush,
  GiSquare: HiOutlineSquare2Stack,
  GiIsland,
  GiRetroController: GiGamepad,
  GiAbstract047: GiCrystalBall,
  GiPalette,
}

interface GenreIconProps {
  iconName: string
  size?: number
  className?: string
}

export function GenreIcon({ iconName, size = 20, className }: GenreIconProps) {
  const IconComponent = genreIcons[iconName]

  if (!IconComponent) {
    return <GiGamepad size={size} className={className} />
  }

  return <IconComponent size={size} className={className} />
}
