'use client'

import { useOrganizationWorkspaceRequired } from '@/components/providers/organization-workspace-provider'
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
