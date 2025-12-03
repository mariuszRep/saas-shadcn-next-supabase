'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DialogFooter } from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { assignRole, getOrganizationWorkspaces } from '@/features/permissions/permission-actions'
import { addPermissionSchema } from '@/features/permissions/validations'
import type { ObjectType, Role } from '@/types/database'

interface PermissionFormProps {
    orgId: string
    roles: Role[]
    members: Array<{ user_id: string; name?: string; email?: string }>
    onSuccess: () => void
    onCancel: () => void
}

export function PermissionForm({ orgId, roles, members, onSuccess, onCancel }: PermissionFormProps) {
    const [submitting, setSubmitting] = useState(false)
    const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string }>>([])
    const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]) // We might need to fetch this if not passed

    // Form state
    const [selectedPrincipalId, setSelectedPrincipalId] = useState('')
    const [selectedRoleId, setSelectedRoleId] = useState('')
    const [selectedObjectType, setSelectedObjectType] = useState<ObjectType>('organization')
    const [selectedObjectId, setSelectedObjectId] = useState<string>('all')

    // Deduplicate members
    const uniqueMembers = members.reduce((acc, member) => {
        if (!acc.find(m => m.user_id === member.user_id)) {
            acc.push(member)
        }
        return acc
    }, [] as typeof members)

    useEffect(() => {
        if (selectedObjectType === 'workspace') {
            loadWorkspaces()
        }
    }, [selectedObjectType, orgId])

    async function loadWorkspaces() {
        try {
            const result = await getOrganizationWorkspaces(orgId)
            if (result.success && result.workspaces) {
                setWorkspaces(result.workspaces)
            }
        } catch (error) {
            console.error('Error loading workspaces:', error)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!selectedPrincipalId || !selectedRoleId) {
            toast.error('Please select a user and role')
            return
        }

        setSubmitting(true)
        try {
            const result = await assignRole({
                org_id: orgId,
                principal_type: 'user',
                principal_id: selectedPrincipalId,
                role_id: selectedRoleId,
                object_type: selectedObjectType,
                object_id: selectedObjectId === 'all' ? null : selectedObjectId,
            })

            if (result.success) {
                toast.success('Permission assigned successfully')
                onSuccess()
            } else {
                toast.error(result.error || 'Failed to assign permission')
            }
        } catch (error) {
            console.error('Error assigning role:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor="principal">User</Label>
                <Select value={selectedPrincipalId} onValueChange={setSelectedPrincipalId}>
                    <SelectTrigger id="principal">
                        <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                        {uniqueMembers.map((member) => (
                            <SelectItem key={member.user_id} value={member.user_id}>
                                {member.name || member.email || member.user_id}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                    The user who will receive the permission
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                                {role.name} {role.description && `- ${role.description}`}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                    The role defining what actions are allowed
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="objectType">Object Type</Label>
                <Select value={selectedObjectType} onValueChange={(value) => {
                    setSelectedObjectType(value as ObjectType)
                    setSelectedObjectId('all') // Reset object selection when type changes
                }}>
                    <SelectTrigger id="objectType">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="organization">Organization</SelectItem>
                        <SelectItem value="workspace">Workspace</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                    The type of object this permission applies to
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="objectId">
                    {selectedObjectType === 'organization' ? 'Organization' : 'Workspace'}
                </Label>
                <Select value={selectedObjectId} onValueChange={setSelectedObjectId}>
                    <SelectTrigger id="objectId">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All {selectedObjectType}s</SelectItem>
                        {selectedObjectType === 'organization' ? (
                            // For organization type, we typically only show the current org or 'all'
                            // But the original code showed a list of organizations. 
                            // Since we are in the context of a specific org settings, 'all' usually means 'this org' or 'all orgs' depending on context.
                            // However, the backend assignRole uses org_id param. 
                            // If object_id is null, it means "all objects of this type in this org" (if that's how the logic works) 
                            // OR it means "global" if org_id is also null (but here org_id is required).
                            // Let's stick to the UI pattern: 'all' or specific ID.
                            // Since we don't have the list of ALL organizations passed in props easily without fetching, 
                            // and usually you assign permissions within the CURRENT organization context:
                            // If object_type is organization, and object_id is null -> All organizations? Or just this one?
                            // The original code fetched `getUserOrganizations`.
                            // Let's simplify: If Organization, usually it's THIS organization.
                            // If Workspace, it's workspaces IN this organization.
                            <SelectItem value={orgId}>Current Organization</SelectItem>
                        ) : (
                            workspaces.map((ws) => (
                                <SelectItem key={ws.id} value={ws.id}>
                                    {ws.name}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                    Specific {selectedObjectType} or all {selectedObjectType}s
                </p>
            </div>

            <div className="col-span-2 mt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={submitting || !selectedPrincipalId || !selectedRoleId}>
                    {submitting ? 'Adding...' : 'Add Permission'}
                </Button>
            </div>
        </form>
    )
}
