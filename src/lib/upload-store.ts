/**
 * Module-level store for passing a pending DOCX upload buffer from the note list
 * to the editor page. This avoids uploading the buffer to the server only to
 * immediately fetch it back — the editor parses the original file client-side.
 *
 * Use:
 *   uploadStore.set(fileBuffer)   // note-list.tsx before navigation
 *   uploadStore.get()             // note-editor-client.tsx on mount
 *   uploadStore.clear()           // after consuming
 */

let pendingBuffer: ArrayBuffer | null = null;

export const uploadStore = {
  set(buf: ArrayBuffer) {
    // Store a copy so GC doesn't reclaim the original
    const copy = new ArrayBuffer(buf.byteLength);
    new Uint8Array(copy).set(new Uint8Array(buf));
    pendingBuffer = copy;
  },
  get(): ArrayBuffer | null {
    return pendingBuffer;
  },
  clear() {
    pendingBuffer = null;
  },
};
