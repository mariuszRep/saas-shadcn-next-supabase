'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getAllOrgPermissions } from '@/lib/actions/permissions'
import { toast } from 'sonner'
import type { Role } from '@/lib/types/database'

type ObjectType = 'organization' | 'workspace'

type PermissionWithDetails = {
  id: string
  principal_type: string
  principal_id: string
  role_id: string
  object_type: ObjectType
  object_id: string | null
  role?: Role
  user_email?: string
  user_name?: string
}

function getInitials(email?: string, name?: string) {
  if (name) {
    const parts = name.split(' ')
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }
  return email ? email.slice(0, 2).toUpperCase() : '??'
}

export function PermissionsView({ organizationId }: { organizationId: string }) {
  const [permissions, setPermissions] = useState<PermissionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRows, setSelectedRows] = useState<PermissionWithDetails[]>([])

  useEffect(() => {
    loadPermissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  async function loadPermissions() {
    setLoading(true)
    try {
      const result = await getAllOrgPermissions(organizationId)
      if (result.success && result.permissions) {
        setPermissions(result.permissions as PermissionWithDetails[])
      } else {
        toast.error(result.error || 'Failed to load permissions')
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
      toast.error('Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<PermissionWithDetails>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'user_email',
      header: 'User',
      cell: ({ row }) => {
        const permission = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(permission.user_email, permission.user_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {permission.user_name || permission.user_email}
              </span>
              {permission.user_name && permission.user_email && (
                <span className="text-xs text-muted-foreground">{permission.user_email}</span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'role.name',
      header: 'Role',
      cell: ({ row }) => {
        const permission = row.original
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{permission.role?.name}</span>
            {permission.role?.description && (
              <span className="text-xs text-muted-foreground">{permission.role.description}</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'object_type',
      header: 'Scope',
      cell: ({ row }) => {
        const permission = row.original
        return (
          <span className="text-sm capitalize">{permission.object_type}</span>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const permission = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(permission.id)}
              >
                Copy permission ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Revoke permission
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [])

  return (
    <div className="space-y-4">
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              // Handle bulk delete
              console.log('Delete selected:', selectedRows)
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Revoke {selectedRows.length} permission{selectedRows.length > 1 ? 's' : ''}
          </Button>
        </div>
      )}
      <DataTable
        columns={columns}
        data={permissions}
        searchKey="user_email"
        searchPlaceholder="Filter by email..."
        title="Manage Permissions"
        description="Assign roles to users for organization-level or workspace-level access"
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Permission
          </Button>
        }
        loading={loading}
        enableRowSelection={true}
        onRowSelectionChange={setSelectedRows}
      />
    </div>
  )
}
