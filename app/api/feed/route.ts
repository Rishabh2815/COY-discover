import { viewerId } from "@/lib/auth";
import { handle } from "@/lib/http";
import { getFeed } from "@/lib/service";

export const dynamic = "force-dynamic";

// GET /api/feed?limit=10 -> { profiles: Profile[] } (unswiped only, no like-status fields)
export const GET = (req: Request) =>
  handle(() => {
    const raw = Number(new URL(req.url).searchParams.get("limit") ?? 10);
    const limit = Number.isFinite(raw) ? Math.min(Math.max(Math.trunc(raw), 1), 50) : 10;
    return { profiles: getFeed(viewerId(), limit) };
  });
