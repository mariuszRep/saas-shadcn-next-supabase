import { z } from 'zod'

/**
 * Validation schema for sending an invitation
 */
export const sendInvitationSchema = z.object({
  email: z.string().email('Invalid email format'),
  orgRoleId: z.string().uuid('Invalid organization role ID'),
  orgId: z.string().uuid('Invalid organization ID'),
  inviterId: z.string().uuid('Invalid inviter ID'),
  redirectUrl: z.string().url().optional(),
})

/**
 * Validation schema for workspace permission assignment
 */
export const workspacePermissionSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  roleId: z.string().uuid('Invalid role ID'),
})

/**
 * Validation schema for assigning workspace permissions
 */
export const assignWorkspacePermissionsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  workspacePermissions: z.array(workspacePermissionSchema),
})

/**
 * Validation schema for accepting an invitation
 */
export const acceptInvitationSchema = z.object({
  invitationId: z.string().uuid('Invalid invitation ID'),
})

export type SendInvitationParams = z.infer<typeof sendInvitationSchema>
export type WorkspacePermission = z.infer<typeof workspacePermissionSchema>
export type AssignWorkspacePermissionsParams = z.infer<typeof assignWorkspacePermissionsSchema>
export type AcceptInvitationParams = z.infer<typeof acceptInvitationSchema>
