const prod = process.env.NODE_ENV === "production";

// Next.js needs inline scripts/styles for hydration; everything else is locked to this origin.
const csp = [
  "default-src 'self'",
  "img-src 'self' https: data:",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
export default {
  serverExternalPackages: ["better-sqlite3"],
  poweredByHeader: false,
  async headers() {
    const common = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    const prodOnly = prod
      ? [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ]
      : [];
    return [{ source: "/(.*)", headers: [...common, ...prodOnly] }];
  },
};
