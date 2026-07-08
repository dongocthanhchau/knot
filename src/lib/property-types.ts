export type PropertyType =
  | "text"
  | "date"
  | "progress"
  | "checkbox"
  | "link"
  | "single_select"
  | "multi_select";

export interface NoteProperty {
  id: string;
  key: string;
  type: PropertyType;
  value: string | number | boolean | string[];
  /** Options for single_select and multi_select types */
  options?: string[];
}

export interface PageSettings {
  properties: NoteProperty[];
}

/**
 * Default properties inspired by AFFiNE.
 * Pass createdAt/updatedAt (ISO strings) to auto-set date values.
 */
export function createDefaultProperties(createdAt?: string, updatedAt?: string): NoteProperty[] {
  const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

  return [
    {
      id: generatePropertyId(),
      key: "Created",
      type: "date",
      value: fmtDate(createdAt),
    },
    {
      id: generatePropertyId(),
      key: "Updated",
      type: "date",
      value: fmtDate(updatedAt),
    },
    {
      id: generatePropertyId(),
      key: "Type",
      type: "single_select",
      value: "",
      options: ["Note", "Article", "Idea", "Task", "Journal", "Reference", "Project"],
    },
    {
      id: generatePropertyId(),
      key: "Status",
      type: "single_select",
      value: "",
      options: ["Draft", "In Progress", "Done", "Archived"],
    },
    {
      id: generatePropertyId(),
      key: "Priority",
      type: "single_select",
      value: "",
      options: ["Low", "Medium", "High"],
    },
    {
      id: generatePropertyId(),
      key: "Source",
      type: "link",
      value: "",
    },
    {
      id: generatePropertyId(),
      key: "Backlinks",
      type: "text",
      value: "",
      options: ["Coming soon — sẽ hiển thị danh sách note link đến note này"],
    },
  ];
}

export function generatePropertyId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  text: "Text",
  date: "Date",
  progress: "Progress",
  checkbox: "Checkbox",
  link: "Link",
  single_select: "Single Select",
  multi_select: "Multi Select",
};

/**
 * Parse page_settings JSON string into PageSettings.
 * Returns empty properties array on any parse failure.
 */
export function parsePageSettings(
  json: string | null | undefined,
): PageSettings {
  if (!json) return { properties: [] };
  try {
    const parsed = JSON.parse(json);
    if (parsed && Array.isArray(parsed.properties)) {
      return parsed as PageSettings;
    }
    return { properties: [] };
  } catch {
    return { properties: [] };
  }
}

export function serializePageSettings(settings: PageSettings): string {
  return JSON.stringify(settings);
}
