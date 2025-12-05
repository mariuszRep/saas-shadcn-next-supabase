import type { PermissionAction, Role } from '@/types/database'

/**
 * Input for creating a new role
 */
export interface CreateRoleInput {
  name: string
  description?: string
  permissions: PermissionAction[]
  org_id: string
}

/**
 * Input for updating an existing role
 */
export interface UpdateRoleInput {
  name?: string
  description?: string
  permissions?: PermissionAction[]
}

/**
 * Re-export Role type for convenience
 */
export type { Role }
