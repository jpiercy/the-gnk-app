'use client';

import React from 'react'
import { HTMLProps } from 'react';
// import ReactDOM from 'react-dom/client'
// import './index.css'
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equalsString,
  filterFn_includesString,
  filterFn_includesStringSensitive,
  globalFilteringFeature,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { useDebouncedCallback } from '@tanstack/react-pacer/debouncer'
import { compareItems, rankItem } from '@tanstack/match-sorter-utils'

export type Entry = {
  id: string
  user: string
  bookTitle: string
  author: string
  selected: boolean
  enteredForBookClubEventId: string
  profileId: string
}

import type {
  Column,
  FilterFn,
  SortFn,
  TableFeatures,
} from '@tanstack/react-table'

// A TanStack fork of Kent C. Dodds' match-sorter library that provides ranking information
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// The filter meta that the fuzzy filter attaches to rows, declared per-table
// via the `filterMeta` slot below. No declaration merging needed!
interface FuzzyFilterMeta {
  itemRank?: RankingInfo
}

// Broad features type for writing the custom fns below before the `features`
// object exists, with the filter meta type plugged in
type FuzzyFeatures = TableFeatures & { filterMeta: FuzzyFilterMeta }

// Define a custom fuzzy filter function that will apply ranking info to rows (using match-sorter utils)
const fuzzyFilter: FilterFn<FuzzyFeatures, any> = (
  row,
  columnId,
  value,
  addMeta,
) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta?.({
    itemRank,
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

// Define a custom fuzzy sort function that will sort by rank if the row has ranking information
const fuzzySort: SortFn<FuzzyFeatures, any> = (rowA, rowB, columnId) => {
  let dir = 0

  // Only sort by rank if the column has ranking information
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId].itemRank as RankingInfo,
      rowB.columnFiltersMeta[columnId].itemRank as RankingInfo,
    )
  }

  // Provide an alphanumeric fallback for when the item ranks are equal
  return dir === 0 ? sortFn_alphanumeric(rowA, rowB, columnId) : dir
}

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
  filterFns: {
    equalsString: filterFn_equalsString,
    includesString: filterFn_includesString,
    includesStringSensitive: filterFn_includesStringSensitive,
    fuzzy: fuzzyFilter,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    fuzzy: fuzzySort,
  },
  filterMeta: metaHelper<FuzzyFilterMeta>(),
})

const columnHelper = createColumnHelper<typeof features, Entry>()

function Filter({ column }: { column: Column<typeof features, Entry> }) {
  const columnFilterValue = column.getFilterValue()

  return (
    <DebouncedInput
      type="text"
      value={(columnFilterValue ?? '') as string}
      onChange={(value) => column.setFilterValue(value)}
      placeholder={`Search...`}
      className="filter-select"
    />
  )
}

// A typical debounced input react component
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  const [value, setValue] = React.useState(initialValue)

  React.useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const debouncedOnChange = useDebouncedCallback(onChange, { wait: debounce })

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => {
        setValue(e.target.value)
        debouncedOnChange(e.target.value)
      }}
    />
  )
}

// const rootElement = document.getElementById('root')
// if (!rootElement) throw new Error('Failed to find the root element')

// ReactDOM.createRoot(rootElement).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
// )

export interface EntryTableProps {
  data: Array<Entry>;
  dataPromise?: Promise<Array<Entry>>;
  enableRowSelectionProp?: boolean;
  enableMultiRowSelectionProp?: boolean;
  paginationProp?: boolean;
  entryFilterFn?: (entry: Entry) => boolean;
}

function IndeterminateCheckbox({
  indeterminate,
  className = '',
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
  const ref = React.useRef<HTMLInputElement>(null!)

  React.useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate
    }
    // `checked` belongs here too: `getIsSomePageRowsSelected` stays true when
    // every page row is selected, so deselecting one only changes `checked`.
  }, [ref, indeterminate, rest.checked])

  return (
    <input
      type="checkbox"
      ref={ref}
      className={className + ' selection-checkbox'}
      {...rest}
    />
  )
}

