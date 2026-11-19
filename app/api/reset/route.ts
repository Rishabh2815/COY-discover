import { viewerId } from "@/lib/auth";
import { resetDemo } from "@/lib/db";
import { ApiError } from "@/lib/service";
import { handle, rateLimit } from "@/lib/http";

export const dynamic = "force-dynamic";

// Demo only: clears the viewer's swipes and matches. Disabled in production unless ENABLE_DEMO_RESET=true.
export const POST = (req: Request) =>
  handle(() => {
    if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEMO_RESET !== "true") throw new ApiError(404, "not_found");
    rateLimit(req, "reset", 10, 60_000);
    resetDemo(viewerId());
    return { ok: true };
  });
