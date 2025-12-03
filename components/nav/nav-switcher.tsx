"use client"

import * as React from "react"
import { ChevronsUpDown, Settings2, type LucideIcon } from "lucide-react"
import Link from "next/link"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

  // Get first two letters for avatar fallback
  const initials = activeItem.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Icon className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeItem.name}</span>
                <span className="truncate text-xs">{label}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {label}s
            </DropdownMenuLabel>
            {items.length === 0 ? (
              <DropdownMenuItem disabled>{emptyMessage}</DropdownMenuItem>
            ) : (
              items.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => onSelect(item)}
                >
                  <Icon />
                  {item.name}
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={manageUrl}>
                <Settings2 />
                Manage
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
