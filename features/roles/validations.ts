import { z } from 'zod'

const permissionActionEnum = z.enum(['select', 'insert', 'update', 'delete', 'create', 'read', 'manage'])

/**
 * Form schema for role creation/editing (without org_id - it's added programmatically)
 */
export const roleFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  permissions: z
    .array(permissionActionEnum)
    .min(1, 'At least one permission is required'),
})

export type RoleFormInput = z.infer<typeof roleFormSchema>

/**
 * Server action schema for role creation (includes org_id)
 */
export const addRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  permissions: z
    .array(permissionActionEnum)
    .min(1, 'At least one permission is required'),
  org_id: z.string().uuid('Invalid organization ID'),
})

export type AddRoleInput = z.infer<typeof addRoleSchema>

/**
 * Server action schema for role updates
 */
export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  permissions: z.array(permissionActionEnum).optional(),
})

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
