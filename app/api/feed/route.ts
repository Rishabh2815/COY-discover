import { viewerId } from "@/lib/auth";
import { config } from "@/lib/config";
import { handle, intParam } from "@/lib/http";
import { getFeed } from "@/lib/service";

export const dynamic = "force-dynamic";

// GET /api/feed?limit=10 -> { profiles } (unswiped only, no like-status fields, at most config.feed.max)
export const GET = (req: Request) =>
  handle(req, { limit: "feed" }, () => ({
    canReset: config.demoReset,
    profiles: getFeed(viewerId(), intParam(new URL(req.url), "limit", config.feed.def, 1, config.feed.max)),
  }));
