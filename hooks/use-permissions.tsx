'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import {
  getAllOrgPermissions,
  getOrgMembers,
  getUserOrganizations,
  getOrganizationWorkspaces,
  assignRole as assignRoleAction,
  revokeRole as revokeRoleAction,
} from '@/features/permissions/permission-actions'
import { getAllRoles } from '@/features/roles/role-actions'
import type { Role, Permission } from '@/types/database'
import type { PermissionWithDetails, OrgMember, AssignRoleParams } from '@/types/permissions'

interface UsePermissionsProps {
  organizationId: string
}

interface UsePermissionsReturn {
  // Data
  permissions: PermissionWithDetails[]
  members: OrgMember[]
  roles: Role[]
  organizations: Array<{ id: string; name: string }>
  workspaces: Array<{ id: string; name: string }>

  // State
  loading: boolean
  error: string | null

  // Actions
  refresh: () => Promise<void>
  loadWorkspaces: () => Promise<void>
  assignPermission: (params: AssignRoleParams) => Promise<{ success: boolean; permission?: Permission; error?: string }>
  revokePermission: (permissionId: string) => Promise<{ success: boolean; error?: string }>
}

export function usePermissions({ organizationId }: UsePermissionsProps): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<PermissionWithDetails[]>([])
  const [members, setMembers] = useState<OrgMember[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Track if we've loaded data to prevent duplicate fetches
  const loadedRef = useRef(false)
  const currentOrgIdRef = useRef<string | null>(null)

  // Memoize loadData so it doesn't change on every render
  const loadData = useCallback(async () => {
    console.log('[usePermissions] loadData called for org:', organizationId)
    try {
      setLoading(true)
      setError(null)

      // Load organization members with email/name
      const membersResult = await getOrgMembers(organizationId)
      if (membersResult.success && membersResult.members) {
        setMembers(membersResult.members)
      }

      // Load all available roles
      const rolesResult = await getAllRoles()
      if (rolesResult.success && rolesResult.roles) {
        setRoles(rolesResult.roles)
      }

      // Load organizations user has access to
      const orgsResult = await getUserOrganizations()
      if (orgsResult.success && orgsResult.organizations) {
        setOrganizations(orgsResult.organizations)
      }

      // Load ALL permissions for this organization (all object types)
      const permsResult = await getAllOrgPermissions(organizationId)
      if (permsResult.success && permsResult.permissions) {
        setPermissions(permsResult.permissions as PermissionWithDetails[])
      } else {
        setError(permsResult.error || 'Failed to load permissions')
      }
    } catch (err) {
      console.error('Error loading permissions data:', err)
      setError('Failed to load permissions')
      toast.error('Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    console.log('[usePermissions] useEffect running', {
      loaded: loadedRef.current,
      currentOrgId: currentOrgIdRef.current,
      newOrgId: organizationId
    })
    // Only load if we haven't loaded yet or if the org ID changed
    if (!loadedRef.current || currentOrgIdRef.current !== organizationId) {
      console.log('[usePermissions] Triggering loadData')
      currentOrgIdRef.current = organizationId
      loadedRef.current = true
      loadData()
    }
    // We intentionally only depend on organizationId here to prevent loops
    // loadData is stable and only changes when organizationId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  const loadWorkspacesData = useCallback(async () => {
    try {
      const result = await getOrganizationWorkspaces(organizationId)
      if (result.success && result.workspaces) {
        setWorkspaces(result.workspaces)
      }
    } catch (err) {
      console.error('Error loading workspaces:', err)
    }
  }, [organizationId])

  const assignPermission = useCallback(async (params: AssignRoleParams) => {
    try {
      const result = await assignRoleAction(params)

      if (result.success) {
        // Refresh permissions data after successful assignment
        await loadData()
      }

      return result
    } catch (err) {
      console.error('Error assigning permission:', err)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }, [loadData])

  const revokePermission = useCallback(async (permissionId: string) => {
    try {
      const result = await revokeRoleAction(permissionId)

      if (result.success) {
        // Refresh permissions data after successful revocation
        await loadData()
      }

      return result
    } catch (err) {
      console.error('Error revoking permission:', err)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }, [loadData])

  return {
    permissions,
    members,
    roles,
    organizations,
    workspaces,
    loading,
    error,
    refresh: loadData,
    loadWorkspaces: loadWorkspacesData,
    assignPermission,
    revokePermission,
  }
}
