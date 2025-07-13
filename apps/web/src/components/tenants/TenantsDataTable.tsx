"use client"

import * as React from "react"
import { ColumnDef, Table as TanstackTable } from "@tanstack/react-table"
import { CompositeDataTable } from "@/components/ui/CompositeDataTable" 
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

const statuses = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Pending", label: "Pending" },
]

const plans = [
    { value: "Free", label: "Free" },
    { value: "Pro", label: "Pro" },
    { value: "Enterprise", label: "Enterprise" },
]

const renderTenantBulkActions = (table: TanstackTable<any>) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" aria-label="Open bulk actions menu">
                    Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                    {table.getFilteredSelectedRowModel().rows.length} selected
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Update Status</DropdownMenuItem>
                <DropdownMenuItem className="text-red-500">Delete Selected</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function TenantsDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {

  return (
    <CompositeDataTable
        columns={columns}
        data={data}
        title="Tenants"
        description="Manage and view all tenants on the platform."
        searchColumnId="name"
        searchPlaceholder="Filter by tenant name..."
        facetedFilters={[
            { columnId: 'status', title: 'Status', options: statuses },
            { columnId: 'plan', title: 'Plan', options: plans },
        ]}
        renderBulkActions={renderTenantBulkActions}
    />
  )
}