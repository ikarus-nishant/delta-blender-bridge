import { create } from "zustand";
import type { CameraState, MaterialPatchValues, ToneMappingMode } from "../protocol";

export interface WarningEntry {
  time: number;
  message: string;
}

interface LivePreviewState {
  sessionId: string | null;
  token: string | null;
  connected: boolean;
  modelUrl: string | null;
  modelVersion: number | null;
  loadState: "idle" | "loading" | "ready" | "error";
  lastUpdateAt: number | null;
  materialPatchCount: number;
  lastPatch: { materialName: string; values: MaterialPatchValues } | null;
  lastError: string | null;
  warnings: WarningEntry[];
  materialCount: number;
  textureCount: number;
  triangleCount: number;
  environmentUrl: string | null;
  toneMapping: ToneMappingMode;
  camera: CameraState | null;
  cameraRevision: number;
  setSession(sessionId: string | null, token: string | null): void;
  setConnected(connected: boolean): void;
  setModel(modelUrl: string, version: number): void;
  setLoadState(state: LivePreviewState["loadState"], error?: string | null): void;
  registerPatch(materialName: string, values: MaterialPatchValues): void;
  addWarning(message: string): void;
  setSceneStats(stats: { materialCount: number; textureCount: number; triangleCount: number }): void;
  setEnvironmentConfig(environmentUrl: string | null, toneMapping?: ToneMappingMode): void;
  setCamera(camera: CameraState): void;
}

export const useLivePreviewStore = create<LivePreviewState>((set) => ({
  sessionId: null,
  token: null,
  connected: false,
  modelUrl: null,
  modelVersion: null,
  loadState: "idle",
  lastUpdateAt: null,
  materialPatchCount: 0,
  lastPatch: null,
  lastError: null,
  warnings: [],
  materialCount: 0,
  textureCount: 0,
  triangleCount: 0,
  environmentUrl: null,
  toneMapping: "ACESFilmic",
  camera: null,
  cameraRevision: 0,
  setSession: (sessionId, token) => set({ sessionId, token }),
  setConnected: (connected) => set({ connected }),
  setModel: (modelUrl, version) =>
    set({
      modelUrl,
      modelVersion: version,
      lastUpdateAt: Date.now(),
    }),
  setLoadState: (loadState, error) =>
    set({
      loadState,
      lastError: error ?? null,
    }),
  registerPatch: (materialName, values) =>
    set((state) => ({
      materialPatchCount: state.materialPatchCount + 1,
      lastPatch: { materialName, values },
      lastUpdateAt: Date.now(),
    })),
  addWarning: (message) =>
    set((state) => ({
      warnings: [...state.warnings.slice(-7), { time: Date.now(), message }],
      lastError: message,
    })),
  setSceneStats: (stats) => set(stats),
  setEnvironmentConfig: (environmentUrl, toneMapping) =>
    set({
      environmentUrl,
      toneMapping: toneMapping ?? "ACESFilmic",
    }),
  setCamera: (camera) =>
    set((state) => ({
      camera,
      cameraRevision: state.cameraRevision + 1,
    })),
}));
