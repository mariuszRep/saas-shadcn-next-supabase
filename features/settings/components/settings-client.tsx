'use client'

import * as React from 'react'
import { Folder, Shield } from 'lucide-react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { SidebarLayout } from '@/components/layout/sidebar-layout'
import { SettingsSidebar, type SettingsSection, type AccessSubsection } from '@/features/settings/components/settings-sidebar'
import { WorkspaceManager } from '@/features/workspaces/components/workspace-manager'
import { PermissionsView } from '@/features/settings/components/permissions-view'
import { RolesView } from '@/features/settings/components/roles-view'
import { InvitationsManager } from '@/features/settings/components/invitations-manager'
import { getUserOrganizations } from '@/lib/actions/organization-actions'
import type { Organization } from '@/lib/types/database'

interface SettingsClientProps {
  organizations: Organization[]
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function SettingsClient({ organizations: initialOrganizations, user }: SettingsClientProps) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlOrgId = params?.organizationId as string | undefined

  const [activeSection, setActiveSection] = React.useState<SettingsSection>('workspaces')
  const [activeSubsection, setActiveSubsection] = React.useState<AccessSubsection>('permissions')
  const [organizations, setOrganizations] = React.useState<Organization[]>(initialOrganizations)
  const [selectedOrgId, setSelectedOrgId] = React.useState<string | null>(
    urlOrgId || (initialOrganizations.length > 0 ? initialOrganizations[0].id : null)
  )

  // Track if we're currently updating to prevent loops
  const isUpdatingRef = React.useRef(false)

  const selectedOrg = organizations.find(org => org.id === selectedOrgId)

  // Check if we're on an organization-specific settings page
  const isOrgSpecificPage = pathname.includes('/organization/')

  // Sync URL params with state on mount and when URL changes
  React.useEffect(() => {
    if (isUpdatingRef.current) {
      isUpdatingRef.current = false
      return
    }

    const sectionParam = searchParams?.get('section') as SettingsSection | null
    const subsectionParam = searchParams?.get('subsection') as AccessSubsection | null

    if (sectionParam && (sectionParam === 'access' || sectionParam === 'workspaces')) {
      setActiveSection(prev => prev !== sectionParam ? sectionParam : prev)
    }

    if (subsectionParam && (subsectionParam === 'permissions' || subsectionParam === 'roles' || subsectionParam === 'invitations')) {
      setActiveSubsection(prev => prev !== subsectionParam ? subsectionParam : prev)
    }
  }, [searchParams])

  React.useEffect(() => {
    if (urlOrgId) {
      setSelectedOrgId(urlOrgId)
    }
  }, [urlOrgId])

  React.useEffect(() => {
    setOrganizations(initialOrganizations)
    setSelectedOrgId((prev) => {
      if (prev && initialOrganizations.some((org) => org.id === prev)) {
        return prev
      }
      return initialOrganizations[0]?.id ?? null
    })
  }, [initialOrganizations])

  const handleOrganizationsChange = async () => {
    const result = await getUserOrganizations()
    if (result.success && result.organizations) {
      const orgs = result.organizations
      setOrganizations(orgs)
      setSelectedOrgId((prev) => {
        if (prev && orgs.some((org) => org.id === prev)) {
          return prev
        }
        return orgs[0]?.id ?? null
      })
    }
  }

  const handleOrganizationChange = (org: { id: string; name: string }) => {
    setSelectedOrgId(org.id)

    // If we're on an org-specific page, update the URL
    if (isOrgSpecificPage) {
      const params = new URLSearchParams(searchParams?.toString() || '')
      const queryString = params.toString()
      const newPath = `/organization/${org.id}/settings${queryString ? `?${queryString}` : ''}`
      router.push(newPath)
    }
  }

  const handleSectionChange = (section: SettingsSection) => {
    const currentSection = searchParams?.get('section')
    const currentSubsection = searchParams?.get('subsection')

    // Only update if the section is actually changing
    if (currentSection === section) {
      return
    }

    setActiveSection(section)
    const paramsCopy = new URLSearchParams(searchParams?.toString() || '')
    paramsCopy.set('section', section)

    // If switching to access section, set default subsection
    if (section === 'access') {
      paramsCopy.set('subsection', activeSubsection)
    } else {
      paramsCopy.delete('subsection')
    }

    const queryString = paramsCopy.toString()
    isUpdatingRef.current = true
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  const handleSubsectionChange = (subsection: AccessSubsection) => {
    const currentSection = searchParams?.get('section')
    const currentSubsection = searchParams?.get('subsection')

    // Only update if the subsection is actually changing
    if (currentSection === 'access' && currentSubsection === subsection) {
      return
    }

    setActiveSubsection(subsection)
    const paramsCopy = new URLSearchParams(searchParams?.toString() || '')
    paramsCopy.set('section', 'access')
    paramsCopy.set('subsection', subsection)
    const queryString = paramsCopy.toString()
    isUpdatingRef.current = true
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  const renderEmptyState = (title: string, description: string, icon: 'workspaces' | 'permissions') => {
    const Icon = icon === 'workspaces' ? Folder : Shield
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-10 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/5">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-2 text-sm max-w-sm">{description}</p>
        <p className="text-muted-foreground mt-4 text-xs">
          Use the organization switcher to select an organization.
        </p>
      </div>
    )
  }

  const renderAccessContent = () => {
    if (!selectedOrgId) {
      return renderEmptyState(
        'Select an organization to manage access',
        'Pick an organization from the sidebar to view and update member access.',
        'permissions'
      )
    }

    switch (activeSubsection) {
      case 'permissions':
        return <PermissionsView organizationId={selectedOrgId} />
      case 'roles':
        return <RolesView organizationId={selectedOrgId} />
      case 'invitations':
        return <InvitationsManager organizationId={selectedOrgId} />
      default:
        return null
    }
  }

  return (
    <SidebarLayout
      sidebar={
        <SettingsSidebar
          organizations={organizations}
          selectedOrgId={selectedOrgId}
          onSelectOrg={handleOrganizationChange}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          activeSubsection={activeSubsection}
          onSubsectionChange={handleSubsectionChange}
          user={user}
          navigationDisabled={!selectedOrgId}
        />
      }
      header={
        <div>
          <p className="text-sm text-muted-foreground">Organization Settings</p>
          <h1 className="text-lg font-semibold leading-6">
            {selectedOrg?.name || 'Select an organization'}
          </h1>
        </div>
      }
    >
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {activeSection === 'workspaces' ? (
          selectedOrgId && selectedOrg ? (
            <WorkspaceManager
              organizationId={selectedOrgId}
              organizationName={selectedOrg.name}
            />
          ) : (
            renderEmptyState(
              'Select an organization to manage workspaces',
              'Choose an organization from the sidebar to create, edit, or remove workspaces.',
              'workspaces'
            )
          )
        ) : activeSection === 'access' ? (
          renderAccessContent()
        ) : null}
      </div>
    </SidebarLayout>
  )
}
