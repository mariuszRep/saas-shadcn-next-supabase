'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  MoreHorizontal,
  UserPlus,
  Settings,
  Mail,
  Trash2,
} from 'lucide-react'
import { revokeInvitation } from '@/lib/actions/invitation-actions'
import { DataTable } from '@/components/shared/data-table'

interface Invitation {
  id: string
  email: string
  status: string
  userId: string
  orgRole: string
  workspaceCount: number
  expiresAt: string
  createdAt: string
}

interface InvitationsViewProps {
  organizationId: string
  invitations: Invitation[]
  onInviteUser?: () => void
  onBulkRevoke?: (invitations: Invitation[]) => void
}

export function InvitationsView({ organizationId, invitations, onInviteUser, onBulkRevoke }: InvitationsViewProps) {
  const router = useRouter()
  const [invitationToDelete, setInvitationToDelete] = useState<string | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Invitation[]>([])

  const handleConfigureWorkspaces = (userId: string) => {
    router.push(`/organization/${organizationId}/settings/invitations/${userId}/workspaces`)
  }

  const handleResendEmail = async (invitationId: string, email: string) => {
    // TODO: Implement resend email functionality
    toast.info('Resend email', {
      description: `This feature will resend the invitation to ${email}`,
    })
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    setIsRevoking(true)
    try {
      const result = await revokeInvitation(invitationId, organizationId)

      if (result.success) {
        toast.success('Invitation revoked', {
          description: 'The invitation has been revoked and user access removed',
        })
        // Refresh the page to update the invitations list
        router.refresh()
      } else {
        toast.error('Failed to revoke invitation', {
          description: result.error || 'An error occurred',
        })
      }
    } catch (error) {
      console.error('Error revoking invitation:', error)
      toast.error('Failed to revoke invitation', {
        description: 'An unexpected error occurred',
      })
    } finally {
      setIsRevoking(false)
      setInvitationToDelete(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'accepted':
        return <Badge variant="default">Accepted</Badge>
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Bulk action button to render in toolbar
  const bulkActionButton = selectedRows.length > 0 ? (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => {
        if (onBulkRevoke) {
          onBulkRevoke(selectedRows)
        } else {
          console.log('Bulk revoke clicked - no handler provided', selectedRows)
        }
      }}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Revoke ({selectedRows.length})
    </Button>
  ) : null

  const columns: ColumnDef<Invitation>[] = useMemo(() => [
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
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <div className="font-medium">{row.getValue('email')}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.getValue('status')),
    },
    {
      accessorKey: 'orgRole',
      header: 'Organization Role',
      cell: ({ row }) => <div className="capitalize">{row.getValue('orgRole')}</div>,
    },
    {
      accessorKey: 'workspaceCount',
      header: 'Workspaces',
      cell: ({ row }) => <div>{row.getValue('workspaceCount')}</div>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Invited',
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {formatDistanceToNow(new Date(row.getValue('createdAt')), { addSuffix: true })}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const invitation = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleConfigureWorkspaces(invitation.userId)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configure Workspaces
                </DropdownMenuItem>
                {invitation.status === 'pending' && (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleResendEmail(invitation.id, invitation.email)}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setInvitationToDelete(invitation.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Revoke Invitation
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ], [])

  return (
    <>
      <DataTable
        columns={columns}
        data={invitations}
        searchKey="email"
        searchPlaceholder="Filter by email..."
        title="Invitations"
        description="Manage user invitations to your organization"
        action={
          <Button
            size="sm"
            onClick={() => {
              if (onInviteUser) {
                onInviteUser()
              } else {
                console.log('Invite user clicked - no handler provided')
              }
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        }
        enableRowSelection={true}
        onRowSelectionChange={setSelectedRows}
        bulkActions={bulkActionButton}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!invitationToDelete} onOpenChange={() => setInvitationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this invitation? This action will remove the user's access
              to the organization and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => invitationToDelete && handleRevokeInvitation(invitationToDelete)}
              className="bg-red-600 hover:bg-red-700"
              disabled={isRevoking}
            >
              {isRevoking ? 'Revoking...' : 'Revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

