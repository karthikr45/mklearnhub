'use client'

import {
  AdminHome,
  InstructorHome,
  LearnerHome,
  ParentHome,
  SuperAdminHome,
} from '@/components/dashboard/homes'
import { useAuthStore } from '@/lib/store'

export default function DashboardPage() {
  const role = useAuthStore((s) => s.user?.role)

  switch (role) {
    case 'SUPER_ADMIN':
      return <SuperAdminHome />
    case 'ORG_ADMIN':
      return <AdminHome />
    case 'INSTRUCTOR':
      return <InstructorHome />
    case 'PARENT':
      return <ParentHome />
    case 'LEARNER':
    case 'STUDENT':
      return <LearnerHome />
    default:
      return <LearnerHome />
  }
}
