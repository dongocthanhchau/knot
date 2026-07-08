"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useCallback } from "react";

const FIELD_STYLE: Record<string, React.CSSProperties> = {
  name: {
    minWidth: 160,
    borderBottom: "2px solid #3b82f6",
    fontWeight: 500,
  },
  date: {
    minWidth: 120,
    borderBottom: "2px solid #3b82f6",
    textAlign: "center",
  },
  score: {
    minWidth: 60,
    maxWidth: 80,
    borderBottom: "2px solid #3b82f6",
    textAlign: "center",
    fontWeight: 600,
  },
  text: {
    minWidth: 120,
    borderBottom: "1px dashed #9ca3af",
  },
};

export function FillableFieldView(props: ReactNodeViewProps) {
  const { node, updateAttributes } = props;
  const attrs = node.attrs as {
    kind: string;
    placeholder: string;
    value: string;
  };

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateAttributes({ value: e.target.value });
    },
    [updateAttributes],
  );

  const style: React.CSSProperties = {
    ...(FIELD_STYLE[attrs.kind] || FIELD_STYLE.text),
    border: "none",
    borderBottom:
      (FIELD_STYLE[attrs.kind] || FIELD_STYLE.text).borderBottom ||
      "1px dashed #9ca3af",
    padding: "2px 6px",
    fontSize: "inherit",
    fontFamily: "inherit",
    background: "transparent",
    outline: "none",
    cursor: "text",
    borderRadius: 0,
  };

  return (
    <NodeViewWrapper as="span" style={{ display: "inline" }}>
      <input
        type={attrs.kind === "score" ? "number" : attrs.kind === "date" ? "date" : "text"}
        value={attrs.value}
        onChange={onChange}
        placeholder={attrs.placeholder}
        style={style}
        min={attrs.kind === "score" ? 0 : undefined}
        max={attrs.kind === "score" ? 10 : undefined}
        step={attrs.kind === "score" ? 0.5 : undefined}
        className="fillable-field-input"
        onFocus={(e) => {
          e.target.style.borderBottomColor = "#2563eb";
          e.target.style.borderBottomWidth = "2px";
        }}
        onBlur={(e) => {
          e.target.style.borderBottomColor = "#3b82f6";
        }}
      />
    </NodeViewWrapper>
  );
}
