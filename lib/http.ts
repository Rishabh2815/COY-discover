import { NextResponse } from "next/server";
import { config } from "./config";
import { consume } from "./ratelimit";
import { ApiError } from "./service";

type Opts = { limit?: keyof typeof config.limits; write?: boolean };

/** Client IP as resolved by server.mjs (socket address, or the trusted proxy hop). Never read raw X-Forwarded-For here. */
const clientIp = (req: Request) => req.headers.get("x-coy-client-ip") ?? "dev";

/** Cross-site writes are refused: a browser Origin, when present, must be this site (or an allowed host). */
function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients send no Origin
  let host: string;
  try { host = new URL(origin).host; } catch { throw new ApiError(403, "bad_origin"); }
  const ok = [req.headers.get("host"), req.headers.get("x-forwarded-host"), ...config.allowedHosts];
  if (!ok.includes(host)) throw new ApiError(403, "bad_origin");
}

/** Runs one API route: origin check -> rate limit -> handler -> uniform JSON errors. */
export async function handle<T>(req: Request, opts: Opts, fn: () => T | Promise<T>) {
  const rid = crypto.randomUUID();
  const headers: Record<string, string> = { "Cache-Control": "no-store", "X-Request-Id": rid };
  try {
    if (opts.write) assertSameOrigin(req);
    if (opts.limit) {
      const { max, windowMs } = config.limits[opts.limit];
      const r = consume(`${opts.limit}:${clientIp(req)}`, max, windowMs);
      headers["X-RateLimit-Limit"] = String(r.limit);
      headers["X-RateLimit-Remaining"] = String(r.remaining);
      if (!r.allowed) {
        headers["Retry-After"] = String(r.retryAfterSec);
        throw new ApiError(429, "rate_limited");
      }
    }
    return NextResponse.json(await fn(), { headers });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.code }, { status: e.status, headers });
    if ((e as { code?: string })?.code?.startsWith("SQLITE_BUSY")) {
      // Database stayed locked past busy_timeout: shed load instead of queueing forever.
      return NextResponse.json({ error: "busy" }, { status: 503, headers: { ...headers, "Retry-After": "1" } });
    }
    console.error(JSON.stringify({ level: "error", rid, msg: "unhandled", err: String(e), stack: (e as Error)?.stack }));
    return NextResponse.json({ error: "internal_error" }, { status: 500, headers });
  }
}

/** Reads a JSON body with a hard byte cap, aborting the stream the moment it is exceeded. */
export async function readJson(req: Request): Promise<unknown> {
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) throw new ApiError(415, "unsupported_media_type");
  if (Number(req.headers.get("content-length") ?? 0) > config.maxBodyBytes) throw new ApiError(413, "payload_too_large");
  const reader = req.body?.getReader();
  if (!reader) throw new ApiError(400, "invalid_body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > config.maxBodyBytes) {
      await reader.cancel();
      throw new ApiError(413, "payload_too_large");
    }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new ApiError(400, "invalid_body"); }
}

/** Optional integer query param, clamped into [min, max]; anything non-numeric is a 400, never silently coerced. */
export function intParam(url: URL, name: string, def: number, min: number, max: number): number {
  const raw = url.searchParams.get(name);
  if (raw === null) return def;
  if (!/^\d{1,6}$/.test(raw)) throw new ApiError(400, "invalid_query");
  return Math.min(Math.max(Number(raw), min), max);
}
