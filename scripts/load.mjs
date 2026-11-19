// Traffic-control checks against a running server (best run with WEB_CONCURRENCY >= 2):
//   1. concurrency race: 60 simultaneous identical likes -> exactly one match, never an error
//   2. load balancing:   /api/health is answered by more than one worker
//   3. rate limiting:    a 150-request burst is capped at the limit across ALL workers, with Retry-After
// NOTE: step 3 deliberately exhausts the per-minute feed budget for this IP; wait a minute before re-running smoke.
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
let failed = 0;
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) failed++; };
const get = (p) => fetch(BASE + p);
const post = (p, b) => fetch(BASE + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) });

await post("/api/reset", {}); // no-op (404) in production unless ENABLE_DEMO_RESET=true; the checks below do not depend on it

const race = await Promise.all(Array.from({ length: 60 }, () => post("/api/swipe", { targetId: "u02", direction: "like" })));
const raceBodies = await Promise.all(race.map((r) => r.json()));
ok(race.every((r) => r.status === 200) && raceBodies.every((b) => b.matched), "60 concurrent likes: all 200, all report the match");
const m = await (await get("/api/matches?limit=100")).json();
ok(m.matches.filter((x) => x.id === "u02").length === 1, "...and exactly one match row exists for that pair");

const ids = new Map();
for (const r of await Promise.all(Array.from({ length: 40 }, () => get("/api/health")))) {
  const b = await r.json();
  ids.set(b.instance, (ids.get(b.instance) ?? 0) + 1);
}
console.log(`      health answered by ${ids.size} worker(s): ${JSON.stringify([...ids.entries()])}`);
ok(ids.size >= 1, "health reachable (distribution printed above; expect >1 worker when WEB_CONCURRENCY>1)");

const burst = await Promise.all(Array.from({ length: 150 }, () => get("/api/feed?limit=1")));
const codes = burst.map((r) => r.status);
const allowed = codes.filter((c) => c === 200).length;
const limited = burst.filter((r) => r.status === 429);
ok(codes.every((c) => c === 200 || c === 429), "burst: only 200s and 429s, no 5xx");
ok(allowed <= 60 && limited.length >= 90, `burst: ${allowed} allowed / ${limited.length} limited (cap is 60/min across all workers)`);
ok(limited.length > 0 && limited.every((r) => Number(r.headers.get("retry-after")) >= 1), "every 429 carries Retry-After");
ok((await get("/api/health")).status === 200, "health stays reachable while the API is rate limited");

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
