import { viewerId } from "@/lib/auth";
import { handle } from "@/lib/http";
import { getMatches } from "@/lib/service";

export const dynamic = "force-dynamic";

// GET /api/matches -> { matches: (Profile & { matchedAt })[] } (mutual only)
export const GET = () => handle(() => ({ matches: getMatches(viewerId()) }));
