import { SupabaseClient } from '@supabase/supabase-js'
import type { Organization } from '@/types/database'
import type { CreateOrganizationInput, UpdateOrganizationInput } from '@/features/organizations/validations'

export class OrganizationService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new organization using RPC function (bypasses RLS)
   */
  async createOrganization(
    data: CreateOrganizationInput
  ): Promise<{ id: string; name: string; created_at: string }> {
    const { data: result, error } = await this.supabase
      .rpc('create_organization', { org_name: data.name })
      .single()

    if (error || !result) {
      console.error('Error creating organization:', error)
      throw new Error('Failed to create organization')
    }

    return result as { id: string; name: string; created_at: string }
  }

  /**
   * Get all organizations for the current user (RLS handles filtering)
   */
  async getUserOrganizations(): Promise<Organization[]> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching organizations:', error)
      throw new Error('Failed to fetch organizations')
    }

    return data || []
  }

  /**
   * Update an organization (RLS handles permission checking)
   */
  async updateOrganization(
    organizationId: string,
    data: UpdateOrganizationInput,
    userId: string
  ): Promise<Organization> {
    const { data: result, error } = await this.supabase
      .from('organizations')
      .update({
        name: data.name,
        updated_by: userId,
      })
      .eq('id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating organization:', error)
      throw new Error('Failed to update organization')
    }

    return result
  }

  /**
   * Delete an organization (RLS handles permission checking)
   */
  async deleteOrganization(organizationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId)

    if (error) {
      console.error('Error deleting organization:', error)
      throw new Error('Failed to delete organization')
    }
  }
}
