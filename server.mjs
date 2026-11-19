// Production entrypoint: a small supervisor that load-balances across N worker processes.
//
//   primary  -> forks WEB_CONCURRENCY workers (default: CPU count, max 4), restarts crashed ones
//               with a crash-loop guard, and drains everything gracefully on SIGTERM/SIGINT.
//   workers  -> each runs the Next.js app on the SAME port; the kernel/cluster module spreads
//               connections round-robin. All workers share one SQLite file (WAL) and one rate-limit store.
//
// Env: PORT (3000) · BIND_HOST (0.0.0.0) · WEB_CONCURRENCY (1-16) · TRUST_PROXY_HOPS (0 = use socket address)
//      CLIENT_IP_HEADER (optional, e.g. true-client-ip; wins over TRUST_PROXY_HOPS when present)
import cluster from "node:cluster";
import http from "node:http";
import os from "node:os";

process.env.NODE_ENV ??= "production";

const intEnv = (name, def, min, max) => {
  const n = process.env[name] === undefined ? def : Number(process.env[name]);
  if (!Number.isInteger(n) || n < min || n > max) {
    console.error(`Invalid ${name}: expected an integer in [${min}, ${max}]`);
    process.exit(1);
  }
  return n;
};
const log = (level, msg, extra = {}) => console.log(JSON.stringify({ level, msg, ...extra }));

const PORT = intEnv("PORT", 3000, 1, 65535);
const HOST = process.env.BIND_HOST ?? "0.0.0.0";
const WORKERS = intEnv("WEB_CONCURRENCY", Math.min(os.availableParallelism(), 4), 1, 16);
const TRUST_HOPS = intEnv("TRUST_PROXY_HOPS", 0, 0, 5);
const IP_HEADER = (process.env.CLIENT_IP_HEADER ?? "").toLowerCase(); // e.g. true-client-ip: set by a CDN that overwrites client-supplied values
const DRAIN_MS = 10_000; // max time a worker waits for in-flight requests

if (cluster.isPrimary) {
  let stopping = false;
  let crashes = [];
  const spawn = () => cluster.fork();
  for (let i = 0; i < WORKERS; i++) spawn();
  log("info", "primary started", { pid: process.pid, workers: WORKERS, port: PORT });

  cluster.on("exit", (worker, code, signal) => {
    if (stopping) {
      if (Object.keys(cluster.workers).length === 0) process.exit(0);
      return;
    }
    const now = Date.now();
    crashes = [...crashes.filter((t) => now - t < 60_000), now];
    log("error", "worker exited", { pid: worker.process.pid, code, signal, crashesLastMinute: crashes.length });
    if (crashes.length > 10) {
      log("error", "crash loop, giving up");
      process.exit(1);
    }
    setTimeout(spawn, 500);
  });

  const stop = (sig) => {
    if (stopping) return;
    stopping = true;
    log("info", "shutting down", { sig });
    for (const w of Object.values(cluster.workers)) w?.send("drain");
    if (Object.keys(cluster.workers).length === 0) process.exit(0);
    setTimeout(() => process.exit(1), DRAIN_MS + 5000).unref(); // hard stop, never hang
  };
  process.on("SIGTERM", () => stop("SIGTERM"));
  process.on("SIGINT", () => stop("SIGINT"));
} else {
  const { default: next } = await import("next");
  const app = next({ dev: false, hostname: HOST, port: PORT });
  const handle = app.getRequestHandler();
  await app.prepare();

  // The one place a client address is derived: the socket, or the Nth-from-right X-Forwarded-For entry
  // when a trusted proxy chain is declared. Inbound x-coy-client-ip is always overwritten.
  const clientIp = (req) => {
    if (IP_HEADER) {
      const h = String(req.headers[IP_HEADER] ?? "").trim();
      if (h) return h.slice(0, 64);
    }
    if (TRUST_HOPS > 0) {
      const xs = String(req.headers["x-forwarded-for"] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      const v = xs[xs.length - TRUST_HOPS];
      if (v) return v.slice(0, 64);
    }
    return req.socket.remoteAddress ?? "unknown";
  };

  const server = http.createServer({ maxHeaderSize: 16 * 1024 }, (req, res) => {
    req.headers["x-coy-client-ip"] = clientIp(req);
    handle(req, res).catch((err) => {
      log("error", "request failed", { err: String(err) });
      if (!res.headersSent) res.writeHead(500, { "content-type": "application/json" });
      res.end('{"error":"internal_error"}');
    });
  });
  // Traffic control at the socket level: bounded connections and bounded time at every stage.
  server.maxConnections = 1024; // per worker
  server.headersTimeout = 15_000; // slow-loris guard
  server.requestTimeout = 30_000;
  server.keepAliveTimeout = 65_000; // must exceed the load balancer's idle timeout (nginx/ALB: 60s)
  server.listen(PORT, HOST, () => log("info", "worker listening", { pid: process.pid, port: PORT }));

  let draining = false;
  const drain = () => {
    if (draining) return;
    draining = true;
    server.close(() => process.exit(0)); // stop accepting; finish in-flight requests
    server.closeIdleConnections();
    setTimeout(() => {
      server.closeAllConnections();
      process.exit(0);
    }, DRAIN_MS).unref();
  };
  process.on("message", (m) => m === "drain" && drain());
  process.on("SIGTERM", drain);
  process.on("SIGINT", drain);
}
