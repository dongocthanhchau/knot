"use client";

import {
  NodeViewWrapper,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ColDef, CellValueChangedEvent } from "ag-grid-community";
import {
  ModuleRegistry,
  AllCommunityModule,
  ValidationModule,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule, ValidationModule]);

export function DataSheetView(props: ReactNodeViewProps) {
  const { node, updateAttributes } = props;
  const data = (node.attrs as any).data as string[][];
  const attrRows = (node.attrs as any).rows as number;
  const attrCols = (node.attrs as any).cols as number;
  const gridRef = useRef<AgGridReact>(null);

  // Ensure data matches rows x cols
  const normalizedData = useMemo(() => {
    const d = data.map((row) => {
      const r = [...row];
      while (r.length < attrCols) r.push("");
      return r;
    });
    while (d.length < attrRows) {
      d.push(Array.from({ length: attrCols }, () => ""));
    }
    return d;
  }, [data, attrRows, attrCols]);

  const colDefs = useMemo<ColDef[]>(() => {
    return Array.from({ length: attrCols }, (_, i) => ({
      field: `c${i}`,
      headerName: "",
      editable: true,
      minWidth: 80,
      suppressHeaderMenuButton: true,
      suppressHeaderContextMenu: true,
      resizable: true,
    }));
  }, [attrCols]);

  const rowData = useMemo(() => {
    return normalizedData.map((row, ri) => {
      const obj: Record<string, string> = {};
      row.forEach((cell, ci) => {
        obj[`c${ci}`] = cell;
      });
      return obj;
    });
  }, [normalizedData]);

  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {
      const newData = normalizedData.map((r) => [...r]);
      const rowIndex = event.node.rowIndex!;
      const colIndex = parseInt(
        (event.colDef as ColDef).field!.replace("c", "")
      );
      newData[rowIndex][colIndex] = event.newValue ?? "";
      updateAttributes({ data: newData });
    },
    [normalizedData, updateAttributes]
  );

  const addColumn = useCallback(() => {
    const newData = normalizedData.map((row) => [...row, ""]);
    updateAttributes({ data: newData, cols: attrCols + 1 });
  }, [normalizedData, attrCols, updateAttributes]);

  const addRow = useCallback(() => {
    const newData = [
      ...normalizedData,
      Array.from({ length: attrCols }, () => ""),
    ];
    updateAttributes({ data: newData, rows: attrRows + 1 });
  }, [normalizedData, attrCols, attrRows, updateAttributes]);

  const removeColumn = useCallback(() => {
    if (attrCols <= 1) return;
    const newData = normalizedData.map((row) => row.slice(0, -1));
    updateAttributes({ data: newData, cols: attrCols - 1 });
  }, [normalizedData, attrCols, updateAttributes]);

  const removeRow = useCallback(() => {
    if (attrRows <= 1) return;
    updateAttributes({
      data: normalizedData.slice(0, -1),
      rows: attrRows - 1,
    });
  }, [normalizedData, attrRows, updateAttributes]);

  const gridHeight = Math.max(Math.min(attrRows * 32 + 28, 400), 100);

  // Capture-phase pointerdown: focus AG Grid root before the event
  // reaches AG Grid's own listener. Without this, ProseMirror's
  // contenteditable="false" swallows focus and AG Grid ignores
  // pointer events because its root has no focus.
  useEffect(() => {
    const gridRoot = document.querySelector('.ag-root') as HTMLElement | null;
    const wrapper = gridRoot?.closest('.node-dataSheet') as HTMLElement | null;
    if (!wrapper) return;

    const onPointerDownCapture = () => {
      if (gridRoot && !gridRoot.contains(document.activeElement)) {
        gridRoot.focus();
      }
    };

    wrapper.addEventListener('pointerdown', onPointerDownCapture, { capture: true });
    return () => wrapper.removeEventListener('pointerdown', onPointerDownCapture, { capture: true });
  }, []);

  return (
    <NodeViewWrapper>
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          overflow: "hidden",
          margin: "12px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: "4px 8px",
            borderBottom: "1px solid #e5e7eb",
            background: "#f9fafb",
            fontSize: 12,
          }}
        >
          <button onClick={addColumn}>+ Cột</button>
          <button onClick={addRow}>+ Dòng</button>
          <div style={{ flex: 1 }} />
          <button
            onClick={removeColumn}
            disabled={attrCols <= 1}
            style={{ color: attrCols <= 1 ? "#d1d5db" : undefined }}
          >
            - Cột
          </button>
          <button
            onClick={removeRow}
            disabled={attrRows <= 1}
            style={{ color: attrRows <= 1 ? "#d1d5db" : undefined }}
          >
            - Dòng
          </button>
        </div>

        <div
          className="ag-theme-quartz"
          style={{ height: gridHeight, width: "100%" }}
        >
          <AgGridReact
            ref={gridRef}
            columnDefs={colDefs}
            rowData={rowData}
            onCellValueChanged={onCellValueChanged}
            suppressMovableColumns
            suppressDragLeaveHidesColumns
            enableCellEditingOnBackspace
            singleClickEdit
            stopEditingWhenCellsLoseFocus
            headerHeight={0}
            domLayout="normal"
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
