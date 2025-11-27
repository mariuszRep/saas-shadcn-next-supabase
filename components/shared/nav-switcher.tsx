"use client"

import * as React from "react"
import { ChevronsUpDown, Settings2, type LucideIcon } from "lucide-react"
import Link from "next/link"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface NavSwitcherItem {
  id: string
  name: string
}

interface NavSwitcherProps {
  items: NavSwitcherItem[]
  selectedId: string | null | undefined
  onSelect: (item: NavSwitcherItem) => void
  icon: LucideIcon
  label: string
  manageUrl: string
  emptyMessage?: string
}

export function NavSwitcher({
  items,
  selectedId,
  onSelect,
  icon: Icon,
  label,
  manageUrl,
  emptyMessage = "No items available",
}: NavSwitcherProps) {
  const { isMobile } = useSidebar()

  // Find active item from selectedId
  const activeItem = items.find((item) => item.id === selectedId) || items[0]

  if (!activeItem) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Icon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeItem.name}</span>
                <span className="truncate text-xs text-muted-foreground">{label}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {label}s
            </DropdownMenuLabel>
            {items.length === 0 ? (
              <DropdownMenuItem disabled>{emptyMessage}</DropdownMenuItem>
            ) : (
              items.map((item, index) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Icon className="size-3.5 shrink-0" />
                  </div>
                  {item.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" asChild>
              <Link href={manageUrl}>
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Settings2 className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">Manage</div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
