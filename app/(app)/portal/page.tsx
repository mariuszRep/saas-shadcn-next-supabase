import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { acceptInvitation } from '@/features/invitations/invitation-actions'

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
      // Redirect to a dedicated invitation acceptance route
      redirect(`/accept-invitation?id=${pendingInvitation.id}`)
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
  const { data: firstWorkspace } = await supabase
    .from('workspaces')
    .select('id, organization_id')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()

  // If user has workspace access anywhere, redirect to that workspace
  if (firstWorkspace) {
    redirect(`/organization/${firstWorkspace.organization_id}/workspace/${firstWorkspace.id}`)
  }

  // Query 2: No workspace access - check if user has organization-level access
  const { data: firstOrg } = await supabase
    .from('organizations')
    .select('id')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (firstOrg) {
    // User has org access but no workspaces - redirect to onboarding to create/select workspace
    redirect('/onboarding')
  }

  // No workspace or organization access - redirect to onboarding to create org
  redirect('/onboarding')
}
