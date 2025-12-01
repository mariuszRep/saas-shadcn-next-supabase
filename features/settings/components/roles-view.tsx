'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/composed/data-table'
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
import { getAllRoles, deleteRole } from '@/lib/actions/role.actions'
import { RoleForm } from '@/features/settings/components/role-form'
import { toast } from 'sonner'
import type { Role, PermissionAction } from '@/lib/types/database'

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

interface RolesViewProps {
  organizationId: string
  onAddRole?: () => void
  onBulkDelete?: (roles: Role[]) => void
}

export function RolesView({ organizationId, onAddRole, onBulkDelete }: RolesViewProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRows, setSelectedRows] = useState<Role[]>([])

  // Dialog states
  const [addRoleOpen, setAddRoleOpen] = useState(false)
  const [editRoleOpen, setEditRoleOpen] = useState(false)
  const [deleteRoleDialogOpen, setDeleteRoleDialogOpen] = useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

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

  async function handleDeleteRole() {
    if (!roleToDelete) return

    try {
      const result = await deleteRole(roleToDelete.id)
      if (result.success) {
        toast.success('Role deleted successfully')
        setDeleteRoleDialogOpen(false)
        setRoleToDelete(null)
        loadRoles()
      } else {
        toast.error(result.error || 'Failed to delete role')
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      toast.error('An unexpected error occurred')
    }
  }

  async function handleBulkDelete() {
    if (selectedRows.length === 0) return

    try {
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

      if (successCount > 0) {
        toast.success(`Deleted ${successCount} role(s)`)
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} role(s)`)
      }

      setBulkDeleteDialogOpen(false)
      setSelectedRows([])
      loadRoles()
    } catch (error) {
      console.error('Error deleting roles:', error)
      toast.error('An unexpected error occurred')
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
              <DropdownMenuItem onClick={() => {
                setSelectedRole(role)
                setEditRoleOpen(true)
              }}>
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
  ], [])

  // Bulk action button to render in toolbar
  const bulkActionButton = selectedRows.length > 0 ? (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => {
        if (onBulkDelete) {
          onBulkDelete(selectedRows)
        } else {
          setBulkDeleteDialogOpen(true)
        }
      }}
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
            onClick={() => {
              if (onAddRole) {
                onAddRole()
              } else {
                setAddRoleOpen(true)
              }
            }}
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
          setAddRoleOpen(false)
          setEditRoleOpen(false)
          setSelectedRole(null)
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
            onSuccess={() => {
              setAddRoleOpen(false)
              setEditRoleOpen(false)
              setSelectedRole(null)
              loadRoles()
            }}
            onCancel={() => {
              setAddRoleOpen(false)
              setEditRoleOpen(false)
              setSelectedRole(null)
            }}
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
