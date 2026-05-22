const { spawnSync } = require("node:child_process");
const process = require("node:process");

const [, , scriptName, workspaceArg] = process.argv;

if (!scriptName) {
  console.error("Usage: node scripts/run-workspace.cjs <script> [workspace]");
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (typeof result.status === "number") {
    process.exit(result.status);
  }

  console.error(result.error || `Failed to run ${command}`);
  process.exit(1);
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const workspaceMap = {
  bridge: "@r3f-live-preview/bridge",
  viewer: "@r3f-live-preview/viewer",
};

if (workspaceArg) {
  const workspace = workspaceMap[workspaceArg] || workspaceArg;
  run(npmCommand, ["run", scriptName, "--workspace", workspace]);
}

run(npmCommand, ["run", "--workspaces", scriptName]);
