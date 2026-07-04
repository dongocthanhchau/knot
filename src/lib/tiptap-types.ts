export interface TipTapDocument {
  type: "doc";
  content: TipTapNode[];
}

export interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: TipTapMark[];
  text?: string;
}

export interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export const DEFAULT_TIPTAP_CONTENT: TipTapDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function isValidTipTapContent(json: unknown): json is TipTapDocument {
  if (typeof json !== "object" || json === null) return false;
  const doc = json as Record<string, unknown>;
  if (doc.type !== "doc") return false;
  if (!Array.isArray(doc.content)) return false;
  return doc.content.every(
    (node: unknown) =>
      typeof node === "object" && node !== null && typeof (node as Record<string, unknown>).type === "string",
  );
}
