"use client";

import { useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";
import * as Popover from "@radix-ui/react-popover";
import { SmilePlus } from "lucide-react";
import { Button } from "@astryxdesign/core";

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊",
  "😇", "🙂", "😉", "😌", "😍", "🥰", "😘", "😗",
  "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭",
  "🤔", "🤐", "😐", "😑", "😶", "😏", "😒", "🙄",
  "😬", "😮", "😯", "😲", "😳", "🥺", "😢", "😭",
  "😤", "😡", "🤬", "😈", "👿", "💀", "☠️", "💩",
  "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌",
  "👐", "🤲", "🤝", "🙏", "✌️", "🤟", "🤘", "🤙",
  "💪", "🦵", "🦶", "👀", "👁️", "👅", "👄", "💋",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
  "✨", "🌟", "⭐", "🔥", "💯", "🎉", "🎊", "🎈",
  "✅", "❌", "❗", "❓", "💡", "📌", "📍", "🔗",
];

interface EmojiPickerProps {
  editor: Editor;
}

export function EmojiPicker({ editor }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const insertEmoji = useCallback(
    (emoji: string) => {
      editor.chain().focus().insertContent(emoji).run();
      setOpen(false);
    },
    [editor]
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          icon={<SmilePlus size={16} />}
          label="Insert emoji"
          tooltip="Insert emoji"
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 w-[280px]"
          side="bottom"
          align="start"
          sideOffset={4}
        >
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg cursor-pointer"
                onClick={() => insertEmoji(emoji)}
                title={emoji}
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
