import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ME } from "./auth";
import { config } from "./config";
import { LIKES_ME, PROFILES } from "./seed";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  age       INTEGER NOT NULL CHECK (age >= 18),
  photo_url TEXT NOT NULL,
  bio       TEXT NOT NULL,
  location  TEXT NOT NULL,
  interests TEXT NOT NULL
);

-- One row per (swiper, target), ever. The primary key is what makes a swipe final
-- and makes retries idempotent. "pass" rows are kept so a profile never resurfaces.
CREATE TABLE IF NOT EXISTS swipes (
  swiper_id  TEXT NOT NULL REFERENCES users(id),
  target_id  TEXT NOT NULL REFERENCES users(id),
  direction  TEXT NOT NULL CHECK (direction IN ('like', 'pass')),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (swiper_id, target_id),
  CHECK (swiper_id <> target_id)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS swipes_by_swiper_time ON swipes (swiper_id, created_at); -- daily quota lookup

-- Canonical pair ordering (user_a < user_b): a pair can only ever exist once.
CREATE TABLE IF NOT EXISTS matches (
  user_a     TEXT NOT NULL REFERENCES users(id),
  user_b     TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS matches_by_b ON matches (user_b, created_at);
`;

const g = globalThis as unknown as { __coyDb?: Database.Database };

export function getDb(): Database.Database {
  if (g.__coyDb) return g.__coyDb;
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
  const db = new Database(config.dbPath);
  db.pragma(`busy_timeout = ${config.busyTimeoutMs}`); // first, so concurrent workers wait instead of failing
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("foreign_keys = ON");
  // Deterministic per-viewer shuffle, evaluated inside SQLite so the feed can be a bounded top-N query.
  db.function("feed_rank", { deterministic: true }, (viewer: unknown, id: unknown) =>
    createHash("sha256").update(`${config.feedSalt}:${String(viewer)}:${String(id)}`).digest("hex")
  );
  db.exec(SCHEMA);
  seedIfEmpty(db);
  process.once("exit", () => {
    try { db.close(); } catch { /* already closed */ }
  });
  g.__coyDb = db;
  return db;
}

function seedIfEmpty(db: Database.Database) {
  const addUser = db.prepare(
    "INSERT INTO users (id, name, age, photo_url, bio, location, interests) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const addSwipe = db.prepare("INSERT INTO swipes (swiper_id, target_id, direction, created_at) VALUES (?, ?, 'like', ?)");
  // IMMEDIATE + re-check inside the lock: when several workers boot together, exactly one seeds.
  db.transaction(() => {
    if ((db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n > 0) return;
    addUser.run(ME, "You", 24, "", "", "", "[]");
    for (const p of PROFILES) addUser.run(p.id, p.name, p.age, p.photo, p.bio, p.location, JSON.stringify(p.interests));
    const now = Date.now();
    for (const id of LIKES_ME) addSwipe.run(id, ME, now);
  }).immediate();
}

/** Demo helper: forget everything the viewer has done, keep the seeded likes. */
export function resetDemo(viewer: string) {
  const db = getDb();
  db.transaction(() => {
    db.prepare("DELETE FROM matches WHERE user_a = ? OR user_b = ?").run(viewer, viewer);
    db.prepare("DELETE FROM swipes WHERE swiper_id = ?").run(viewer);
  }).immediate();
}
