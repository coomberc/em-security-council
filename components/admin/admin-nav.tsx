'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Departments', href: '/admin/departments' },
  { label: 'Users', href: '/admin/users' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 border-b mb-6">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative px-3 py-2 text-sm font-medium transition-colors',
              'hover:text-foreground',
              isActive ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {item.label}
            {isActive && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
            )}
          </Link>
        )
      })}
    </div>
  )
}
