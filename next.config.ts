import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 auto-generates AGENTS.md/CLAUDE.md on dev start; disable to keep
  // the repository free of generated agent-guidance files.
  agentRules: false,
};

export default nextConfig;
