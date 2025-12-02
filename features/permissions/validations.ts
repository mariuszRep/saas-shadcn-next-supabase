import { z } from 'zod'

// =====================================================
// PERMISSION SCHEMAS
// =====================================================

const permissionActionEnum = z.enum(['select', 'insert', 'update', 'delete', 'create', 'read', 'manage'])
const objectTypeEnum = z.enum(['organization', 'workspace'])

export const addPermissionSchema = z.object({
  principal_id: z.string().uuid('Invalid user ID'),
  role_id: z.string().uuid('Invalid role ID'),
  object_type: objectTypeEnum,
  object_id: z.string().uuid('Invalid object ID').nullable(),
})

export type AddPermissionInput = z.infer<typeof addPermissionSchema>
