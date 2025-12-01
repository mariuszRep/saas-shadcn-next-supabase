'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getOrganizationInvitations, type InvitationWithDetails } from './invitation-actions'

interface UseInvitationsProps {
  organizationId: string
}

export function useInvitations({ organizationId }: UseInvitationsProps) {
  const router = useRouter()
  const [invitations, setInvitations] = useState<InvitationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInvitations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  async function loadInvitations() {
    try {
      setLoading(true)
      setError(null)

      const result = await getOrganizationInvitations(organizationId)

      if (result.success && result.data) {
        setInvitations(result.data)
      } else {
        setError(result.error || 'Failed to load invitations')
      }
    } catch (err) {
      console.error('Error loading invitations:', err)
      setError('Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }

  return {
    invitations,
    loading,
    error,
    refresh: loadInvitations,
    router,
  }
}
