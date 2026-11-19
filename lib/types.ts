export type Profile = {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  location: string;
  interests: string[];
};
export type MatchItem = Profile & { matchedAt: number };
export type SwipeDirection = "like" | "pass";
export type SwipeResult = { matched: boolean; match: Profile | null };
export type MatchPage = { matches: MatchItem[]; nextCursor: string | null; total: number };
