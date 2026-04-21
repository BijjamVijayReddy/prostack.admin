"use client";

import { useState } from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  PencilSquareIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { Student } from "../students.types";

interface StudentsTableProps {
  data: Student[];
  onEdit?: (student: Student) => void;
  onReceipt?: (student: Student) => void;
}

export function StudentsTable({ data, onEdit, onReceipt }: StudentsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Student>[] = [
    {
      id: "serial",
      header: "S.No",
      cell: ({ row, table }) => {
        const pageIndex = table.getState().pagination.pageIndex;
        const pageSize = table.getState().pagination.pageSize;
        return pageIndex * pageSize + row.index + 1;
      },
    },
    {
      id: "photo",
      header: "Photo",
      cell: ({ row }) => {
        const student = row.original;
        return student.photo ? (
          <img src={student.photo} alt={student.name} className="h-9 w-9 rounded-full object-cover border" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
            {student.name.charAt(0).toUpperCase()}
          </div>
        );
      },
    },
    { accessorKey: "admissionNo", header: "Admission No" },
    {
      accessorKey: "name",
      header: "Student Name",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center gap-2">
            <span>{student.name}</span>
            {student.studentStatus === "Inactive" && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                Inactive
              </span>
            )}
          </div>
        );
      },
    },
    { accessorKey: "courseTakenDate", header: "Admission Date" },
    {
      accessorKey: "mobile",
      header: "Mobile",
      cell: (info) => {
        const num = info.getValue<string>();
        const wa = `https://wa.me/91${num.replace(/\D/g, "")}`;
        return (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline font-medium cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.121 1.533 5.851L.057 23.571a.75.75 0 00.919.921l5.769-1.479A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.716 9.716 0 01-4.964-1.357l-.355-.211-3.683.943.97-3.608-.231-.371A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
            {num}
          </a>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: (info) => {
        const email = info.getValue<string>();
        return (
          <a
            href={`mailto:${email}`}
            className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
          >
            {email}
          </a>
        );
      },
    },
    { accessorKey: "gender", header: "Gender" },
    { accessorKey: "city", header: "City" },
    { accessorKey: "course", header: "Course" },
    { accessorKey: "dueDate", header: "Due Date" },
    {
      accessorKey: "totalPaid",
      header: "Paid",
      cell: (info) => (
        <span><span className="text-orange-500 font-semibold">₹</span>{info.getValue<number>().toLocaleString("en-IN")}</span>
      ),
    },
    {
      accessorKey: "pendingAmount",
      header: "Pending",
      cell: (info) => {
        const val = info.getValue<number>();
        if (val === 0) {
          return (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700">
              ✓ Paid
            </span>
          );
        }
        return <span><span className="text-orange-500 font-semibold">₹</span>{val.toLocaleString("en-IN")}</span>;
      },
    },
    {
      id: "receipt",
      header: "Receipt",
      cell: ({ row }) => (
        <button
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
          title="View Receipt"
          onClick={() => onReceipt?.(row.original)}
        >
          <DocumentTextIcon className="h-3.5 w-3.5" />
          View
        </button>
      ),
    },
    {
      id: "edit",
      header: "Edit",
      cell: ({ row }) => (
        <button
          className="rounded-lg p-1.5 text-[#023430] bg-[#023430]/5 hover:bg-[#023430]/15 shadow-sm hover:shadow-md hover:shadow-[#023430]/20 active:scale-95 transition-all duration-150 cursor-pointer"
          title="Edit Student"
          onClick={() => onEdit?.(row.original)}
        >
          <PencilSquareIcon className="h-4 w-4 cursor-pointer" />
        </button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10, pageIndex: 0 } },
  });

  if (!data.length) {
    return (
      <div className="rounded-xl border border-gray-200 overflow-hidden p-12 text-center" style={{ backgroundColor: "#f3f3f3" }}>
        <p className="text-sm text-gray-400">No students found for selected filters.</p>
      </div>
    );
  }

  const { pageIndex, pageSize } = table.getState().pagination;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden mb-6" style={{ backgroundColor: "#f3f3f3" }}>
      <div className="overflow-x-auto scrollbar-thin" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,0,0,0.15) transparent" }}>
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-gray-200">
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  return (
                    <th
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={`px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap select-none group ${
                        canSort ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-gray-300 group-hover:text-gray-500 transition-colors">
                            {sorted === "asc" ? (
                              <ChevronUpIcon className="h-3.5 w-3.5 text-indigo-500" />
                            ) : sorted === "desc" ? (
                              <ChevronDownIcon className="h-3.5 w-3.5 text-indigo-500" />
                            ) : (
                              <ChevronUpDownIcon className="h-3.5 w-3.5" />
                            )}
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => {
              const isFullyPaid = row.original.pendingAmount === 0;
              return (
                <tr
                  key={row.id}
                  className="transition-all duration-150"
                  style={isFullyPaid ? { backgroundColor: "#dcfce7" } : undefined}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    if (!isFullyPaid) el.style.backgroundColor = "rgba(249,250,251,0.7)";
                    el.style.transform = "scale(1.005)";
                    el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)";
                    el.style.zIndex = "1";
                    el.style.position = "relative";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    if (!isFullyPaid) el.style.backgroundColor = "";
                    el.style.transform = "";
                    el.style.boxShadow = "";
                    el.style.zIndex = "";
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-4 text-gray-700 whitespace-nowrap font-medium">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer pagination */}
      <div className="flex items-center justify-end gap-6 border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="rounded border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400" style={{ backgroundColor: "#f3f3f3" }}
          >
            {[5, 10, 25, 50].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <span>Page {pageIndex + 1} of {table.getPageCount()}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="flex items-center justify-center rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="flex items-center justify-center rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}