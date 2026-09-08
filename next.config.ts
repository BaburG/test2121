import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 auto-generates AGENTS.md/CLAUDE.md on dev start; disable to keep
  // the repository free of generated agent-guidance files.
  agentRules: false,
  // Hide the on-screen Next.js dev indicator ("N" badge) so it doesn't
  // interfere with the landing-page composition.
  devIndicators: false,
};

export default nextConfig;
