'use client'

import { ReactNode, useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table'

interface EntityTableProps<TData, TValue> {
  // DataTable props
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  title?: string
  description?: string
  loading?: boolean
  emptyStateMessage?: string
  enablePagination?: boolean
  enableColumnVisibility?: boolean
  pageSize?: number

  // Entity-specific props
  addButtonText?: string
  onAdd?: () => void
  bulkActionText?: string
  onBulkAction?: (selectedRows: TData[]) => void
  bulkActionVariant?: 'destructive' | 'default' | 'outline'
  bulkActionIcon?: ReactNode

  // Advanced customization
  customActions?: ReactNode
  hideAddButton?: boolean
  enableRowSelection?: boolean
}

export function EntityTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  title,
  description,
  loading = false,
  emptyStateMessage,
  enablePagination = true,
  enableColumnVisibility = true,
  pageSize = 10,

  addButtonText = 'Add',
  onAdd,
  bulkActionText = 'Delete',
  onBulkAction,
  bulkActionVariant = 'destructive',
  bulkActionIcon,

  customActions,
  hideAddButton = false,
  enableRowSelection = true,
}: EntityTableProps<TData, TValue>) {
  const [selectedRows, setSelectedRows] = useState<TData[]>([])

  // Memoize action buttons to prevent unnecessary re-renders
  const actionButtons = useMemo(() => {
    const buttons: ReactNode[] = []

    // Add custom actions if provided
    if (customActions) {
      buttons.push(customActions)
    }

    // Add the primary "Add" button
    if (!hideAddButton && onAdd) {
      buttons.push(
        <Button key="add-button" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {addButtonText}
        </Button>
      )
    }

    return buttons.length > 0 ? (
      <div className="flex items-center gap-2">
        {buttons}
      </div>
    ) : null
  }, [customActions, hideAddButton, onAdd, addButtonText])

  // Bulk action button shown when rows are selected - will be rendered in toolbar
  const bulkActionButton = useMemo(() => {
    if (selectedRows.length > 0 && onBulkAction) {
      return (
        <Button
          variant={bulkActionVariant}
          size="sm"
          onClick={() => onBulkAction(selectedRows)}
        >
          {bulkActionIcon || <Trash2 className="mr-2 h-4 w-4" />}
          {bulkActionText} ({selectedRows.length})
        </Button>
      )
    }
    return null
  }, [selectedRows, onBulkAction, bulkActionVariant, bulkActionText, bulkActionIcon])

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey={searchKey}
      searchPlaceholder={searchPlaceholder}
      title={title}
      description={description}
      action={actionButtons}
      loading={loading}
      emptyStateMessage={emptyStateMessage}
      enablePagination={enablePagination}
      enableColumnVisibility={enableColumnVisibility}
      pageSize={pageSize}
      enableRowSelection={enableRowSelection}
      onRowSelectionChange={setSelectedRows}
      bulkActions={bulkActionButton}
    />
  )
}
