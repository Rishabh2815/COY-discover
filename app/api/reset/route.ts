import { viewerId } from "@/lib/auth";
import { resetDemo } from "@/lib/db";
import { handle } from "@/lib/http";
import { ApiError } from "@/lib/service";

export const dynamic = "force-dynamic";

// Demo only: clears the viewer's swipes and matches. Disabled in production unless ENABLE_DEMO_RESET=true.
export const POST = (req: Request) =>
  handle(req, { limit: "reset", write: true }, () => {
    if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEMO_RESET !== "true") throw new ApiError(404, "not_found");
    resetDemo(viewerId());
    return { ok: true };
  });
