// End-to-end API check against a running server:  npm run dev  (or start)  then  npm run smoke
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
let failed = 0;
const ok = (cond, msg) => { console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`); if (!cond) failed++; };
const call = async (path, init) => {
  const res = await fetch(BASE + path, { ...init, headers: { "content-type": "application/json" } });
  return { status: res.status, body: await res.json() };
};
const swipe = (targetId, direction) => call("/api/swipe", { method: "POST", body: JSON.stringify({ targetId, direction }) });

await call("/api/reset", { method: "POST" });

const f1 = await call("/api/feed?limit=50");
const f2 = await call("/api/feed?limit=50");
ok(f1.body.profiles.length >= 30, `feed has ${f1.body.profiles.length} profiles (>= 30)`);
ok(JSON.stringify(f1.body) === JSON.stringify(f2.body), "feed order is stable across reloads");
ok(!/like|liked/i.test(Object.keys(f1.body.profiles[0]).join()), "feed profiles expose no like-status field");
ok((await call("/api/matches")).body.matches.length === 0, "no matches before any swipe");

const n = await swipe("u01", "like");
ok(n.status === 200 && n.body.matched === false, "like on a profile that has NOT liked you -> no match, no reveal");
const m = await swipe("u02", "like");
ok(m.body.matched === true && m.body.match?.id === "u02", "like on a profile that already liked you -> match");
ok((await swipe("u02", "like")).body.matched === true, "repeat like is idempotent");
ok((await swipe("u02", "pass")).status === 409, "flipping a swipe is rejected (swipes are final)");
ok((await swipe("u05", "pass")).body.matched === false, "pass never matches");
ok((await swipe("u05", "like")).status === 409, "cannot un-pass someone to test whether they liked you");

const f3 = (await call("/api/feed?limit=50")).body.profiles.map((p) => p.id);
ok(!["u01", "u02", "u05"].some((id) => f3.includes(id)) && f3.length === f1.body.profiles.length - 3, "swiped profiles never reappear in feed");
const mm = (await call("/api/matches")).body.matches;
ok(mm.length === 1 && mm[0].id === "u02", "matches lists only mutual matches (u01 absent)");

// pagination: a bounded page, a cursor, and a total
await swipe("u09", "like");
const p1 = (await call("/api/matches?limit=1")).body;
ok(p1.matches.length === 1 && p1.nextCursor && p1.total === 2, "matches page 1: one item, cursor present, total=2");
const p2 = (await call(`/api/matches?limit=1&cursor=${encodeURIComponent(p1.nextCursor)}`)).body;
ok(p2.matches.length === 1 && p2.nextCursor === null && p2.matches[0].id !== p1.matches[0].id, "matches page 2 via cursor, no repeats, ends cleanly");
ok((await call("/api/matches?cursor=garbage")).status === 400, "malformed cursor -> 400");

// bounded inputs
ok((await call("/api/feed?limit=abc")).status === 400, "non-numeric limit -> 400");
ok((await call("/api/feed?limit=1")).body.profiles.length === 1, "limit=1 returns exactly 1 profile");
ok((await call("/api/feed?limit=99999")).body.profiles.length <= 50, "huge limit is clamped to the 50 cap");
const raw = (body, headers = {}) => fetch(BASE + "/api/swipe", { method: "POST", body, headers: { "content-type": "application/json", ...headers } }).then((r) => r.status);
ok((await raw("x".repeat(5000))) === 413, "oversized body -> 413");
ok((await raw("{}", { "content-type": "text/plain" })) === 415, "non-JSON content type -> 415");
ok((await raw('{"targetId":"u04","direction":"pass"}', { origin: "https://evil.example" })) === 403, "cross-site Origin on a write -> 403");
ok((await raw("{not json")) === 400, "malformed JSON -> 400");
ok((await call("/api/health")).body.status === "ok", "health endpoint reports ok");

ok((await swipe("nope", "like")).status === 404, "unknown profile -> 404");
ok((await swipe("me", "like")).status === 400, "self swipe -> 400");
ok((await swipe("u03", "maybe")).status === 400, "invalid direction -> 400");

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
