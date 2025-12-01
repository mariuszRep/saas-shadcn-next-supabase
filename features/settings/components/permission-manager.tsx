'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  assignRole,
  revokeRole,
  getAllOrgPermissions,
  getOrgMembers,
  getUserOrganizations,
  getOrganizationWorkspaces,
} from '@/lib/actions/permission.actions'
import {
  addPermissionSchema,
} from '@/lib/schemas'
import { RoleForm } from '@/features/settings/components/role-form'
import { usePermissionStore } from '@/lib/stores/permission-store'
import type { PermissionAction, ObjectType, Role } from '@/lib/types/database'
import { PermissionsView } from '@/features/settings/components/permissions-view'
import { InvitationsList } from '@/features/invitations/components/invitations-list'

interface PermissionManagerProps {
  orgId: string
  defaultTab?: 'permissions' | 'roles' | 'invitations'
  hideTabs?: boolean
}

interface PermissionWithDetails {
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

interface OrgMember {
  org_id: string
  user_id: string
  role_id: string
  role_name: string
  email?: string
  name?: string
}

export function PermissionManager({ orgId, defaultTab = 'permissions', hideTabs = false }: PermissionManagerProps) {
  const [permissions, setPermissions] = useState<PermissionWithDetails[]>([])
  const [members, setMembers] = useState<OrgMember[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteRoleDialogOpen, setDeleteRoleDialogOpen] = useState(false)
  const [permissionToDelete, setPermissionToDelete] = useState<PermissionWithDetails | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Zustand store for dialog state
  const {
    addPermissionOpen,
    addRoleOpen,
    editRoleOpen,
    selectedRole,
    setAddPermissionOpen,
    setAddRoleOpen,
    setEditRoleOpen,
    setSelectedRole,
  } = usePermissionStore()





  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  // Role table state
  const [roleSorting, setRoleSorting] = useState<SortingState>([])
  const [roleFilters, setRoleFilters] = useState<ColumnFiltersState>([])
  const [roleRowSelection, setRoleRowSelection] = useState({})

  // Deduplicate members by user_id for the user selection dropdown
  const uniqueMembers = members.reduce((acc, member) => {
    if (!acc.find(m => m.user_id === member.user_id)) {
      acc.push(member)
    }
    return acc
  }, [] as OrgMember[])

  useEffect(() => {
    loadData()
  }, [orgId])



  async function loadData() {
    setLoading(true)
    try {
      // Load organization members with email/name
      const membersResult = await getOrgMembers(orgId)
      if (membersResult.success && membersResult.members) {
        setMembers(membersResult.members)
      }

      // Load all available roles
      const rolesResult = await getAllRoles()
      if (rolesResult.success && rolesResult.roles) {
        setRoles(rolesResult.roles)
      }

      // Load organizations user has access to
      const orgsResult = await getUserOrganizations()
      if (orgsResult.success && orgsResult.organizations) {
        setOrganizations(orgsResult.organizations)
      }

      // Load ALL permissions for this organization (all object types)
      const permsResult = await getAllOrgPermissions(orgId)
      if (permsResult.success && permsResult.permissions) {
        setPermissions(permsResult.permissions as PermissionWithDetails[])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }

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





  async function handleDeleteRole() {
    if (!roleToDelete) return

    try {
      const result = await deleteRole(roleToDelete.id)
      if (result.success) {
        toast.success('Role deleted successfully')
        setDeleteRoleDialogOpen(false)
        setRoleToDelete(null)
        loadData()
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

  const getInitials = (email?: string, name?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return '??'
  }

  // Get object display name
  const getObjectDisplayName = (objectType: ObjectType, objectId: string | null) => {
    if (objectId === null) {
      return `All ${objectType}s`
    }

    if (objectType === 'organization') {
      const org = organizations.find(o => o.id === objectId)
      return org?.name || objectId
    }

    if (objectType === 'workspace') {
      const ws = workspaces.find(w => w.id === objectId)
      return ws?.name || objectId
    }

    return objectId
  }

  // Define permissions columns
  const permissionsColumns: ColumnDef<PermissionWithDetails>[] = [
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
      id: 'actions',
      header: 'Permissions',
      cell: ({ row }) => {
        const permission = row.original
        return (
          <div className="flex flex-wrap gap-1">
            {(permission.role?.permissions as PermissionAction[])?.map((action) => (
              <Badge key={action} variant={getActionBadgeVariant(action)} className="text-xs">
                {action}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: 'object_type',
      header: 'Object Type',
      cell: ({ row }) => {
        const permission = row.original
        return (
          <div className="flex items-center gap-2">
            {permission.object_type === 'organization' ? (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm capitalize">{permission.object_type}</span>
          </div>
        )
      },
    },
    {
      id: 'object',
      header: 'Object',
      cell: ({ row }) => {
        const permission = row.original
        return (
          <span className="text-sm">
            {getObjectDisplayName(permission.object_type, permission.object_id)}
          </span>
        )
      },
    },
    {
      id: 'row_actions',
      enableHiding: false,
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
                onClick={() => {
                  setPermissionToDelete(permission)
                  setDeleteDialogOpen(true)
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Revoke permission
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

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

  const table = useReactTable({
    data: permissions,
    columns: permissionsColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

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
          <PermissionsView organizationId={orgId} />
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
              loadData()
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
