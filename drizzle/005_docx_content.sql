-- Add content_docx BLOB column for native DOCX binary storage
ALTER TABLE notes ADD COLUMN content_docx BLOB;

-- Add content_docx to note_versions
ALTER TABLE note_versions ADD COLUMN content_docx BLOB;

-- Add content_docx to templates
ALTER TABLE templates ADD COLUMN content_docx BLOB;
