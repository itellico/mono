'use client';

import { type Table } from '@tanstack/react-table';

import { Cross2Icon } from '@radix-ui/react-icons';

import { Button } from '@/components/ui/button';
import { DataTableViewOptions } from '@/components/ui/data-table-view-options';
import { Input } from '@/components/ui/input';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter by tenant name..."
          value={(table.getColumn('tenant.name')?.getFilterValue() as string) ?? ''}
          onChange={event => table.getColumn('tenant.name')?.setFilterValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {isFiltered && (
          <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