export function EntryTable({ data, dataPromise, enableRowSelectionProp = false, enableMultiRowSelectionProp = false, paginationProp = false, entryFilterFn }: EntryTableProps) {
  // const data = use(dataPromise);
  // const filteredData = entryFilterFn ? data.filter(entryFilterFn) : data;
  const filteredData = data;

  const columns = React.useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: 'select',
          header: () => {
            return (
              <IndeterminateCheckbox
                checked={table.getIsAllRowsSelected()}
                indeterminate={table.getIsSomeRowsSelected()}
                onChange={table.getToggleAllRowsSelectedHandler()}
              />
            )
          },
          cell: ({ row }) => (
            <div className="column-toggle-row">
              <IndeterminateCheckbox
                checked={row.getIsSelected()}
                disabled={!row.getCanSelect()}
                indeterminate={row.getIsSomeSelected()}
                onChange={row.getToggleSelectedHandler({
                  // selectChildren: false
                })}
              />
            </div>
          ),
        }),
        columnHelper.accessor('user', {
          cell: (info) => info.getValue(),
          filterFn: 'includesStringSensitive', // note: normal non-fuzzy filter column - case sensitive
        }),
        columnHelper.accessor((row) => row.bookTitle, {
          id: 'bookTitle',
          cell: (info) => info.getValue(),
          header: () => <span>Book Title</span>,
          filterFn: 'includesString', // note: normal non-fuzzy filter column - case insensitive
        }),
        columnHelper.accessor((row) => row.author, {
          id: 'author',
          header: 'Author',
          cell: (info) => info.getValue(),
          filterFn: 'fuzzy', // using our custom fuzzy filter function registered in `features`
          sortFn: 'fuzzy', // sort by fuzzy rank (falls back to alphanumeric)
        }),
        columnHelper.accessor((row) => row.selected, {
          id: 'selected',
          header: 'Selected?',
          cell: (info) => info.getValue() ? 'true' : 'false',
          filterFn: 'fuzzy', // using our custom fuzzy filter function registered in `features`
          sortFn: 'fuzzy', // sort by fuzzy rank (falls back to alphanumeric)
        }),
      ]),
    [],
  )
  const table = useTable<typeof features, Entry>(
    {
      features,
      columns,
      data: filteredData,
      globalFilterFn: 'fuzzy', // apply fuzzy filter to the global filter (most common use case for fuzzy filter)
      // initialState: { columnFilters: [{ id: 'firstName', value: 'Jane' }], globalFilter: 'Jane' }, // set filters once
      // atoms: { columnFilters: columnFiltersAtom, globalFilter: globalFilterAtom }, // preferred external ownership
      // state: { columnFilters, globalFilter }, // classic controlled state; pair with the callbacks below
      // onColumnFiltersChange: setColumnFilters,
      // onGlobalFilterChange: setGlobalFilter,
      // enableFilters: false, // disable all column and global filtering; default true
      // enableColumnFilters: false, // disable per-column filters; default true
      // filterFromLeafRows: true, // keep parents whose descendants match; default filters from parents down
      // maxLeafRowFilterDepth: 1, // only filter through this nested-row depth; default 100
      // manualFiltering: true, // pass data that is already filtered, for example from a server
      // enableGlobalFilter: false, // disable the global filter input; default true
      // getColumnCanGlobalFilter: column => column.id !== 'status', // opt a column out of global filtering
      debugTable: false,
      debugHeaders: false,
      debugColumns: false,
      enableRowSelection: true,
      enableMultiRowSelection: enableMultiRowSelectionProp,
    },
    (state) => state, // default selector
  )

  // apply the fuzzy sort if the fullName column is being filtered
  React.useEffect(() => {
    if (table.state.columnFilters[0]?.id === 'author') {
      if (table.state.sorting[0]?.id !== 'author') {
        table.setSorting([{ id: 'author', desc: false }])
      }
    }
  }, [table.state.columnFilters[0]?.id])

  return (
    <div className="demo-root">

      <div>
        <DebouncedInput
          value={table.state.globalFilter ?? ''}
          onChange={(value) => table.setGlobalFilter(String(value))}
          className="summary-panel"
          placeholder="Search all columns..."
        />
      </div>
      <div className="spacer-sm" />
      <div className="w-full overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-800">
        <table className="w-full border-collapse border border-slate-200 text-left text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th 
                      key={header.id} 
                      colSpan={header.colSpan}
                      className="border border-slate-200 px-4 py-3 font-semibold dark:border-slate-800"
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex flex-col gap-2">
                          <div
                            className={`flex items-center gap-1 ${
                              header.column.getCanSort() ? 'cursor-pointer select-none hover:text-slate-900 dark:hover:text-white' : ''
                            }`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <table.FlexRender header={header} />
                            <span className="text-xs">
                              {{
                                asc: ' 🔼',
                                desc: ' 🔽',
                              }[header.column.getIsSorted() as string] ?? null}
                            </span>
                          </div>
                          {header.column.getCanFilter() ? (
                            <div className="w-full">
                              <Filter column={header.column} />
                            </div>
                          ) : null}
                        </div>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-slate-950">
            {table.getRowModel().rows.map((row) => {
              return (
                <tr 
                  key={row.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                >
                  {row.getAllCells().map((cell) => {
                    return (
                      <td 
                        key={cell.id}
                        className="border border-slate-200 px-4 py-3 whitespace-nowrap text-slate-700 dark:border-slate-800 dark:text-slate-300"
                      >
                        <table.FlexRender cell={cell} />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {paginationProp && <div>
              <div className="spacer-sm" />
      <div className="controls">
        <button
          className="demo-button demo-button-sm"
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<<'}
        </button>
        <button
          className="demo-button demo-button-sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </button>
        <button
          className="demo-button demo-button-sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {'>'}
        </button>
        <button
          className="demo-button demo-button-sm"
          onClick={() => table.lastPage()}
          disabled={!table.getCanLastPage()}
        >
          {'>>'}
        </button>
        <span className="inline-controls">
          <div>Page</div>
          <strong>
            {(table.state.pagination.pageIndex + 1).toLocaleString()} of{' '}
            {table.getPageCount().toLocaleString()}
          </strong>
        </span>
        <span className="inline-controls">
          | Go to page:
          <input
            type="number"
            value={table.state.pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
            className="page-size-input"
          />
        </span>
        <select
          value={table.state.pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
      <div>
        {table.getPrePaginatedRowModel().rows.length.toLocaleString()} Rows
      </div>
        </div>
      }

    </div>
  )
};