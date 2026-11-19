import { viewerId } from "@/lib/auth";
import { handle, rateLimit } from "@/lib/http";
import { ApiError, swipe } from "@/lib/service";

export const dynamic = "force-dynamic";

// POST /api/swipe { targetId, direction: "like" | "pass" } -> { matched, match }
export const POST = (req: Request) =>
  handle(async () => {
    rateLimit(req, "swipe", 120, 60_000);
    const body = (await req.json().catch(() => null)) as { targetId?: unknown; direction?: unknown } | null;
    const { targetId, direction } = body ?? {};
    if (typeof targetId !== "string" || targetId.length > 64 || (direction !== "like" && direction !== "pass")) {
      throw new ApiError(400, "invalid_body");
    }
    return swipe(viewerId(), targetId, direction);
  });
