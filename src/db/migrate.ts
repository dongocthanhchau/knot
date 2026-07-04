import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "node:crypto";

const dbPath = path.join(process.cwd(), "data/knot.db");
const migrationsDir = path.join(process.cwd(), "drizzle");

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    hash TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of migrationFiles) {
  const filePath = path.join(migrationsDir, file);
  const sql = fs.readFileSync(filePath, "utf-8");
  const hash = crypto.createHash("sha256").update(sql).digest("hex");

  const existing = sqlite
    .prepare("SELECT id FROM _migrations WHERE hash = ?")
    .get(hash) as { id: number } | undefined;

  if (existing) {
    console.log(`Skipping ${file} (already applied)`);
    continue;
  }

  try {
    sqlite.exec(sql);
  } catch (err: any) {
    if (err?.code === "SQLITE_ERROR" && err?.message?.includes("already exists")) {
      sqlite
        .prepare("INSERT INTO _migrations (name, hash) VALUES (?, ?)")
        .run(file, hash);
      console.log(`Skipping ${file} (tables already exist, marked as applied)`);
      continue;
    }
    throw err;
  }

  sqlite
    .prepare("INSERT INTO _migrations (name, hash) VALUES (?, ?)")
    .run(file, hash);
  console.log(`Applied migration: ${file}`);
}

console.log("All migrations applied successfully.");
sqlite.close();
