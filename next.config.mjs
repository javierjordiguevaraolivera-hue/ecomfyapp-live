import path from "node:path";

const projectRoot = process.cwd();

function assertPath(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} must be a non-empty string during next build.`);
  }

  return value;
}

const distDir = ".next";
const outputFileTracingRoot = projectRoot;

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: assertPath(distDir, "nextConfig.distDir"),
  outputFileTracingRoot: assertPath(
    outputFileTracingRoot,
    "nextConfig.outputFileTracingRoot",
  ),
};

path.resolve(assertPath(projectRoot, "projectRoot"));

export default nextConfig;
