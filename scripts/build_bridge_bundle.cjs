const esbuild = require("esbuild");
const path = require("node:path");

async function main() {
  const root = path.resolve(__dirname, "..");
  const entry = path.join(root, "bridge", "src", "index.ts");
  const outfile = path.join(root, "bridge", "dist", "bridge.cjs");

  await esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node20",
    sourcemap: false,
    logLevel: "info",
    external: ["node:*"],
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
