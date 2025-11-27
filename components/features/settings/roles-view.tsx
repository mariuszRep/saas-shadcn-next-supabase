'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { ColumnDef } from '@tanstack/react-table'
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
import { getAllRoles } from '@/lib/actions/permissions'
import { toast } from 'sonner'
import type { Role } from '@/lib/types/database'

type PermissionAction = 'read' | 'create' | 'update' | 'delete'

function getActionBadgeVariant(action: PermissionAction) {
  switch (action) {
    case 'read':
      return 'secondary'
    case 'create':
      return 'default'
    case 'update':
      return 'outline'
    case 'delete':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export function RolesView({ organizationId }: { organizationId: string }) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRows, setSelectedRows] = useState<Role[]>([])

  useEffect(() => {
    loadRoles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  async function loadRoles() {
    setLoading(true)
    try {
      const result = await getAllRoles()
      if (result.success && result.roles) {
        setRoles(result.roles)
      } else {
        toast.error(result.error || 'Failed to load roles')
      }
    } catch (error) {
      console.error('Error loading roles:', error)
      toast.error('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<Role>[] = useMemo(() => [
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
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const role = row.original
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{role.name}</span>
            {role.description && (
              <span className="text-xs text-muted-foreground">{role.description}</span>
            )}
          </div>
        )
      },
    },
    {
      id: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => {
        const role = row.original
        const permissions = Array.isArray(role.permissions) ? role.permissions as PermissionAction[] : []
        return (
          <div className="flex flex-wrap gap-1">
            {permissions.map((action) => (
              <Badge key={action} variant={getActionBadgeVariant(action)} className="text-xs">
                {action}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: 'scope',
      header: 'Scope',
      cell: ({ row }) => {
        const role = row.original
        return (
          <span className="text-sm capitalize">{role.scope || 'Global'}</span>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const role = row.original
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
                onClick={() => navigator.clipboard.writeText(role.id)}
              >
                Copy role ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                Edit role
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete role
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
            Delete {selectedRows.length} role{selectedRows.length > 1 ? 's' : ''}
          </Button>
        </div>
      )}
      <DataTable
        columns={columns}
        data={roles}
        searchKey="name"
        searchPlaceholder="Filter by name..."
        title="Manage Roles"
        description="Create and manage roles that define permission sets"
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        }
        loading={loading}
        enableRowSelection={true}
        onRowSelectionChange={setSelectedRows}
      />
    </div>
  )
}
