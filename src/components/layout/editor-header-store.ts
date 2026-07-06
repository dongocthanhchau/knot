"use client";

export type SaveStatus = "idle" | "saving" | "saved" | "unsaved";

export type EditorHeaderState = {
  title: string;
  isDeleting: boolean;
  saveStatus: SaveStatus;
  deleteDialogOpen: boolean;
  showOutline: boolean;
  zoomLevel: number;
  ZOOM_OPTIONS: number[];
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTitleBlur: () => void;
  onSave: () => void;
  onDeleteDialogOpen: (open: boolean) => void;
  onDelete: () => void;
  onToggleOutline: () => void;
  onZoomChange: (level: number) => void;
};

type Listener = (state: EditorHeaderState | null) => void;

let currentState: EditorHeaderState | null = null;
const listeners = new Set<Listener>();

export const editorHeaderStore = {
  setState(state: EditorHeaderState | null) {
    currentState = state;
    listeners.forEach((l) => l(state));
  },
  getState() {
    return currentState;
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
