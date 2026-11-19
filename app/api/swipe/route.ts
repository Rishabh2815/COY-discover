import { viewerId } from "@/lib/auth";
import { handle, readJson } from "@/lib/http";
import { ApiError, ID_RE, swipe } from "@/lib/service";

export const dynamic = "force-dynamic";

// POST /api/swipe { targetId, direction: "like" | "pass" } -> { matched, match }
export const POST = (req: Request) =>
  handle(req, { limit: "swipe", write: true }, async () => {
    const body = await readJson(req);
    const { targetId, direction } = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
    if (typeof targetId !== "string" || !ID_RE.test(targetId) || (direction !== "like" && direction !== "pass")) {
      throw new ApiError(400, "invalid_body");
    }
    return swipe(viewerId(), targetId, direction);
  });
