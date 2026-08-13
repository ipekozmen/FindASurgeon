import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "granola.db"));
db.pragma("busy_timeout = 5000");

function withRetry<T>(fn: () => T, attempts = 20): T {
  for (let i = 0; i < attempts; i++) {
    try {
      return fn();
    } catch (err) {
      const busy = err instanceof Error && "code" in err && err.code === "SQLITE_BUSY";
      if (!busy || i === attempts - 1) throw err;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
  throw new Error("unreachable");
}

withRetry(() => db.pragma("journal_mode = WAL"));

withRetry(() =>
  db.exec(`
  CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    duration_seconds INTEGER,
    transcript TEXT,
    summary TEXT,
    notes_json TEXT,
    todos_json TEXT,
    error TEXT
  );
`)
);

export type Meeting = {
  id: string;
  title: string;
  created_at: string;
  status: "processing" | "done" | "error";
  duration_seconds: number | null;
  transcript: string | null;
  summary: string | null;
  notes_json: string | null;
  todos_json: string | null;
  error: string | null;
};

export function createMeeting(id: string, title: string) {
  db.prepare(
    `INSERT INTO meetings (id, title, created_at, status) VALUES (?, ?, ?, 'processing')`
  ).run(id, title, new Date().toISOString());
}

export function updateMeeting(id: string, fields: Partial<Meeting>) {
  const keys = Object.keys(fields) as (keyof Meeting)[];
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => fields[k]);
  db.prepare(`UPDATE meetings SET ${setClause} WHERE id = ?`).run(...values, id);
}

export function getMeeting(id: string): Meeting | undefined {
  return db.prepare(`SELECT * FROM meetings WHERE id = ?`).get(id) as Meeting | undefined;
}

export function listMeetings(): Meeting[] {
  return db.prepare(`SELECT * FROM meetings ORDER BY created_at DESC`).all() as Meeting[];
}

export default db;
