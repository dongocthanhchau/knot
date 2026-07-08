"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";

interface Observation {
  label: string;
  expected: string;
  result: string;
}

export function ExerciseBlockView(props: ReactNodeViewProps) {
  const { node, updateAttributes } = props;
  const attrs = node.attrs as {
    number: number;
    instruction: string;
    observations: Observation[];
  };

  const setInstruction = useCallback(
    (value: string) => {
      updateAttributes({ instruction: value });
    },
    [updateAttributes],
  );

  const updateObservation = useCallback(
    (idx: number, field: keyof Observation, value: string) => {
      const obs = [...attrs.observations];
      obs[idx] = { ...obs[idx], [field]: value };
      updateAttributes({ observations: obs });
    },
    [attrs.observations, updateAttributes],
  );

  const addObservation = useCallback(() => {
    const num = attrs.observations.length + 1;
    updateAttributes({
      observations: [
        ...attrs.observations,
        { label: `Bước ${num + 1}`, expected: "", result: "" },
      ],
    });
  }, [attrs.observations, updateAttributes]);

  const removeObservation = useCallback(
    (idx: number) => {
      const obs = attrs.observations.filter((_: Observation, i: number) => i !== idx);
      updateAttributes({ observations: obs });
    },
    [attrs.observations, updateAttributes],
  );

  return (
    <NodeViewWrapper>
      <div
        data-type="exercise-block"
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 8,
          overflow: "hidden",
          margin: "12px 0",
          background: "#fafafa",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "8px 12px",
            background: "#e8f4fd",
            borderBottom: "1px solid #d1d5db",
            fontWeight: 600,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>🔬 Bài tập {attrs.number}</span>
        </div>

        {/* Instruction */}
        <div style={{ padding: "8px 12px" }}>
          <textarea
            value={attrs.instruction}
            onChange={(e) => setInstruction(e.target.value)}
            style={{
              width: "100%",
              border: "1px solid #e5e7eb",
              borderRadius: 4,
              padding: "6px 8px",
              fontSize: 13,
              fontFamily: "inherit",
              resize: "vertical",
              minHeight: 40,
              background: "white",
            }}
            placeholder="Nhập hướng dẫn thực hành..."
          />
        </div>

        {/* Observation table */}
        <div style={{ padding: "0 12px 8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    borderBottom: "2px solid #e5e7eb",
                    background: "#f9fafb",
                    width: "35%",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Vị trí đo / Quan sát
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "6px 8px",
                    borderBottom: "2px solid #e5e7eb",
                    background: "#f9fafb",
                    width: "25%",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Giá trị mong đợi
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "6px 8px",
                    borderBottom: "2px solid #e5e7eb",
                    background: "#f9fafb",
                    width: "30%",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Kết quả thực tế
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "6px 8px",
                    borderBottom: "2px solid #e5e7eb",
                    background: "#f9fafb",
                    width: 30,
                  }}
                >
                </th>
              </tr>
            </thead>
            <tbody>
              {attrs.observations.map((obs: Observation, idx: number) => (
                <tr key={idx}>
                  <td
                    style={{
                      padding: "4px 8px",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <input
                      value={obs.label}
                      onChange={(e) => updateObservation(idx, "label", e.target.value)}
                      style={{
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        padding: "2px 0",
                        fontSize: 13,
                        fontFamily: "inherit",
                      }}
                      placeholder="e.g. Vin kết nối VCC"
                    />
                  </td>
                  <td
                    style={{
                      padding: "4px 8px",
                      borderBottom: "1px solid #e5e7eb",
                      textAlign: "center",
                    }}
                  >
                    <input
                      value={obs.expected}
                      onChange={(e) => updateObservation(idx, "expected", e.target.value)}
                      style={{
                        width: "100%",
                        border: "1px dashed #d1d5db",
                        borderRadius: 4,
                        padding: "2px 4px",
                        fontSize: 13,
                        textAlign: "center",
                        fontFamily: "monospace",
                        background: "#f9fafb",
                      }}
                      placeholder="?"
                    />
                  </td>
                  <td
                    style={{
                      padding: "4px 8px",
                      borderBottom: "1px solid #e5e7eb",
                      textAlign: "center",
                    }}
                  >
                    <input
                      value={obs.result}
                      onChange={(e) => updateObservation(idx, "result", e.target.value)}
                      style={{
                        width: "100%",
                        border: "1px solid #93c5fd",
                        borderRadius: 4,
                        padding: "2px 4px",
                        fontSize: 13,
                        textAlign: "center",
                        fontFamily: "monospace",
                        background: "white",
                      }}
                      placeholder="Nhập kết quả..."
                    />
                  </td>
                  <td
                    style={{
                      padding: "4px 6px",
                      borderBottom: "1px solid #e5e7eb",
                      textAlign: "center",
                    }}
                  >
                    <button
                      onClick={() => removeObservation(idx)}
                      className="hover:text-red-600"
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9ca3af" }}
                      title="Remove row"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={addObservation}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              color: "#2563eb",
              padding: "4px 0",
            }}
          >
            <Plus size={14} />
            Thêm bước quan sát
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
