import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Role, CreateRoleInput, UpdateRoleInput } from '@/types/roles'

/**
 * RoleService - Encapsulates all role-related database operations
 *
 * This service class provides methods for creating, reading, updating, and deleting roles.
 * It accepts a SupabaseClient instance in the constructor to maintain database connection.
 */
export class RoleService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Create a new role
   * @param data - Role creation input
   * @returns Success result with created role or error
   */
  async createRole(data: CreateRoleInput): Promise<{
    success: boolean
    role?: Role
    error?: string
  }> {
    try {
      const { data: role, error } = await this.supabase
        .from('roles')
        .insert({
          name: data.name,
          description: data.description || null,
          permissions: data.permissions,
          org_id: data.org_id,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating role:', error)
        return { success: false, error: error.message }
      }

      return { success: true, role: role as Role }
    } catch (error) {
      console.error('Error creating role:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Update an existing role
   * @param id - Role ID
   * @param data - Role update input
   * @returns Success result with updated role or error
   */
  async updateRole(
    id: string,
    data: UpdateRoleInput
  ): Promise<{
    success: boolean
    role?: Role
    error?: string
  }> {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.permissions !== undefined) updateData.permissions = data.permissions

      const { data: role, error } = await this.supabase
        .from('roles')
        .update(updateData)
        .eq('id', id)
        .is('deleted_at', null)
        .select()
        .single()

      if (error) {
        console.error('Error updating role:', error)
        return { success: false, error: error.message }
      }

      return { success: true, role: role as Role }
    } catch (error) {
      console.error('Error updating role:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Soft delete a role by setting deleted_at timestamp
   * @param id - Role ID
   * @returns Success result or error
   */
  async deleteRole(id: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await this.supabase
        .from('roles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .is('deleted_at', null)

      if (error) {
        console.error('Error deleting role:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error deleting role:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get all roles, optionally filtered by organization
   * @param orgId - Optional organization ID to filter roles
   * @returns Success result with roles array or error
   */
  async getRoles(orgId?: string): Promise<{
    success: boolean
    roles?: Role[]
    error?: string
  }> {
    try {
      let query = this.supabase
        .from('roles')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (orgId) {
        // Include both org-specific roles and system-wide roles (null org_id)
        query = query.or(`org_id.eq.${orgId},org_id.is.null`)
      } else {
        // Only system-wide roles
        query = query.is('org_id', null)
      }

      const { data: roles, error } = await query

      if (error) {
        console.error('Error fetching roles:', error)
        return { success: false, error: error.message }
      }

      return { success: true, roles: roles as Role[] }
    } catch (error) {
      console.error('Error fetching roles:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
