'use client'

import { useState, useMemo } from 'react'
import { Plus, MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table'
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
import { toast } from 'sonner'
import type { Role } from '@/types/database'
import type { PermissionWithDetails } from '@/types/permissions'
import { usePermissions } from '@/hooks/use-permissions'
import { PermissionForm } from './permission-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

function getInitials(email?: string, name?: string) {
  if (name) {
    const parts = name.split(' ')
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }
  return email ? email.slice(0, 2).toUpperCase() : '??'
}

interface PermissionsListProps {
  organizationId: string
}

export function PermissionsList({ organizationId }: PermissionsListProps) {
  // Use the permissions hook for data fetching
  const { permissions, members, roles, loading, revokePermission, refresh } = usePermissions({ organizationId })

  // Dialog states
  const [addPermissionOpen, setAddPermissionOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bulkRevokeDialogOpen, setBulkRevokeDialogOpen] = useState(false)
  const [permissionToDelete, setPermissionToDelete] = useState<PermissionWithDetails | null>(null)
  const [selectedRows, setSelectedRows] = useState<PermissionWithDetails[]>([])

  async function handleDeletePermission() {
    if (!permissionToDelete) return

    try {
      const result = await revokePermission(permissionToDelete.id)
      if (result.success) {
        toast.success('Permission revoked successfully')
        setDeleteDialogOpen(false)
        setPermissionToDelete(null)
      } else {
        toast.error(result.error || 'Failed to revoke permission')
      }
    } catch (error) {
      console.error('Error revoking permission:', error)
      toast.error('An unexpected error occurred')
    }
  }

  async function handleBulkRevoke() {
    if (selectedRows.length === 0) return

    try {
      let successCount = 0
      let failCount = 0

      for (const permission of selectedRows) {
        const result = await revokePermission(permission.id)
        if (result.success) {
          successCount++
        } else {
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Revoked ${successCount} permission(s)`)
      }
      if (failCount > 0) {
        toast.error(`Failed to revoke ${failCount} permission(s)`)
      }

      setBulkRevokeDialogOpen(false)
      setSelectedRows([])
    } catch (error) {
      console.error('Error revoking permissions:', error)
      toast.error('An unexpected error occurred')
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
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  setPermissionToDelete(permission)
                  setDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Revoke permission
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [])

  // Bulk action button to render in toolbar
  const bulkActionButton = selectedRows.length > 0 ? (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => setBulkRevokeDialogOpen(true)}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Revoke ({selectedRows.length})
    </Button>
  ) : null

  return (
    <>
      <DataTable
        columns={columns}
        data={permissions}
        searchKey="user_email"
        searchPlaceholder="Filter by email..."
        title="Manage Permissions"
        description="Assign roles to users for organization-level or workspace-level access"
        action={
          <Button
            size="sm"
            onClick={() => setAddPermissionOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Permission
          </Button>
        }
        loading={loading}
        enableRowSelection={true}
        onRowSelectionChange={setSelectedRows}
        bulkActions={bulkActionButton}
      />

      {/* Add Permission Dialog */}
      <Dialog open={addPermissionOpen} onOpenChange={setAddPermissionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Permission</DialogTitle>
            <DialogDescription>
              Assign a role to a user for an organization or workspace
            </DialogDescription>
          </DialogHeader>
          <PermissionForm
            orgId={organizationId}
            roles={roles}
            members={members}
            onSuccess={() => {
              setAddPermissionOpen(false)
            }}
            onCancel={() => setAddPermissionOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Revoke Permission Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Permission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke <strong>{permissionToDelete?.user_name || permissionToDelete?.user_email}</strong>
              &apos;s <strong>{permissionToDelete?.role?.name}</strong> role on{' '}
              <strong>
                {permissionToDelete?.object_type} {permissionToDelete?.object_id ? (permissionToDelete.object_id === 'all' ? '(All)' : 'Specific') : '(All)'}
              </strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePermission}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Permission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Revoke Confirmation Dialog */}
      <AlertDialog open={bulkRevokeDialogOpen} onOpenChange={setBulkRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke {selectedRows.length} Permission(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke permissions for the following users:
            </AlertDialogDescription>
            <ul className="mt-2 list-disc list-inside">
              {selectedRows.slice(0, 5).map((permission) => (
                <li key={permission.id}>
                  <strong>{permission.user_name || permission.user_email}</strong> - {permission.role?.name}
                </li>
              ))}
              {selectedRows.length > 5 && (
                <li>...and {selectedRows.length - 5} more</li>
              )}
            </ul>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke {selectedRows.length} Permission(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

