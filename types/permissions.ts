import type {
  PrincipalType,
  ObjectType,
  PermissionAction,
  Permission,
} from '@/types/database'

/**
 * Permission with additional details including role and user information
 */
export interface PermissionWithDetails extends Permission {
  role?: any
  user_email?: string
  user_name?: string
}

/**
 * Parameters for assigning a role to a principal
 */
export interface AssignRoleParams {
  org_id: string
  principal_type: PrincipalType
  principal_id: string
  role_id: string
  object_type: ObjectType
  object_id: string | null
}

/**
 * Parameters for checking if a user has permission to perform an action
 */
export interface CheckPermissionParams {
  user_id: string
  object_type: ObjectType
  object_id: string
  action: PermissionAction
}

/**
 * Organization member with role and user details
 */
export interface OrgMember {
  org_id: string
  user_id: string
  role_id: string
  role_name: string
  email?: string
  name?: string
}

/**
 * Workspace member with role information
 */
export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role_id: string
  role_name: string
}
