'use client'

import { useMemo, useState } from 'react'
import { useCurrentUser } from '@/providers/user-provider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronDown, UserPlus, Sun, Moon, Menu, Plus, Shield } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const NAV_LINKS = [
  { href: '/sign-offs', label: 'Sign-Offs' },
]

const ADMIN_LINK = { href: '/admin/departments', label: 'Admin' }

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

function MobileNav({
  navLinks,
  pathname,
}: {
  navLinks: { href: string; label: string }[]
  pathname: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(true)}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Approvals
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1 mt-4">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <SheetClose key={link.href} asChild>
                  <Link
                    href={link.href}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/15 text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                    )}
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              )
            })}
          </nav>

          <Separator className="my-4" />

          <div className="px-3">
            <ThemeToggle />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function Header() {
  const { currentUser, setCurrentUser, allUsers, authenticatedEmail } = useCurrentUser()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')

  const sortedUsers = useMemo(
    () => [...allUsers].sort((a, b) => a.name.localeCompare(b.name)),
    [allUsers],
  )

  const isAdmin = currentUser.role === 'APPROVER' || currentUser.role === 'COUNCIL_MEMBER'

  const navLinks = useMemo(
    () => [...NAV_LINKS, ...(isAdmin ? [ADMIN_LINK] : [])],
    [isAdmin],
  )

  function getRoleBadge(user: User): string | null {
    if (user.role === 'APPROVER') return 'Approver'
    if (user.role === 'COUNCIL_MEMBER') return 'Council Member'
    return null
  }

  function updateUserParam(userId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('user', userId)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function handleSelectUser(user: User) {
    setCurrentUser(user)
    updateUserParam(user.id)
    setOpen(false)
    setShowCustomForm(false)
  }

  function handleCustomUser() {
    if (!customName.trim()) return
    const user: User = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      email: customEmail.trim() || `${customName.trim().toLowerCase().replace(/\s+/g, '.')}@unknown`,
      role: 'STAFF_MEMBER',
      isFixedApprover: false,
    }
    setCurrentUser(user)
    updateUserParam(user.id)
    setOpen(false)
    setShowCustomForm(false)
    setCustomName('')
    setCustomEmail('')
  }

  return (
    <header className="w-full border-b bg-background h-14">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-3 md:gap-6">
          <MobileNav navLinks={navLinks} pathname={pathname} />

          <Link href="/sign-offs" className="flex items-center gap-2">
            <Image
              src="/images/equals-icon.svg"
              alt="Equals"
              width={28}
              height={20}
              className="h-5 w-7"
            />
            <span className="hidden sm:inline text-sm font-bold">Security Approvals</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/15 text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex md:hidden items-center gap-1">
          <Button asChild size="sm">
            <Link href="/sign-offs/new">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Link>
          </Button>
        </div>
        <div className="hidden md:flex items-center gap-1">
          <Button asChild size="sm">
            <Link href="/sign-offs/new">
              <Plus className="h-4 w-4 mr-1" />
              New Sign-Off
            </Link>
          </Button>
          <ThemeToggle />
          {authenticatedEmail ? (
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
              <Avatar size="sm">
                <AvatarFallback className="text-xs">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{currentUser.name}</span>
            </div>
          ) : (
            <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setShowCustomForm(false) }}>
              <PopoverTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors outline-none">
                <Avatar size="sm">
                  <AvatarFallback className="text-xs">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{currentUser.name}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </PopoverTrigger>

              <PopoverContent align="end" className="w-80 p-0">
                {showCustomForm ? (
                  <div className="p-3 space-y-3">
                    <p className="text-sm font-medium">Switch to custom user</p>
                    <Input
                      placeholder="Full name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      autoFocus
                    />
                    <Input
                      placeholder="Email (optional)"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCustomUser() }}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleCustomUser} disabled={!customName.trim()} className="flex-1">
                        Switch
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowCustomForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Command>
                    <CommandInput placeholder="Search people..." />
                    <CommandList className="max-h-72">
                      <CommandEmpty>No user found.</CommandEmpty>
                      <CommandGroup>
                        {sortedUsers.map((user) => {
                          const badge = getRoleBadge(user)
                          return (
                            <CommandItem
                              key={user.id}
                              value={`${user.name} ${user.email}`}
                              onSelect={() => handleSelectUser(user)}
                              className={cn(
                                'flex items-center gap-2 cursor-pointer',
                                user.id === currentUser.id && 'bg-accent',
                              )}
                            >
                              <Avatar size="sm">
                                <AvatarFallback className="text-xs">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium text-sm truncate">{user.name}</span>
                                {badge && (
                                  <span className="text-[10px] text-muted-foreground truncate">{badge}</span>
                                )}
                              </div>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => setShowCustomForm(true)}
                          className="cursor-pointer"
                        >
                          <UserPlus className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">Use a different name...</span>
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                )}
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </header>
  )
}
