"use client";

import { useRef, useState, useCallback, useEffect } from "react";

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
  const prevOverflowRef = useRef<Set<string>>(new Set());
  const rafIdRef = useRef<number>(0);
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  const calculate = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;

    const moreBtn = container.querySelector<HTMLElement>("[data-toolbar-more]");
    const moreBtnWidth = moreBtn?.offsetWidth ?? 44;

    const currentSections = sectionsRef.current;

    const elements = container.querySelectorAll<HTMLElement>(
      "[data-toolbar-id]"
    );
    elements.forEach((el) => {
      const id = el.getAttribute("data-toolbar-id");
      if (!id) return;
      if (el.offsetWidth > 0) {
        widthsRef.current.set(id, el.offsetWidth);
      }
    });

    const sorted = [...currentSections].sort(
      (a, b) => a.priority - b.priority
    );
    const overflowed = new Set<string>();

    for (const item of sorted) {
      const totalWidth = currentSections
        .filter((s) => !overflowed.has(s.id))
        .reduce(
          (sum, s) => sum + (widthsRef.current.get(s.id) ?? 0),
          0
        );

      if (totalWidth + moreBtnWidth <= containerWidth) {
        break;
      }
      overflowed.add(item.id);
    }

    const prev = prevOverflowRef.current;
    const changed =
      prev.size !== overflowed.size ||
      !Array.from(prev).every((id) => overflowed.has(id));

    if (changed) {
      setOverflowIds(overflowed);
      prevOverflowRef.current = overflowed;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(calculate);
    });

    ro.observe(container);

    requestAnimationFrame(calculate);

    return () => {
      ro.disconnect();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [calculate]);

  return { containerRef, overflowIds };
}
