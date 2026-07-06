"use client";

import { useCallback, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  MoreHorizontal,
  Code,
  Subscript,
  Superscript,
  RemoveFormatting,
  IndentIncrease,
  IndentDecrease,
  Image,
  SeparatorHorizontal,
  Table2,
  Link,
  FileUp,
  Rows,
} from "lucide-react";
import { Button } from "@astryxdesign/core";
import { EmojiPicker } from "../emoji-picker";

interface MoreToolsProps {
  editor: Editor;
  overflowIds?: Set<string>;
  renderOverflowItem?: (id: string) => ReactNode;
}

export function MoreToolsDropdown({
  editor,
  overflowIds = new Set(),
  renderOverflowItem,
}: MoreToolsProps) {
  const addLink = useCallback(() => {
    const url = window.prompt("URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        editor.chain().focus().setImage({ src: e.target?.result as string }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  const addFile = useCallback(() => {
    const url = window.prompt("File URL:");
    if (!url) return;
    const name = window.prompt("File name:", url.split("/").pop() || "file");
    if (name) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}" target="_blank" download>${name}</a>`)
        .run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  const insertDataSheet = useCallback(() => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "dataSheet",
        attrs: {
          data: [["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""]],
          rows: 5,
          cols: 4,
        },
      })
      .run();
  }, [editor]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          icon={<MoreHorizontal size={16} />}
          label="More tools"
          tooltip="More tools"
          data-toolbar-more="true"
        />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[180px] max-h-[70vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-1"
          side="bottom"
          align="start"
          sideOffset={4}
        >
          {overflowIds.size > 0 && (
            <>
              <DropdownMenu.Label className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1.5">
                More
              </DropdownMenu.Label>
              {Array.from(overflowIds).map((id) => (
                <div key={id}>{renderOverflowItem?.(id)}</div>
              ))}
              <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
            </>
          )}

          <DropdownMenu.Label className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1.5">
            Format
          </DropdownMenu.Label>
          <DropdownMenuItem
            icon={<Code size={14} />}
            label="Inline code"
            isActive={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          />
          <DropdownMenuItem
            icon={<Subscript size={14} />}
            label="Subscript"
            isActive={editor.isActive("subscript")}
            onClick={() => editor.chain().focus().toggleSubscript().run()}
          />
          <DropdownMenuItem
            icon={<Superscript size={14} />}
            label="Superscript"
            isActive={editor.isActive("superscript")}
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
          />
          <DropdownMenuItem
            icon={<RemoveFormatting size={14} />}
            label="Clear formatting"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          />

          <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

          <DropdownMenu.Label className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1.5">
            Indent
          </DropdownMenu.Label>
          <DropdownMenuItem
            icon={<IndentIncrease size={14} />}
            label="Increase indent"
            onClick={() => editor.chain().focus().indentMore().run()}
          />
          <DropdownMenuItem
            icon={<IndentDecrease size={14} />}
            label="Decrease indent"
            onClick={() => editor.chain().focus().indentLess().run()}
          />

          <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

          <DropdownMenu.Label className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1.5">
            Insert
          </DropdownMenu.Label>
          <DropdownMenuItem
            icon={<Link size={14} />}
            label="Link"
            isActive={editor.isActive("link")}
            onClick={addLink}
          />
          <DropdownMenuItem
            icon={<Image size={14} />}
            label="Image"
            onClick={addImage}
          />
          <DropdownMenuItem
            icon={<SeparatorHorizontal size={14} />}
            label="Horizontal rule"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          />
          <DropdownMenuItem
            icon={<FileUp size={14} />}
            label="File attachment"
            onClick={addFile}
          />
          <DropdownMenuItem
            icon={<Rows size={14} />}
            label="Table"
            onClick={addTable}
          />
          <DropdownMenuItem
            icon={<Table2 size={14} />}
            label="DataSheet"
            onClick={insertDataSheet}
          />

          <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

          <div className="px-2 py-1">
            <EmojiPicker editor={editor} />
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// Helper sub-component for dropdown items — exported for use in overflow items
export function DropdownMenuItem({
  icon,
  label,
  onClick,
  isActive,
}: {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}) {
  return (
    <DropdownMenu.Item
      className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer outline-none
        ${isActive ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"}
        hover:bg-gray-100 dark:hover:bg-gray-700
      `}
      onClick={onClick}
    >
      {icon && (
        <span className="w-4 h-4 flex items-center justify-center text-gray-500 dark:text-gray-400">
          {icon}
        </span>
      )}
      {label}
    </DropdownMenu.Item>
  );
}
