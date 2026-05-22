const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function sha256ForFile(filePath) {
  const hash = crypto.createHash("sha256");
  const buffer = fs.readFileSync(filePath);
  hash.update(buffer);
  return hash.digest("hex");
}

function main() {
  const root = path.resolve(__dirname, "..");
  const packageJsonPath = path.join(root, "package.json");
  const manifestPath = path.join(root, "update_feed", "release-manifest.json");
  const distDir = path.join(root, "dist");

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const version = pkg.version;
  const zipName = `r3f_live_preview_blender_v${version}.zip`;
  const zipPath = path.join(distDir, zipName);

  if (!fs.existsSync(zipPath)) {
    throw new Error(`Release zip not found: ${zipPath}`);
  }

  manifest.version = version;
  manifest.sha256 = sha256ForFile(zipPath);

  const releaseUrl = process.env.R3F_LIVE_PREVIEW_RELEASE_URL;
  if (releaseUrl) {
    manifest.url = releaseUrl;
  }

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Updated ${path.relative(root, manifestPath)} for ${zipName}`);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
