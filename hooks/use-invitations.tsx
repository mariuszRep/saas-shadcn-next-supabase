'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getOrganizationInvitations, type InvitationWithDetails } from '@/features/invitations/invitation-actions'

interface UseInvitationsProps {
  organizationId: string
}

export function useInvitations({ organizationId }: UseInvitationsProps) {
  const router = useRouter()
  const [invitations, setInvitations] = useState<InvitationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Track if we've loaded data to prevent duplicate fetches
  const loadedRef = useRef(false)
  const currentOrgIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Only load if we haven't loaded yet or if the org ID changed
    if (!loadedRef.current || currentOrgIdRef.current !== organizationId) {
      currentOrgIdRef.current = organizationId
      loadedRef.current = true
      loadInvitations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
