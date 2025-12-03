'use client'

import { useMemo } from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table'
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
import { useRoles } from '@/hooks/use-roles'
import { RoleForm } from './role-form'
import type { Role, PermissionAction } from '@/types/database'
import { useState } from 'react'

function getActionBadgeVariant(action: PermissionAction) {
  switch (action) {
    case 'read':
    case 'select':
      return 'secondary'
    case 'create':
    case 'insert':
      return 'default'
    case 'update':
      return 'outline'
    case 'delete':
      return 'destructive'
    default:
      return 'secondary'
  }
}

interface RolesListProps {
  organizationId: string
}

export function RolesList({ organizationId }: RolesListProps) {
  // Use the roles hook for data fetching and dialog state
  const {
    roles,
    loading,
    deleteRole,
    addRoleOpen,
    editRoleOpen,
    selectedRole,
    openAddRoleDialog,
    openEditRoleDialog,
    closeRoleDialog,
  } = useRoles({ organizationId })

  // Local state for delete dialogs and row selection
  const [deleteRoleDialogOpen, setDeleteRoleDialogOpen] = useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [selectedRows, setSelectedRows] = useState<Role[]>([])

  async function handleDeleteRole() {
    if (!roleToDelete) return

    const result = await deleteRole(roleToDelete.id)
    if (result.success) {
      setDeleteRoleDialogOpen(false)
      setRoleToDelete(null)
    }
  }

  async function handleBulkDelete() {
    if (selectedRows.length === 0) return

    let successCount = 0
    let failCount = 0

    for (const role of selectedRows) {
      const result = await deleteRole(role.id)
      if (result.success) {
        successCount++
      } else {
        failCount++
      }
    }

    setBulkDeleteDialogOpen(false)
    setSelectedRows([])
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
            <span className="text-sm font-medium capitalize">{role.name}</span>
            {role.description && (
              <span className="text-xs text-muted-foreground line-clamp-2">{role.description}</span>
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
      id: 'scope',
      header: 'Scope',
      cell: ({ row }) => {
        const role = row.original
        return (
          <Badge variant="outline" className="text-xs">
            {role.org_id ? 'Organization' : 'System'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const role = row.original
        // Don't allow editing system roles
        if (!role.org_id) return null

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
              <DropdownMenuItem onClick={() => openEditRoleDialog(role)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit role
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  setRoleToDelete(role)
                  setDeleteRoleDialogOpen(true)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete role
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [openEditRoleDialog])

  // Bulk action button to render in toolbar
  const bulkActionButton = selectedRows.length > 0 ? (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => setBulkDeleteDialogOpen(true)}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Delete ({selectedRows.length})
    </Button>
  ) : null

  return (
    <>
      <DataTable
        columns={columns}
        data={roles}
        searchKey="name"
        searchPlaceholder="Filter by name..."
        title="Manage Roles"
        description="Create and manage roles that define permission sets"
        action={
          <Button
            size="sm"
            onClick={openAddRoleDialog}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        }
        loading={loading}
        enableRowSelection={true}
        onRowSelectionChange={setSelectedRows}
        bulkActions={bulkActionButton}
      />

      {/* Add/Edit Role Dialog */}
      <Dialog open={addRoleOpen || editRoleOpen} onOpenChange={(open) => {
        if (!open) {
          closeRoleDialog()
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editRoleOpen ? 'Edit Role' : 'Create New Role'}</DialogTitle>
            <DialogDescription>
              {editRoleOpen ? 'Update the role details below' : 'Define a new role with specific permissions'}
            </DialogDescription>
          </DialogHeader>
          <RoleForm
            orgId={organizationId}
            initialData={selectedRole}
            onSuccess={closeRoleDialog}
            onCancel={closeRoleDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation Dialog */}
      <AlertDialog open={deleteRoleDialogOpen} onOpenChange={setDeleteRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the <strong>{roleToDelete?.name}</strong> role.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedRows.length} Role(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the following roles:
            </AlertDialogDescription>
            <ul className="mt-2 list-disc list-inside">
              {selectedRows.slice(0, 5).map((role) => (
                <li key={role.id}><strong>{role.name}</strong></li>
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
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedRows.length} Role(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
