import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { GradingRubricView } from "./grading-rubric-view";

/** Default rubric criteria for a digital electronics lab */
const DEFAULT_CRITERIA = [
  "Lắp ráp mạch",
  "Kết nối dây",
  "Đo đạc thông số",
  "Tính toán sai số",
  "Vệ sinh công nghiệp",
  "An toàn điện",
];

const DEFAULT_TIERS = [
  { label: "Xuất sắc", min: 9, max: 10 },
  { label: "Tốt", min: 7, max: 8 },
  { label: "Trung bình", min: 5, max: 6 },
  { label: "Yếu", min: 0, max: 4 },
];

export const GradingRubric = Node.create({
  name: "gradingRubric",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      criteria: {
        default: DEFAULT_CRITERIA,
        parseHTML: (el) => {
          try {
            return JSON.parse(el.getAttribute("data-criteria") || "[]");
          } catch {
            return DEFAULT_CRITERIA;
          }
        },
        renderHTML: (attrs) => ({
          "data-criteria": JSON.stringify(attrs.criteria),
        }),
      },
      tiers: {
        default: DEFAULT_TIERS,
        parseHTML: (el) => {
          try {
            return JSON.parse(el.getAttribute("data-tiers") || "[]");
          } catch {
            return DEFAULT_TIERS;
          }
        },
        renderHTML: (attrs) => ({
          "data-tiers": JSON.stringify(attrs.tiers),
        }),
      },
      scores: {
        default: {} as Record<string, string>,
        parseHTML: (el) => {
          try {
            return JSON.parse(el.getAttribute("data-scores") || "{}");
          } catch {
            return {};
          }
        },
        renderHTML: (attrs) => ({
          "data-scores": JSON.stringify(attrs.scores),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='grading-rubric']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "grading-rubric" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GradingRubricView);
  },
});
