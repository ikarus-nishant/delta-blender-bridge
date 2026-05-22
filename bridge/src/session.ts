import path from "node:path";
import type { CameraState, ToneMappingMode } from "./protocol.js";
import { assertInsideDirectory } from "./security.js";

export interface SessionRecord {
  sessionId: string;
  token: string;
  assetDir: string;
  createdAt: number;
  lastVersion?: number;
  lastModelUrl?: string;
  environmentUrl?: string | null;
  toneMapping?: ToneMappingMode;
  camera?: CameraState;
}

export class SessionStore {
  private sessions = new Map<string, SessionRecord>();

  create(
    sessionId: string,
    token: string,
    assetDir: string,
    environmentUrl?: string | null,
    toneMapping?: ToneMappingMode,
  ) {
    const normalizedDir = path.resolve(assetDir);
    const record: SessionRecord = {
      sessionId,
      token,
      assetDir: normalizedDir,
      createdAt: Date.now(),
      environmentUrl: environmentUrl ?? null,
      toneMapping,
    };
    this.sessions.set(sessionId, record);
    return record;
  }

  count() {
    return this.sessions.size;
  }

  get(sessionId: string) {
    return this.sessions.get(sessionId);
  }

  validate(sessionId: string, token: string) {
    const session = this.sessions.get(sessionId);
    if (!session || session.token !== token) {
      throw new Error("Invalid session token");
    }
    return session;
  }

  assetPathFor(sessionId: string, relativePath: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Unknown session");
    }
    const target = path.join(session.assetDir, relativePath);
    return assertInsideDirectory(session.assetDir, target);
  }

  updateModel(
    sessionId: string,
    lastModelUrl: string,
    lastVersion: number,
    environmentUrl?: string | null,
    toneMapping?: ToneMappingMode,
  ) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Unknown session");
    }
    session.lastModelUrl = lastModelUrl;
    session.lastVersion = lastVersion;
    if (environmentUrl !== undefined) {
      session.environmentUrl = environmentUrl;
    }
    if (toneMapping) {
      session.toneMapping = toneMapping;
    }
    return session;
  }

  updateCamera(sessionId: string, camera: CameraState) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Unknown session");
    }
    session.camera = camera;
    return session;
  }
}
