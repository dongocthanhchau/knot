import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  passphrase: text("passphrase").notNull(),
  hashedPassword: text("hashed_password").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  parentId: text("parent_id"),
  isDeleted: integer("is_deleted").default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").default("#6b7280"),
  parentId: text("parent_id"),
});

export const noteTags = sqliteTable(
  "note_tags",
  {
    noteId: text("note_id").references(() => notes.id),
    tagId: text("tag_id").references(() => tags.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.noteId, t.tagId] }),
  }),
);

export const noteVersions = sqliteTable("note_versions", {
  id: text("id").primaryKey(),
  noteId: text("note_id").references(() => notes.id),
  content: text("content"),
  createdAt: text("created_at").notNull(),
});

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  category: text("category").default("general"),
  createdAt: text("created_at").notNull(),
});

export const noteLinks = sqliteTable("note_links", {
  id: text("id").primaryKey(),
  sourceNoteId: text("source_note_id").references(() => notes.id),
  targetNoteId: text("target_note_id").references(() => notes.id),
  linkType: text("link_type").default("reference"),
  createdAt: text("created_at").notNull(),
});

export const graphLayouts = sqliteTable("graph_layouts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nodePositions: text("node_positions"),
  createdAt: text("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
});
