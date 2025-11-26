import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { acceptInvitation } from '@/lib/actions/invitation-actions'

export default async function PortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check for pending invitations first
  const { data: pendingInvitation } = await supabase
    .from('invitations')
    .select('id, status, expires_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pendingInvitation) {
    const now = new Date()
    const expiresAt = new Date(pendingInvitation.expires_at)

    if (now <= expiresAt) {
      // Accept invitation and redirect to refresh permissions
      await acceptInvitation(pendingInvitation.id)
      redirect('/portal')
    } else {
      // Mark as expired
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', pendingInvitation.id)
    }
  }

  // Query 1: Get first available workspace across ALL organizations (RLS filters by user permissions)
  // Check workspaces first - user might have workspace access in any organization
  const { data: firstWorkspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, organization_id')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()

  console.log('[PORTAL] Workspace query result:', JSON.stringify({ firstWorkspace, workspaceError }, null, 2))

  // If user has workspace access anywhere, redirect to that workspace
  if (firstWorkspace) {
    console.log('[PORTAL] Redirecting to workspace:', firstWorkspace.id)
    redirect(`/organization/${firstWorkspace.organization_id}/workspace/${firstWorkspace.id}`)
  }

  // Query 2: No workspace access - check if user has organization-level access
  const { data: firstOrg, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()

  console.log('[PORTAL] Organization query result:', JSON.stringify({ firstOrg, orgError }, null, 2))

  if (firstOrg) {
    console.log('[PORTAL] Has org but no workspace - redirecting to onboarding')
    // User has org access but no workspaces - redirect to onboarding to create/select workspace
    redirect('/onboarding')
  }

  console.log('[PORTAL] No org or workspace - redirecting to onboarding')
  // No workspace or organization access - redirect to onboarding to create org
  redirect('/onboarding')
}
