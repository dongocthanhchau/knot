"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type ChangeEvent,
} from "react";

export interface NoteHeaderData {
  noteId: string;
  title: string;
  onTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onTitleBlur: () => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  onDelete: () => void;
  isDeleting: boolean;
  focusMode: boolean;
}

interface NoteHeaderContextType {
  data: NoteHeaderData | null;
  setData: (data: NoteHeaderData | null) => void;
}

const NoteHeaderContext = createContext<NoteHeaderContextType | null>(null);

export function NoteHeaderProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<NoteHeaderData | null>(null);

  return (
    <NoteHeaderContext.Provider value={{ data, setData }}>
      {children}
    </NoteHeaderContext.Provider>
  );
}

export function useNoteHeader(): NoteHeaderContextType {
  const ctx = useContext(NoteHeaderContext);
  if (!ctx) {
    throw new Error(
      "useNoteHeader must be used within a NoteHeaderProvider",
    );
  }
  return ctx;
}
