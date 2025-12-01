'use client'

import { useOrganizationWorkspaceRequired } from '@/features/shared/use-workspace-context'
import { useAuth } from '@/features/auth/use-auth'

export function useWorkspace() {
  const { user, loading: userLoading } = useAuth()
  const { organization, workspace } = useOrganizationWorkspaceRequired()

  return {
    user,
    organization,
    workspace,
    loading: userLoading,
  }
}
