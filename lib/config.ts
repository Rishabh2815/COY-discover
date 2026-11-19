import path from "node:path";

// Every limit in the system lives here, validated once at startup. Nothing downstream is open-ended.
function int(name: string, def: number, min: number, max: number): number {
  const raw = process.env[name];
  const n = raw === undefined || raw === "" ? def : Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`Invalid ${name}: expected an integer in [${min}, ${max}]`);
  return n;
}

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "coy.db");
const MIN = 60_000;

export const config = {
  dbPath,
  rateLimitDbPath: process.env.RATE_LIMIT_DB_PATH ?? path.join(path.dirname(dbPath), "ratelimit.db"),
  feedSalt: process.env.FEED_SALT ?? "coy-feed-v1",
  allowedHosts: (process.env.ALLOWED_HOSTS ?? "").split(",").map((s) => s.trim()).filter(Boolean),

  busyTimeoutMs: int("DB_BUSY_TIMEOUT_MS", 3000, 100, 30_000),
  dailySwipeLimit: int("DAILY_SWIPE_LIMIT", 500, 1, 100_000), // rolling 24h, per user, enforced inside the swipe transaction
  maxBodyBytes: 1024,
  feed: { def: 10, max: 50 },
  matches: { def: 24, max: 100 },

  // Per client IP, per route, shared by every worker process through SQLite.
  limits: {
    feed: { max: int("RL_FEED_PER_MIN", 60, 1, 10_000), windowMs: MIN },
    matches: { max: int("RL_MATCHES_PER_MIN", 60, 1, 10_000), windowMs: MIN },
    swipe: { max: int("RL_SWIPE_PER_MIN", 120, 1, 10_000), windowMs: MIN },
    reset: { max: 10, windowMs: MIN },
  },
} as const;
