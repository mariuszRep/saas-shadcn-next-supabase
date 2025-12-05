'use client'

import { useOrganizationWorkspaceRequired } from '@/hooks/use-workspace-context'
import { useAuth } from '@/hooks/use-auth'

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
