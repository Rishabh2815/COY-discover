// Single logged-in user. This is the one seam where real auth plugs in
// (session cookie -> user id); every service function takes the viewer explicitly.
export const ME = "me";
export const viewerId = (): string => ME;
