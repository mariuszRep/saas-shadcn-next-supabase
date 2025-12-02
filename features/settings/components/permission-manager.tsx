'use client'

import { useState } from 'react'
import * as React from 'react'
import { toast } from 'sonner'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Building2, FolderKanban, Shield, Trash2, Plus, Search, ChevronDown, MoreHorizontal, Pencil, Mail } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  getAllRoles,
  deleteRole,
} from '@/lib/actions/role.actions'
import { RoleForm } from '@/features/settings/components/role-form'
import type { PermissionAction, Role } from '@/lib/types/database'
import { PermissionsList } from '@/features/permissions/components/permissions-list'
import { InvitationsList } from '@/features/invitations/components/invitations-list'

interface PermissionManagerProps {
  orgId: string
  defaultTab?: 'permissions' | 'roles' | 'invitations'
  hideTabs?: boolean
}

export function PermissionManager({ orgId, defaultTab = 'permissions', hideTabs = false }: PermissionManagerProps) {
  // Local state for dialogs
  const [addRoleOpen, setAddRoleOpen] = useState(false)
  const [editRoleOpen, setEditRoleOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [deleteRoleDialogOpen, setDeleteRoleDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [activeTab, setActiveTab] = useState(defaultTab)

  // State for roles tab only
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)

  // Role table state
  const [roleSorting, setRoleSorting] = useState<SortingState>([])
  const [roleFilters, setRoleFilters] = useState<ColumnFiltersState>([])
  const [roleRowSelection, setRoleRowSelection] = useState({})

  // Load roles when switching to roles tab
  React.useEffect(() => {
    if (activeTab === 'roles' && roles.length === 0) {
      loadRoles()
    }
  }, [activeTab, roles.length])

  async function loadRoles() {
    setLoading(true)
    try {
      const rolesResult = await getAllRoles()
      if (rolesResult.success && rolesResult.roles) {
        setRoles(rolesResult.roles)
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

  const getActionBadgeVariant = (action: PermissionAction): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (action) {
      case 'select': return 'default'
      case 'insert': return 'secondary'
      case 'update': return 'outline'
      case 'delete': return 'destructive'
      default: return 'default'
    }
  }

  // Define roles columns
  const rolesColumns: ColumnDef<Role>[] = [
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
        return (
          <div className="flex flex-wrap gap-1">
            {(role.permissions as PermissionAction[])?.map((action) => (
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
      id: 'row_actions',
      enableHiding: false,
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
                onClick={() => {
                  setSelectedRole(role)
                  setEditRoleOpen(true)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setRoleToDelete(role)
                  setDeleteRoleDialogOpen(true)
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete role
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const roleTable = useReactTable({
    data: roles,
    columns: rolesColumns,
    onSortingChange: setRoleSorting,
    onColumnFiltersChange: setRoleFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRoleRowSelection,
    state: {
      sorting: roleSorting,
      columnFilters: roleFilters,
      rowSelection: roleRowSelection,
    },
  })

  return (
    <div className="space-y-6">
      {!hideTabs && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Invitations
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Render only the active tab content */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <PermissionsList organizationId={orgId} />
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Manage Roles</h3>
              <p className="text-sm text-muted-foreground">
                Create and manage roles that define permission sets
              </p>
            </div>
            <Button onClick={() => setAddRoleOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative max-w-lg w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter by name..."
                  value={(roleTable.getColumn('name')?.getFilterValue() as string) ?? ''}
                  onChange={(event) =>
                    roleTable.getColumn('name')?.setFilterValue(event.target.value)
                  }
                  className="pl-9 w-[400px]"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {roleTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {roleTable.getRowModel().rows?.length ? (
                    roleTable.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={rolesColumns.length}
                        className="h-24 text-center"
                      >
                        {loading ? 'Loading...' : 'No roles found.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {roleTable.getFilteredSelectedRowModel().rows.length} of{' '}
                {roleTable.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => roleTable.previousPage()}
                  disabled={!roleTable.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => roleTable.nextPage()}
                  disabled={!roleTable.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <InvitationsList organizationId={orgId} />
        </div>
      )}



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
            orgId={orgId}
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
    </div>
  )
}
