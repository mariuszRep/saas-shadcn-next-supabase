import { z } from 'zod'

/**
 * Validation schema for workspace name
 */
export const workspaceNameSchema = z
  .string()
  .trim()
  .min(1, 'Workspace name is required')
  .max(100, 'Workspace name is too long')

/**
 * Validation schema for creating a workspace
 */
export const createWorkspaceSchema = z.object({
  name: workspaceNameSchema,
  organizationId: z.string().uuid('Invalid organization ID'),
})

/**
 * Validation schema for updating a workspace
 */
export const updateWorkspaceSchema = z.object({
  name: workspaceNameSchema,
})

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>
