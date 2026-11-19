import { viewerId } from "@/lib/auth";
import { config } from "@/lib/config";
import { handle, intParam } from "@/lib/http";
import { getMatches } from "@/lib/service";

export const dynamic = "force-dynamic";

// GET /api/matches?limit=24&cursor=... -> { matches, nextCursor, total } (mutual only, paginated)
export const GET = (req: Request) =>
  handle(req, { limit: "matches" }, () => {
    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    return getMatches(viewerId(), intParam(url, "limit", config.matches.def, 1, config.matches.max), cursor);
  });
