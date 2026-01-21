'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  User,
  FolderKanban,
  Wrench,
  Gamepad2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useUserStore } from '@/stores/user-store'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Perfil',
    href: '/profile',
    icon: User,
  },
  {
    name: 'Proyectos',
    href: '/projects',
    icon: FolderKanban,
  },
  {
    name: 'Comunidad',
    href: '/community',
    icon: Users,
  },
  {
    name: 'Toolkits',
    href: '/toolkits',
    icon: Wrench,
    children: [
      {
        name: 'JamMaster',
        href: '/toolkits/jammaster',
        icon: Gamepad2,
      },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { profile } = useUserStore()
  const isAdmin = profile?.role === 'admin'

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">DevHub</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard">
            <Gamepad2 className="h-8 w-8 text-primary" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>

              {/* Children */}
              {!collapsed && item.children && isActive && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.href
                    const ChildIcon = child.icon

                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
                          isChildActive
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent/50'
                        )}
                      >
                        <ChildIcon className="h-4 w-4" />
                        <span>{child.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Admin Section - Solo visible para admins */}
      {isAdmin && (
        <div className="border-t p-2 space-y-1">
          {!collapsed && (
            <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admin
            </p>
          )}
          <Link
            href="/skills"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === '/skills'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Sparkles className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Skills</span>}
          </Link>
          <Link
            href="/users"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === '/users'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Users className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Usuarios</span>}
          </Link>
        </div>
      )}

      {/* Settings */}
      <div className="border-t p-2">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/settings'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Configuracion</span>}
        </Link>
      </div>
    </aside>
  )
}
