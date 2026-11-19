import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config";

/**
 * Fixed-window limiter backed by its own small SQLite file. Every worker process on the host reads
 * and writes the same counters, so the limit holds no matter which worker the load balancer picks.
 * (Separate file: hot counter writes never contend with swipe/match transactions.)
 * For several hosts, enforce coarse limits at the edge (deploy/nginx.conf) or swap this for Redis.
 */
type Store = { hit: Database.Statement; prune: Database.Statement; calls: number };
const g = globalThis as unknown as { __coyRl?: Store };

function store(): Store {
  if (g.__coyRl) return g.__coyRl;
  fs.mkdirSync(path.dirname(config.rateLimitDbPath), { recursive: true });
  const db = new Database(config.rateLimitDbPath);
  db.pragma("busy_timeout = 1000");
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = OFF"); // counters are disposable
  db.exec("CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, expires_at INTEGER NOT NULL, count INTEGER NOT NULL) WITHOUT ROWID");
  g.__coyRl = {
    calls: 0,
    hit: db.prepare(
      `INSERT INTO rate_limits (key, expires_at, count) VALUES (@key, @exp, 1)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN expires_at > @now THEN count + 1 ELSE 1 END,
         expires_at = CASE WHEN expires_at > @now THEN expires_at ELSE @exp END
       RETURNING count, expires_at`
    ),
    prune: db.prepare("DELETE FROM rate_limits WHERE expires_at <= ?"),
  };
  return g.__coyRl;
}

export type RateResult = { allowed: boolean; limit: number; remaining: number; retryAfterSec: number };

export function consume(key: string, max: number, windowMs: number): RateResult {
  try {
    const s = store();
    const now = Date.now();
    const row = s.hit.get({ key, now, exp: now + windowMs }) as { count: number; expires_at: number };
    if (++s.calls % 500 === 0) s.prune.run(now); // keeps the table bounded: only live windows survive
    return {
      allowed: row.count <= max,
      limit: max,
      remaining: Math.max(max - row.count, 0),
      retryAfterSec: Math.max(Math.ceil((row.expires_at - now) / 1000), 1),
    };
  } catch (e) {
    // Traffic control must never take the app down: fail open, log loudly.
    console.error(JSON.stringify({ level: "error", msg: "rate limiter unavailable", err: String(e) }));
    return { allowed: true, limit: max, remaining: max, retryAfterSec: 1 };
  }
}
