import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fail the production build on type errors rather than shipping broken code
  // to Cloudflare. This is already the default; setting it explicitly means
  // disabling it has to be a deliberate choice.
  //
  // Next 16 no longer runs ESLint as part of `next build`, so linting is a
  // separate `npm run lint` step (see the CI workflow).
  typescript: { ignoreBuildErrors: false },

  images: {
    // Google account avatars are the only remote images we render today.
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

};

export default nextConfig;

// Exposes Cloudflare Workers bindings to `next dev` so local development runs
// against the same runtime shape as production. Optional: plain `next dev`
// still works if the Cloudflare tooling is not installed.
if (process.env.NODE_ENV === "development") {
  import("@opennextjs/cloudflare")
    .then(({ initOpenNextCloudflareForDev }) => initOpenNextCloudflareForDev())
    .catch(() => {});
}
