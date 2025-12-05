'use client'

import * as React from 'react'
import { Building2, Folder, Shield, ChevronRight, UserCog, Users, Mail } from 'lucide-react'
import { NavSwitcher } from '@/components/layout/nav-switcher'
import { NavUser } from '@/components/layout/nav-user'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import type { Organization } from '@/types/database'

export type SettingsSection = 'workspaces' | 'access'
export type AccessSubsection = 'permissions' | 'roles' | 'invitations'

interface SettingsSidebarProps extends React.ComponentProps<typeof Sidebar> {
  organizations: Organization[]
  selectedOrgId: string | null
  onSelectOrg: (org: { id: string; name: string }) => void
  activeSection: SettingsSection
  onSectionChange: (section: SettingsSection) => void
  activeSubsection?: AccessSubsection
  onSubsectionChange?: (subsection: AccessSubsection) => void
  user: {
    name: string
    email: string
    avatar: string
  }
  navigationDisabled?: boolean
}

const accessSubsections: { value: AccessSubsection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    value: 'permissions',
    label: 'Permissions',
    icon: Shield,
  },
  {
    value: 'roles',
    label: 'Roles',
    icon: UserCog,
  },
  {
    value: 'invitations',
    label: 'Invitations',
    icon: Mail,
  },
]

export function SettingsSidebar({
  organizations,
  selectedOrgId,
  onSelectOrg,
  activeSection,
  onSectionChange,
  activeSubsection = 'permissions',
  onSubsectionChange,
  user,
  navigationDisabled,
  ...sidebarProps
}: SettingsSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...sidebarProps}>
      <SidebarHeader>
        <NavSwitcher
          items={organizations}
          selectedId={selectedOrgId}
          onSelect={onSelectOrg}
          icon={Building2}
          label="Organization"
          manageUrl="/settings?section=organizations"
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarMenu>
            {/* Workspaces Section */}
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Workspaces"
                isActive={activeSection === 'workspaces'}
                onClick={() => onSectionChange('workspaces')}
                disabled={navigationDisabled}
                aria-current={activeSection === 'workspaces' ? 'page' : undefined}
              >
                <Folder />
                <span>Workspaces</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Access Section with Collapsible Subsections */}
            <Collapsible
              asChild
              open={activeSection === 'access'}
              onOpenChange={(open) => {
                if (open && !navigationDisabled) {
                  onSectionChange('access')
                }
              }}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip="Access"
                    disabled={navigationDisabled}
                  >
                    <Users />
                    <span>Access</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {accessSubsections.map((subsection) => (
                      <SidebarMenuSubItem key={subsection.value}>
                        <SidebarMenuSubButton
                          isActive={activeSection === 'access' && activeSubsection === subsection.value}
                          onClick={() => {
                            if (!navigationDisabled) {
                              if (activeSection !== 'access') {
                                onSectionChange('access')
                              }
                              onSubsectionChange?.(subsection.value)
                            }
                          }}
                          aria-current={activeSection === 'access' && activeSubsection === subsection.value ? 'page' : undefined}
                          className={navigationDisabled ? 'pointer-events-none opacity-50' : ''}
                        >
                          <subsection.icon className="h-4 w-4" />
                          <span>{subsection.label}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
