"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useState, useCallback } from "react";
import { Trash2, Plus } from "lucide-react";

const TIER_COLORS: Record<string, string> = {
  "Xuất sắc": "bg-green-100 text-green-800 border-green-300",
  "Tốt": "bg-blue-100 text-blue-800 border-blue-300",
  "Trung bình": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Yếu": "bg-red-100 text-red-800 border-red-300",
};

const TIER_BG: Record<string, string> = {
  "Xuất sắc": "bg-green-50",
  "Tốt": "bg-blue-50",
  "Trung bình": "bg-yellow-50",
  "Yếu": "bg-red-50",
};

export function GradingRubricView(props: ReactNodeViewProps) {
  const { node, updateAttributes } = props;
  const attrs = node.attrs as {
    criteria: string[];
    tiers: Array<{ label: string; min: number; max: number }>;
    scores: Record<string, string>;
  };

  const [editCriterion, setEditCriterion] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const updateScore = useCallback(
    (criterion: string, value: string) => {
      const newScores = { ...attrs.scores, [criterion]: value };
      updateAttributes({ scores: newScores });
    },
    [attrs.scores, updateAttributes],
  );

  const addCriterion = useCallback(() => {
    const newCriteria = [...attrs.criteria, `Tiêu chí ${attrs.criteria.length + 1}`];
    updateAttributes({ criteria: newCriteria });
  }, [attrs.criteria, updateAttributes]);

  const removeCriterion = useCallback(
    (index: number) => {
      const newCriteria = attrs.criteria.filter((_: string, i: number) => i !== index);
      const newScores = { ...attrs.scores };
      delete newScores[attrs.criteria[index]];
      updateAttributes({ criteria: newCriteria, scores: newScores });
    },
    [attrs.criteria, attrs.scores, updateAttributes],
  );

  const saveCriterionName = useCallback(
    (oldName: string, newName: string) => {
      if (!newName.trim()) return;
      const newCriteria = attrs.criteria.map((c: string) => (c === oldName ? newName : c));
      const newScores = { ...attrs.scores };
      if (attrs.scores[oldName] !== undefined) {
        newScores[newName] = attrs.scores[oldName];
        delete newScores[oldName];
      }
      updateAttributes({ criteria: newCriteria, scores: newScores });
    },
    [attrs.criteria, attrs.scores, updateAttributes],
  );

  const getTierForScore = (score: string) => {
    const val = parseFloat(score);
    if (isNaN(val)) return null;
    for (const tier of attrs.tiers) {
      if (val >= tier.min && val <= tier.max) return tier.label;
    }
    return null;
  };

  const calcTotal = () => {
    const scores = Object.values(attrs.scores)
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v));
    if (scores.length === 0) return null;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg.toFixed(1);
  };

  const total = calcTotal();
  const totalTier = total ? getTierForScore(total) : null;

  return (
    <NodeViewWrapper>
      <div
        className="grading-rubric"
        data-type="grading-rubric"
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          overflow: "hidden",
          margin: "12px 0",
        }}
      >
        <div
          style={{
            padding: "8px 12px",
            background: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            fontWeight: 600,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>📋 Rubric đánh giá</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  borderBottom: "2px solid #e5e7eb",
                  background: "#f9fafb",
                  width: "40%",
                }}
              >
                Tiêu chí
              </th>
              {attrs.tiers.map((tier) => (
                <th
                  key={tier.label}
                  style={{
                    textAlign: "center",
                    padding: "8px 6px",
                    borderBottom: "2px solid #e5e7eb",
                    background: "#f9fafb",
                    fontSize: 12,
                  }}
                >
                  {tier.label}
                  <br />
                  <span style={{ fontWeight: 400, fontSize: 11, color: "#6b7280" }}>
                    {tier.min}-{tier.max}
                  </span>
                </th>
              ))}
              <th
                style={{
                  textAlign: "center",
                  padding: "8px 6px",
                  borderBottom: "2px solid #e5e7eb",
                  background: "#f9fafb",
                  width: 80,
                }}
              >
                Điểm
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "8px 6px",
                  borderBottom: "2px solid #e5e7eb",
                  background: "#f9fafb",
                  width: 40,
                }}
              >
              </th>
            </tr>
          </thead>
          <tbody>
            {attrs.criteria.map((criterion: string, idx: number) => {
              const score = attrs.scores[criterion] || "";
              const tier = getTierForScore(score);
              const rowBg = tier ? TIER_BG[tier] || "" : "";

              return (
                <tr key={idx} style={{ background: rowBg }}>
                  <td
                    style={{
                      padding: "6px 12px",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {editCriterion === criterion ? (
                      <input
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={() => {
                          saveCriterionName(criterion, editText);
                          setEditCriterion(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            saveCriterionName(criterion, editText);
                            setEditCriterion(null);
                          }
                          if (e.key === "Escape") setEditCriterion(null);
                        }}
                        style={{
                          width: "100%",
                          border: "1px solid #d1d5db",
                          borderRadius: 4,
                          padding: "2px 6px",
                          fontSize: 13,
                        }}
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:text-blue-600"
                        onClick={() => {
                          setEditText(criterion);
                          setEditCriterion(criterion);
                        }}
                        title="Click to rename"
                      >
                        {criterion}
                      </span>
                    )}
                  </td>
                  {attrs.tiers.map((tier) => (
                    <td
                      key={tier.label}
                      style={{
                        textAlign: "center",
                        padding: "6px 6px",
                        borderBottom: "1px solid #e5e7eb",
                        fontSize: 11,
                        color: tier.label === getTierForScore(score) ? "#000" : "#d1d5db",
                      }}
                    >
                      {tier.label === getTierForScore(score) ? "✓" : ""}
                    </td>
                  ))}
                  <td
                    style={{
                      textAlign: "center",
                      padding: "6px 6px",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={score}
                      onChange={(e) => updateScore(criterion, e.target.value)}
                      style={{
                        width: 56,
                        textAlign: "center",
                        border: "1px solid #d1d5db",
                        borderRadius: 4,
                        padding: "2px 4px",
                        fontSize: 13,
                      }}
                      placeholder="0"
                    />
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <button
                      onClick={() => removeCriterion(idx)}
                      className="hover:text-red-600"
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9ca3af" }}
                      title="Remove criterion"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td
                style={{
                  padding: "8px 12px",
                  borderTop: "2px solid #e5e7eb",
                  fontWeight: 600,
                }}
              >
                <button
                  onClick={addCriterion}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                >
                  <Plus size={14} />
                  Thêm tiêu chí
                </button>
              </td>
              <td
                colSpan={attrs.tiers.length}
                style={{
                  textAlign: "center",
                  padding: "8px 6px",
                  borderTop: "2px solid #e5e7eb",
                  fontWeight: 600,
                }}
              >
                {totalTier && (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "1px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      border: "1px solid",
                      ...(TIER_COLORS[totalTier]
                        ? { className: TIER_COLORS[totalTier] }
                        : {}),
                    }}
                    className={totalTier ? TIER_COLORS[totalTier] : ""}
                  >
                    {totalTier}
                  </span>
                )}
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "8px 6px",
                  borderTop: "2px solid #e5e7eb",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {total ?? "—"}
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "8px 6px",
                  borderTop: "2px solid #e5e7eb",
                }}
              >
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </NodeViewWrapper>
  );
}
