"use client";

import { useRef, useState, useCallback, useLayoutEffect } from "react";

export interface ToolbarSection {
  id: string;
  priority: number;
}

interface UseToolbarCollapseResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  overflowIds: Set<string>;
}

export function useToolbarCollapse(
  sections: ToolbarSection[]
): UseToolbarCollapseResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [overflowIds, setOverflowIds] = useState<Set<string>>(new Set());
  const widthsRef = useRef<Map<string, number>>(new Map());
  const nonToolbarRef = useRef(0);

  const calculate = useCallback((updateScale: boolean) => {
    const container = containerRef.current;
    if (!container) return;

    const viewportWidth = window.innerWidth;
    const toolbarWidth = container.getBoundingClientRect().width;

    // Store non-toolbar width (side nav + outline sidebar + padding)
    // This is the correct value to subtract from viewport on resize
    if (updateScale && viewportWidth > 0) {
      nonToolbarRef.current = viewportWidth - toolbarWidth;
    }

    // On first call, always set
    if (nonToolbarRef.current === 0 && viewportWidth > 0) {
      nonToolbarRef.current = viewportWidth - toolbarWidth;
    }

    // Available toolbar width = viewport minus fixed-width non-toolbar areas
    const effectiveWidth = viewportWidth - nonToolbarRef.current;

    const endEl = container.querySelector<HTMLElement>("[data-toolbar-end]");
    const moreBtnWidth = endEl?.offsetWidth ?? 44;

    container.querySelectorAll<HTMLElement>("[data-toolbar-id]").forEach((el) => {
      const id = el.getAttribute("data-toolbar-id");
      if (!id) return;
      const w = el.offsetWidth;
      if (w > 0) {
        widthsRef.current.set(id, w);
      }
    });

    const sorted = [...sections].sort(
      (a, b) => a.priority - b.priority
    );
    const overflowed = new Set<string>();

    for (const item of sorted) {
      let usedWidth = 0;
      for (const s of sections) {
        if (overflowed.has(s.id)) continue;
        usedWidth += widthsRef.current.get(s.id) ?? 0;
      }

      // available width: container's actual CSS width (ResizeObserver fires when it changes)
      // OR viewport-derived width (when container is stuck)
      const available = Math.min(toolbarWidth, effectiveWidth);

      if (usedWidth + moreBtnWidth + 16 <= available) {
        break;
      }
      overflowed.add(item.id);
    }

    setOverflowIds(overflowed);
  }, [sections]);

  const onWindowResize = useCallback(
    () => calculate(false),
    [calculate]
  );
  const onContainerResize = useCallback(
    () => calculate(true),
    [calculate]
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    calculate(true);

    const ro = new ResizeObserver(onContainerResize);
    ro.observe(container);
    if (container.parentElement) ro.observe(container.parentElement);

    window.addEventListener("resize", onWindowResize);

    const mo = new MutationObserver(() => calculate(false));
    mo.observe(container, { childList: true, subtree: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", onWindowResize);
    };
  }, [calculate, onContainerResize, onWindowResize]);

  return { containerRef, overflowIds };
}
