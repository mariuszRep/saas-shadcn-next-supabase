'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createRole, updateRole } from '../role-actions'
import { roleFormSchema, updateRoleSchema } from '../validations'
import type { Role } from '@/types/roles'
import type { PermissionAction } from '@/types/database'

interface RoleFormProps {
  orgId: string
  initialData?: Role | null
  onSuccess: () => void
  onCancel: () => void
}

export function RoleForm({ orgId, initialData, onSuccess, onCancel }: RoleFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const isEdit = !!initialData

  const form = useForm({
    resolver: zodResolver(isEdit ? updateRoleSchema : roleFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      permissions: (initialData?.permissions as PermissionAction[]) || [],
    },
  })

  async function onSubmit(data: any) {
    setSubmitting(true)
    try {
      let result
      if (isEdit && initialData) {
        result = await updateRole(initialData.id, data)
      } else {
        result = await createRole({ ...data, org_id: orgId })
      }

      if (result.success) {
        toast.success(isEdit ? 'Role updated successfully' : 'Role created successfully')
        form.reset()
        onSuccess()
      } else {
        toast.error(result.error || (isEdit ? 'Failed to update role' : 'Failed to create role'))
      }
    } catch (error) {
      console.error('Error saving role:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="roleName">Role Name</Label>
        <Input
          id="roleName"
          placeholder="e.g., Editor, Viewer, Manager"
          {...form.register('name')}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="roleDescription">Description (Optional)</Label>
        <Input
          id="roleDescription"
          placeholder="Brief description of this role"
          {...form.register('description')}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Permissions</Label>
        <div className="grid grid-cols-2 gap-2">
          {(['select', 'insert', 'update', 'delete'] as PermissionAction[]).map((permission) => (
            <div key={permission} className="flex items-center space-x-2">
              <Checkbox
                id={`perm-${permission}`}
                checked={form.watch('permissions')?.includes(permission)}
                onCheckedChange={(checked) => {
                  const current = form.getValues('permissions') || []
                  if (checked) {
                    form.setValue('permissions', [...current, permission])
                  } else {
                    form.setValue('permissions', current.filter((p: any) => p !== permission))
                  }
                }}
              />
              <label htmlFor={`perm-${permission}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">
                {permission}
              </label>
            </div>
          ))}
        </div>
        {form.formState.errors.permissions && (
          <p className="text-sm text-destructive">{form.formState.errors.permissions.message}</p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Update Role' : 'Create Role'}
        </Button>
      </DialogFooter>
    </form>
  )
}
