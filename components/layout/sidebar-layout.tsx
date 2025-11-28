'use client'

import * as React from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

interface SidebarLayoutProps {
    sidebar: React.ReactNode
    header?: React.ReactNode
    children: React.ReactNode
    defaultOpen?: boolean
}

export function SidebarLayout({
    sidebar,
    header,
    children,
    defaultOpen = true
}: SidebarLayoutProps) {
    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            {sidebar}
            <SidebarInset>
                {header && (
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                            {header}
                        </div>
                    </header>
                )}
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}
