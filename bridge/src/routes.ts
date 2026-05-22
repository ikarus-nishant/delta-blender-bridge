import path from "node:path";
import express from "express";
import { z } from "zod";
import type { Logger } from "./logger.js";
import {
  type CameraUpdatedRequest,
  type DirtyReason,
  type HealthResponse,
  type MaterialPatchRequest,
  type ModelUpdatedRequest,
  type SessionStartRequest,
  type ToneMappingMode,
} from "./protocol.js";
import type { SessionStore } from "./session.js";
import type { WsHub } from "./wsHub.js";

const sessionStartSchema = z.object({
  sessionId: z.string().min(1),
  token: z.string().min(1),
  assetDir: z.string().min(1),
  environmentUrl: z.string().nullable().optional(),
  toneMapping: z
    .enum(["ACESFilmic", "Neutral", "Cineon", "Linear", "NoToneMapping"] satisfies [ToneMappingMode, ...ToneMappingMode[]])
    .optional(),
});

const modelUpdatedSchema = z.object({
  sessionId: z.string().min(1),
  token: z.string().min(1),
  modelUrl: z.string().min(1),
  version: z.number(),
  reason: z.custom<DirtyReason>(),
  environmentUrl: z.string().nullable().optional(),
  toneMapping: z
    .enum(["ACESFilmic", "Neutral", "Cineon", "Linear", "NoToneMapping"] satisfies [ToneMappingMode, ...ToneMappingMode[]])
    .optional(),
});

const materialPatchSchema = z.object({
  type: z.literal("material_patch"),
  sessionId: z.string().min(1),
  token: z.string().min(1),
  materialName: z.string().min(1),
  values: z.record(z.union([z.string(), z.number()])),
  timestamp: z.number(),
});

const cameraUpdatedSchema = z.object({
  sessionId: z.string().min(1),
  token: z.string().min(1),
  camera: z.object({
    position: z.tuple([z.number(), z.number(), z.number()]),
    target: z.tuple([z.number(), z.number(), z.number()]),
    up: z.tuple([z.number(), z.number(), z.number()]),
    fov: z.number().optional(),
  }),
  timestamp: z.number(),
});

export function registerRoutes(options: {
  app: express.Express;
  sessions: SessionStore;
  wsHub: WsHub;
  logger: Logger;
  version: string;
  viewerDistDir: string;
  httpPort: number;
}) {
  const { app, sessions, wsHub, logger, version, viewerDistDir, httpPort } = options;

  app.get("/health", (_request, response) => {
    const payload: HealthResponse = {
      ok: true,
      version,
      activeSessions: sessions.count(),
    };
    response.json(payload);
  });

  app.post("/api/session/start", (request, response, next) => {
    try {
      const payload = sessionStartSchema.parse(request.body) satisfies SessionStartRequest;
      sessions.create(payload.sessionId, payload.token, payload.assetDir, payload.environmentUrl, payload.toneMapping);
      logger.info("Session started", payload);
      response.json({
        ok: true,
        viewerUrl: `http://127.0.0.1:${httpPort}/?session=${encodeURIComponent(payload.sessionId)}&token=${encodeURIComponent(payload.token)}`,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/model-updated", (request, response, next) => {
    try {
      const payload = modelUpdatedSchema.parse(request.body) satisfies ModelUpdatedRequest;
      sessions.validate(payload.sessionId, payload.token);
      sessions.updateModel(payload.sessionId, payload.modelUrl, payload.version, payload.environmentUrl, payload.toneMapping);
      wsHub.broadcast(payload.sessionId, {
        type: "model_updated",
        modelUrl: `${payload.modelUrl}?v=${payload.version}`,
        version: payload.version,
        reason: payload.reason,
        environmentUrl: payload.environmentUrl,
        toneMapping: payload.toneMapping,
      });
      logger.info("Model updated", payload);
      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/material-patch", (request, response, next) => {
    try {
      const payload = materialPatchSchema.parse(request.body) satisfies MaterialPatchRequest;
      sessions.validate(payload.sessionId, payload.token);
      wsHub.broadcast(payload.sessionId, {
        type: "material_patch",
        materialName: payload.materialName,
        values: payload.values,
      });
      logger.info("Material patch forwarded", {
        materialName: payload.materialName,
        keys: Object.keys(payload.values),
      });
      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/camera-updated", (request, response, next) => {
    try {
      const payload = cameraUpdatedSchema.parse(request.body) satisfies CameraUpdatedRequest;
      sessions.validate(payload.sessionId, payload.token);
      sessions.updateCamera(payload.sessionId, payload.camera);
      wsHub.broadcast(payload.sessionId, {
        type: "camera_updated",
        camera: payload.camera,
      });
      logger.info("Camera updated", payload.camera);
      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.get("/assets/:sessionId/*", (request, response, next) => {
    try {
      const { sessionId } = request.params;
      const relativePath = ((request.params as unknown as Record<string, string | string[]>)["0"] ?? "") as string;
      const target = sessions.assetPathFor(sessionId, relativePath);
      response.sendFile(target);
    } catch (error) {
      next(error);
    }
  });

  app.use(express.static(viewerDistDir));
  app.get("*", (_request, response) => {
    response.sendFile(path.join(viewerDistDir, "index.html"));
  });
}
