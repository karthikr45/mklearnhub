export type Role =
  | 'SUPER_ADMIN'
  | 'ORG_ADMIN'
  | 'INSTRUCTOR'
  | 'LEARNER'
  | 'STUDENT'
  | 'PARENT'

export const ADMIN_ROLES: Role[] = ['ORG_ADMIN', 'SUPER_ADMIN']
export const STAFF_ROLES: Role[] = ['ORG_ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR']
export const LEARNER_ROLES: Role[] = ['LEARNER', 'STUDENT']

export function isAdmin(role?: string | null): boolean {
  return role === 'ORG_ADMIN' || role === 'SUPER_ADMIN'
}

/**
 * Which nav item / route prefix each role may use. Order matters for the
 * sidebar. `roles` lists the roles that see the item.
 */
export interface NavEntry {
  href: string
  label: string
  icon: string // lucide icon key, mapped in the Sidebar
  roles: Role[]
}

const ALL: Role[] = [
  'SUPER_ADMIN',
  'ORG_ADMIN',
  'INSTRUCTOR',
  'LEARNER',
  'STUDENT',
  'PARENT',
]

export const NAV_ENTRIES: NavEntry[] = [
  { href: '/dashboard', label: 'Home', icon: 'home', roles: ALL },
  // Learner / student
  { href: '/dashboard/learning', label: 'My Learning', icon: 'grad', roles: LEARNER_ROLES },
  { href: '/dashboard/explore', label: 'Explore', icon: 'compass', roles: LEARNER_ROLES },
  { href: '/dashboard/certificates', label: 'Certificates', icon: 'award', roles: LEARNER_ROLES },
  { href: '/dashboard/my-class', label: 'My Class', icon: 'school', roles: ['STUDENT'] },
  { href: '/dashboard/study', label: 'Practice', icon: 'target', roles: ['STUDENT'] },
  { href: '/dashboard/groups', label: 'Study Groups', icon: 'messages', roles: ['STUDENT'] },
  { href: '/dashboard/doubts', label: 'Doubts', icon: 'help', roles: ['STUDENT'] },
  // Parent
  { href: '/dashboard/children', label: 'My Children', icon: 'users', roles: ['PARENT'] },
  // Shared reading
  { href: '/dashboard/knowledge', label: 'Knowledge', icon: 'book', roles: ['ORG_ADMIN', 'INSTRUCTOR', 'LEARNER', 'STUDENT'] },
  { href: '/dashboard/assessments', label: 'Assessments', icon: 'clipboard', roles: ['ORG_ADMIN', 'INSTRUCTOR', 'LEARNER', 'STUDENT'] },
  // Staff (admin + instructor)
  { href: '/dashboard/courses', label: 'Courses', icon: 'grad', roles: STAFF_ROLES },
  { href: '/dashboard/school', label: 'School', icon: 'school', roles: STAFF_ROLES },
  { href: '/dashboard/analytics', label: 'Analytics', icon: 'chart', roles: STAFF_ROLES },
  { href: '/dashboard/safety', label: 'Safety', icon: 'shield', roles: STAFF_ROLES },
  // Admin only
  { href: '/dashboard/portals', label: 'Portals', icon: 'globe', roles: ['ORG_ADMIN'] },
  { href: '/dashboard/members', label: 'Members', icon: 'users', roles: ['ORG_ADMIN'] },
  { href: '/dashboard/settings', label: 'Settings', icon: 'settings', roles: ['ORG_ADMIN'] },
]

export function navForRole(role?: string | null): NavEntry[] {
  const r = (role ?? 'LEARNER') as Role
  return NAV_ENTRIES.filter((e) => e.roles.includes(r))
}

/**
 * Route access. A role may open a dashboard path if some nav entry it can see
 * is a prefix of that path. `/dashboard` itself is always allowed.
 */
export function canAccess(role: string | null | undefined, pathname: string): boolean {
  if (pathname === '/dashboard' || pathname === '/dashboard/profile') return true
  const entries = navForRole(role)
  return entries.some(
    (e) => e.href !== '/dashboard' && pathname.startsWith(e.href),
  )
}
