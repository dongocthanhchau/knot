"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { X, ChevronUp, ChevronDown, Replace } from "lucide-react";

interface FindReplaceDialogProps {
  editor: Editor;
  onClose: () => void;
}

export function FindReplaceDialog({ editor, onClose }: FindReplaceDialogProps) {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const countMatches = useCallback(
    (q: string) => {
      if (!q) return 0;
      let count = 0;
      const lower = q.toLowerCase();
      editor.state.doc.descendants((node) => {
        if (!node.isText) return true;
        const text = node.text ?? "";
        let idx = 0;
        while (idx < text.length) {
          const found = text.toLowerCase().indexOf(lower, idx);
          if (found === -1) break;
          count++;
          idx = found + q.length;
        }
        return true;
      });
      return count;
    },
    [editor],
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleFindNext = useCallback(() => {
    if (!query) return;
    setMatchCount(countMatches(query));
    editor.chain().focus().findNext(query).run();
  }, [query, editor, countMatches]);

  const handleFindPrevious = useCallback(() => {
    if (!query) return;
    editor.chain().focus().findPrevious(query).run();
  }, [query, editor]);

  const handleReplace = useCallback(() => {
    if (!query) return;
    editor.chain().focus().replaceCurrent(replacement).run();
    setMatchCount(countMatches(query));
    editor.chain().focus().findNext(query).run();
  }, [query, replacement, editor, countMatches]);

  const handleReplaceAll = useCallback(() => {
    if (!query) return;
    editor.chain().focus().replaceAll(query, replacement).run();
    setMatchCount(0);
  }, [query, replacement, editor]);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setQuery(q);
      setMatchCount(countMatches(q));
      if (q) {
        editor.chain().focus().findNext(q).run();
      }
    },
    [editor, countMatches],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) handleFindPrevious();
        else handleFindNext();
      }
      if (e.key === "Escape") {
        onClose();
      }
    },
    [handleFindNext, handleFindPrevious, onClose],
  );

  return (
    <div className="find-replace-overlay" onClick={onClose}>
      <div className="find-replace-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="fr-row">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="Find in document\u2026"
            className="fr-input"
          />
          <button className="fr-btn" onClick={handleFindPrevious} title="Previous (Shift+Enter)">
            <ChevronUp size={14} />
          </button>
          <button className="fr-btn" onClick={handleFindNext} title="Next (Enter)">
            <ChevronDown size={14} />
          </button>
          <button className="fr-btn" onClick={onClose} title="Close (Esc)">
            <X size={14} />
          </button>
        </div>

        {query && (
          <div className="fr-row">
            <input
              type="text"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Replace with\u2026"
              className="fr-input"
            />
            <button className="fr-btn" onClick={handleReplace} title="Replace">
              <Replace size={14} />
            </button>
            <button className="fr-btn fr-btn-primary" onClick={handleReplaceAll} title="Replace all">
              All
            </button>
          </div>
        )}

        {query && (
          <div className="fr-info">
            {matchCount} match{matchCount !== 1 ? "es" : ""} found
          </div>
        )}
      </div>
    </div>
  );
}
