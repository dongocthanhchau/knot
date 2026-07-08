"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  Plus,
  GripVertical,
  ChevronDown,
  Link,
  Calendar,
  Check,
} from "lucide-react";
import type { NoteProperty, PropertyType } from "@/lib/property-types";
import { PROPERTY_TYPE_LABELS, generatePropertyId } from "@/lib/property-types";

interface PropertiesPanelProps {
  noteId: string;
  properties: NoteProperty[];
  onChange: (properties: NoteProperty[]) => void;
}

const DEFAULT_SELECT_OPTIONS = ["Option 1", "Option 2", "Option 3"];

function createDefaultValue(type: PropertyType): NoteProperty["value"] {
  switch (type) {
    case "text":
      return "";
    case "date":
      return "";
    case "progress":
      return 0;
    case "checkbox":
      return false;
    case "link":
      return "";
    case "single_select":
      return "";
    case "multi_select":
      return [];
  }
}

export function PropertiesPanel({
  noteId: _noteId,
  properties,
  onChange,
}: PropertiesPanelProps) {
  const [newKey, setNewKey] = useState("");
  const [newType, setNewType] = useState<PropertyType>("text");

  const addProperty = useCallback(() => {
    if (!newKey.trim()) return;
    const prop: NoteProperty = {
      id: generatePropertyId(),
      key: newKey.trim(),
      type: newType,
      value: createDefaultValue(newType),
    };
    onChange([...properties, prop]);
    setNewKey("");
  }, [newKey, newType, properties, onChange]);

  const removeProperty = useCallback(
    (id: string) => {
      onChange(properties.filter((p) => p.id !== id));
    },
    [properties, onChange],
  );

  const updateProperty = useCallback(
    (id: string, patch: Partial<NoteProperty>) => {
      onChange(
        properties.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
    },
    [properties, onChange],
  );

  const addOption = useCallback(
    (propId: string, option: string) => {
      const prop = properties.find((p) => p.id === propId);
      if (!prop || !option.trim()) return;
      const options = [...(prop.options || []), option.trim()];
      updateProperty(propId, { options });
    },
    [properties, updateProperty],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-[42px] shrink-0 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">
          Properties
        </span>
        <span className="text-xs text-muted-foreground/50">
          {properties.length === 1
            ? "1 property"
            : `${properties.length} properties`}
        </span>
      </div>

      {/* Property list */}
      <div className="flex-1 overflow-y-auto">
        {properties.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 px-4 pt-4">
            No properties yet
          </p>
        ) : (
          <div className="py-1">
            {properties.map((prop) => (
              <PropertyRow
                key={prop.id}
                prop={prop}
                onUpdate={updateProperty}
                onRemove={removeProperty}
                onAddOption={addOption}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add property */}
      <div className="shrink-0 border-t border-border px-3 py-2">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addProperty()}
            placeholder="Property name…"
            className="flex-1 min-w-0 h-7 px-2 rounded-md bg-muted/30 border border-border text-xs outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary transition-shadow"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as PropertyType)}
            className="h-7 px-1.5 rounded-md bg-muted/30 border border-border text-xs outline-none text-muted-foreground focus:ring-1 focus:ring-primary transition-shadow"
          >
            {Object.entries(PROPERTY_TYPE_LABELS).map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={addProperty}
            disabled={!newKey.trim()}
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-md transition-colors shrink-0",
              newKey.trim()
                ? "text-muted-foreground hover:text-foreground hover:bg-accent"
                : "text-muted-foreground/30 cursor-not-allowed",
            )}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Property Row ── */

interface PropertyRowProps {
  prop: NoteProperty;
  onUpdate: (id: string, patch: Partial<NoteProperty>) => void;
  onRemove: (id: string) => void;
  onAddOption: (propId: string, option: string) => void;
}

function PropertyRow({
  prop,
  onUpdate,
  onRemove,
  onAddOption,
}: PropertyRowProps) {
  const [editingKey, setEditingKey] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");

  const startEditing = () => {
    setKeyDraft(prop.key);
    setEditingKey(true);
  };

  const commitEdit = () => {
    if (keyDraft.trim() && keyDraft.trim() !== prop.key) {
      onUpdate(prop.id, { key: keyDraft.trim() });
    }
    setEditingKey(false);
  };

  const cancelEdit = () => {
    setKeyDraft(prop.key);
    setEditingKey(false);
  };

  return (
    <div className="flex items-center gap-1 px-3 h-8 group hover:bg-accent/30 transition-colors">
      {/* Drag handle */}
      <GripVertical
        size={12}
        className="shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors cursor-grab"
      />

      {/* Key name */}
      <div className="w-[100px] shrink-0">
        {editingKey ? (
          <input
            type="text"
            value={keyDraft}
            onChange={(e) => setKeyDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            autoFocus
            className="w-full h-6 px-1 rounded bg-muted/50 border border-border text-xs outline-none"
          />
        ) : (
          <button
            onClick={startEditing}
            className="w-full text-left text-xs text-muted-foreground truncate hover:text-foreground transition-colors"
            title={prop.key}
          >
            {prop.key}
          </button>
        )}
      </div>

      {/* Value editor */}
      <div className="flex-1 min-w-0">
        <ValueEditor
          prop={prop}
          onUpdate={onUpdate}
          onAddOption={onAddOption}
        />
      </div>

      {/* Delete */}
      <button
        onClick={() => onRemove(prop.id)}
        className="flex items-center justify-center w-5 h-5 rounded text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
}

/* ── Value Editor ── */

interface ValueEditorProps {
  prop: NoteProperty;
  onUpdate: (id: string, patch: Partial<NoteProperty>) => void;
  onAddOption: (propId: string, option: string) => void;
}

function ValueEditor({ prop, onUpdate, onAddOption }: ValueEditorProps) {
  const [addingOption, setAddingOption] = useState(false);
  const [optionDraft, setOptionDraft] = useState("");

  const confirmAddOption = () => {
    if (optionDraft.trim()) {
      onAddOption(prop.id, optionDraft.trim());
      if (prop.type === "single_select") {
        onUpdate(prop.id, { value: optionDraft.trim() });
      } else if (prop.type === "multi_select") {
        const current = (prop.value as string[]) || [];
        onUpdate(prop.id, { value: [...current, optionDraft.trim()] });
      }
    }
    setAddingOption(false);
    setOptionDraft("");
  };

  switch (prop.type) {
    case "text":
      return (
        <input
          type="text"
          value={prop.value as string}
          onChange={(e) => onUpdate(prop.id, { value: e.target.value })}
          placeholder="Empty…"
          className="w-full h-6 px-1.5 rounded bg-transparent text-xs outline-none placeholder:text-muted-foreground/30 hover:bg-muted/30 focus:bg-muted/50 focus:ring-1 focus:ring-primary transition-all"
        />
      );

    case "date":
      return (
        <div className="flex items-center gap-1">
          <Calendar size={12} className="shrink-0 text-muted-foreground/50" />
          <input
            type="date"
            value={prop.value as string}
            onChange={(e) => onUpdate(prop.id, { value: e.target.value })}
            className="flex-1 min-w-0 h-6 px-1 rounded bg-transparent text-xs outline-none text-muted-foreground hover:bg-muted/30 focus:bg-muted/50 focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      );

    case "progress":
      return (
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            value={prop.value as number}
            onChange={(e) =>
              onUpdate(prop.id, {
                value: parseInt(e.target.value, 10),
              })
            }
            className="flex-1 h-1.5 accent-primary"
          />
          <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
            {prop.value as number}%
          </span>
        </div>
      );

    case "checkbox":
      return (
        <div
          onClick={() => onUpdate(prop.id, { value: !prop.value })}
          className={cn(
            "w-7 h-[18px] rounded-full transition-colors cursor-pointer relative shrink-0",
            prop.value ? "bg-primary" : "bg-muted-foreground/30",
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform flex items-center justify-center",
              prop.value && "translate-x-3",
            )}
          >
            {prop.value && <Check size={8} className="text-primary" />}
          </div>
        </div>
      );

    case "link":
      return (
        <div className="flex items-center gap-1">
          <Link size={12} className="shrink-0 text-muted-foreground/50" />
          <input
            type="url"
            value={prop.value as string}
            onChange={(e) => onUpdate(prop.id, { value: e.target.value })}
            placeholder="https://…"
            className="flex-1 min-w-0 h-6 px-1.5 rounded bg-transparent text-xs outline-none placeholder:text-muted-foreground/30 hover:bg-muted/30 focus:bg-muted/50 focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      );

    case "single_select": {
      if (addingOption) {
        return (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={optionDraft}
              onChange={(e) => setOptionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmAddOption();
                if (e.key === "Escape") {
                  setAddingOption(false);
                  setOptionDraft("");
                }
              }}
              onBlur={() => {
                if (!optionDraft.trim()) setAddingOption(false);
              }}
              placeholder="New option…"
              autoFocus
              className="w-full h-6 px-1.5 rounded bg-muted/50 border border-border text-xs outline-none placeholder:text-muted-foreground/50"
            />
          </div>
        );
      }

      const options = prop.options?.length
        ? prop.options
        : DEFAULT_SELECT_OPTIONS;
      return (
        <div className="relative">
          <select
            value={prop.value as string || ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "__add__") {
                setAddingOption(true);
                setOptionDraft("");
              } else {
                onUpdate(prop.id, { value: val });
              }
            }}
            className="w-full h-6 rounded bg-transparent text-xs outline-none text-muted-foreground hover:bg-muted/30 focus:bg-muted/50 focus:ring-1 focus:ring-primary transition-all appearance-none pr-5"
          >
            {!prop.value && (
              <option value="" disabled>
                Select…
              </option>
            )}
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            <option value="__add__">+ Add option…</option>
          </select>
          <ChevronDown
            size={12}
            className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50"
          />
        </div>
      );
    }

    case "multi_select": {
      const values = (prop.value as string[]) || [];
      const options = prop.options?.length
        ? prop.options
        : DEFAULT_SELECT_OPTIONS;

      return (
        <div className="flex flex-wrap gap-1">
          {options.map((opt) => {
            const selected = values.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => {
                  const next = selected
                    ? values.filter((v) => v !== opt)
                    : [...values, opt];
                  onUpdate(prop.id, { value: next });
                }}
                className={cn(
                  "px-1 py-0.5 rounded text-[11px] border transition-colors",
                  selected
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-transparent border-border text-muted-foreground hover:border-muted-foreground/50",
                )}
              >
                {opt}
              </button>
            );
          })}
          {addingOption ? (
            <input
              type="text"
              value={optionDraft}
              onChange={(e) => setOptionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmAddOption();
                if (e.key === "Escape") {
                  setAddingOption(false);
                  setOptionDraft("");
                }
              }}
              onBlur={() => {
                if (!optionDraft.trim()) setAddingOption(false);
              }}
              placeholder="New…"
              autoFocus
              className="w-16 h-5 px-1 rounded bg-muted/50 border border-border text-[11px] outline-none"
            />
          ) : (
            <button
              onClick={() => {
                setAddingOption(true);
                setOptionDraft("");
              }}
              className="px-1 py-0.5 rounded text-[11px] border border-dashed border-border text-muted-foreground/50 hover:text-muted-foreground hover:border-muted-foreground/30 transition-colors"
            >
              + Add
            </button>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}
