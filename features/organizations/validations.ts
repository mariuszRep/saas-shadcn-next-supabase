import { z } from 'zod'

/**
 * Validation schema for organization name
 */
export const organizationNameSchema = z
  .string()
  .trim()
  .min(1, 'Organization name is required')
  .max(100, 'Organization name is too long')

/**
 * Validation schema for creating an organization
 */
export const createOrganizationSchema = z.object({
  name: organizationNameSchema,
})

/**
 * Validation schema for updating an organization
 */
export const updateOrganizationSchema = z.object({
  name: organizationNameSchema,
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
