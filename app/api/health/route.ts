import { getDb } from "@/lib/db";
import { handle } from "@/lib/http";
import { ApiError } from "@/lib/service";

export const dynamic = "force-dynamic";

// Load-balancer probe. 200 only if this worker can actually reach the database. Not rate limited.
export const GET = (req: Request) =>
  handle(req, {}, () => {
    try { getDb().prepare("SELECT 1").get(); } catch { throw new ApiError(503, "db_unavailable"); }
    return { status: "ok", instance: process.pid };
  });
