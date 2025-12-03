'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { WorkspaceService } from '@/services/workspace-service'
import { createWorkspaceSchema, updateWorkspaceSchema } from './validations'
import type { Workspace } from '@/types/database'

// =====================================================
// CACHE FUNCTIONS FOR SERVER COMPONENTS
// =====================================================

/**
 * Cache the organization fetch to deduplicate across Server Components
 */
export const getOrganization = cache(async (organizationId: string) => {
  const supabase = await createClient()
  const workspaceService = new WorkspaceService(supabase)
  return workspaceService.getOrganization(organizationId)
})

/**
 * Cache the workspace fetch to deduplicate across Server Components
 */
export const getWorkspace = cache(async (workspaceId: string, organizationId: string) => {
  const supabase = await createClient()
  const workspaceService = new WorkspaceService(supabase)
  return workspaceService.getWorkspace(workspaceId, organizationId)
})

/**
 * Get user's personal organization and workspace for redirect
 */
export const getPersonalWorkspace = cache(async (userId: string) => {
  const supabase = await createClient()
  const workspaceService = new WorkspaceService(supabase)
  return workspaceService.getPersonalWorkspace(userId)
})

/**
 * Get first workspace for an organization
 */
export async function getFirstWorkspaceForOrg(organizationId: string): Promise<string> {
  const supabase = await createClient()
  const workspaceService = new WorkspaceService(supabase)
  return workspaceService.getFirstWorkspaceForOrg(organizationId)
}

// =====================================================
// WORKSPACE MUTATION ACTIONS
// =====================================================

export async function createWorkspace(organizationId: string, name: string): Promise<{
  success: boolean
  workspace?: Workspace
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    const validation = createWorkspaceSchema.safeParse({ name, organizationId })
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message }
    }

    // Create workspace using service
    const workspaceService = new WorkspaceService(supabase)
    const workspace = await workspaceService.createWorkspace(validation.data, user.id)

    // Revalidate the path to refresh data
    revalidatePath(`/organization/${organizationId}`)

    return { success: true, workspace }
  } catch (error) {
    console.error('Unexpected error creating workspace:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return { success: false, error: errorMessage }
  }
}

export async function getOrganizationWorkspaces(organizationId: string): Promise<{
  success: boolean
  workspaces?: Workspace[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Fetch workspaces using service
    const workspaceService = new WorkspaceService(supabase)
    const workspaces = await workspaceService.getOrganizationWorkspaces(organizationId)

    return { success: true, workspaces }
  } catch (error) {
    console.error('Unexpected error fetching workspaces:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return { success: false, error: errorMessage }
  }
}

export async function updateWorkspace(workspaceId: string, name: string): Promise<{
  success: boolean
  workspace?: Workspace
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    const validation = updateWorkspaceSchema.safeParse({ name })
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message }
    }

    // Update workspace using service
    const workspaceService = new WorkspaceService(supabase)
    const workspace = await workspaceService.updateWorkspace(workspaceId, validation.data, user.id)

    // Revalidate path
    revalidatePath('/settings')

    return { success: true, workspace }
  } catch (error) {
    console.error('Unexpected error updating workspace:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return { success: false, error: errorMessage }
  }
}

export async function deleteWorkspace(workspaceId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Delete workspace using service
    const workspaceService = new WorkspaceService(supabase)
    const result = await workspaceService.deleteWorkspace(workspaceId)

    if (result.isPersonal) {
      return { success: false, error: 'Cannot delete personal workspace' }
    }

    // Revalidate path
    revalidatePath('/settings')

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting workspace:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return { success: false, error: errorMessage }
  }
}
