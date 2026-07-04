ALTER TABLE notes ADD COLUMN page_settings text;
--> statement-breakpoint
ALTER TABLE notes ADD COLUMN font_preferences text;
--> statement-breakpoint
ALTER TABLE note_versions ADD COLUMN version_number integer NOT NULL DEFAULT 0;
