import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ExerciseBlockView } from "./exercise-block-view";

export const ExerciseBlock = Node.create({
  name: "exerciseBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      number: {
        default: 1,
        parseHTML: (el) => parseInt(el.getAttribute("data-number") || "1"),
        renderHTML: (attrs) => ({ "data-number": String(attrs.number) }),
      },
      instruction: {
        default: "Quan sát và ghi nhận kết quả:",
        parseHTML: (el) => el.getAttribute("data-instruction") || "",
        renderHTML: (attrs) => ({ "data-instruction": attrs.instruction }),
      },
      // Observation table data: array of { label: string, expected: string, result: string }
      observations: {
        default: [
          { label: "Vin kết nối VCC", expected: "5V", result: "" },
          { label: "Vin kết nối GND", expected: "0V", result: "" },
          { label: "Ngõ ra Q1", expected: "Mức 1", result: "" },
        ],
        parseHTML: (el) => {
          try {
            return JSON.parse(el.getAttribute("data-observations") || "[]");
          } catch {
            return [];
          }
        },
        renderHTML: (attrs) => ({
          "data-observations": JSON.stringify(attrs.observations),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='exercise-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "exercise-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ExerciseBlockView);
  },
});
