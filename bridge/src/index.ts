import path from "node:path";
import { startBridgeServer } from "./server.js";

const httpPort = Number(process.env.R3F_LIVE_PREVIEW_HTTP_PORT ?? "48731");
const viewerDistDir = process.env.R3F_LIVE_PREVIEW_VIEWER_DIST
  ? path.resolve(process.env.R3F_LIVE_PREVIEW_VIEWER_DIST)
  : path.resolve(process.cwd(), "../viewer/dist");
const logFilePath = process.env.R3F_LIVE_PREVIEW_BRIDGE_LOG;

startBridgeServer({
  httpPort,
  viewerDistDir,
  logFilePath,
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
