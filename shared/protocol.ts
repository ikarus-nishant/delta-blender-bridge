export const DEFAULT_HTTP_PORT = 48731;
export const DEFAULT_WS_PORT = 48732;

export type ToneMappingMode = "ACESFilmic" | "Neutral" | "Cineon" | "Linear" | "NoToneMapping";

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  fov?: number;
}

export type DirtyReason =
  | "geometry_changed"
  | "hierarchy_changed"
  | "transform_changed"
  | "texture_changed"
  | "selection_changed"
  | "animation_changed"
  | "manual_sync";

export type MaterialPatchValues = Partial<{
  color: string;
  roughness: number;
  metalness: number;
  opacity: number;
  emissive: string;
  emissiveIntensity: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  ior: number;
  normalScale: number;
}>;

export interface SessionStartRequest {
  sessionId: string;
  token: string;
  assetDir: string;
  environmentUrl?: string | null;
  toneMapping?: ToneMappingMode;
}

export interface SessionStartResponse {
  ok: true;
  viewerUrl: string;
}

export interface ModelUpdatedRequest {
  sessionId: string;
  token: string;
  modelUrl: string;
  version: number;
  reason: DirtyReason;
  environmentUrl?: string | null;
  toneMapping?: ToneMappingMode;
}

export interface MaterialPatchRequest {
  type: "material_patch";
  sessionId: string;
  token: string;
  materialName: string;
  values: MaterialPatchValues;
  timestamp: number;
}

export interface CameraUpdatedRequest {
  sessionId: string;
  token: string;
  camera: CameraState;
  timestamp: number;
}

export interface TexturePatchRequest {
  type: "texture_patch";
  sessionId: string;
  token: string;
  materialName: string;
  slot: string;
  url: string;
  timestamp: number;
}

export interface ModelUpdatedEvent {
  type: "model_updated";
  modelUrl: string;
  version: number;
  reason: DirtyReason;
  environmentUrl?: string | null;
  toneMapping?: ToneMappingMode;
}

export interface MaterialPatchEvent {
  type: "material_patch";
  materialName: string;
  values: MaterialPatchValues;
}

export interface TexturePatchEvent {
  type: "texture_patch";
  materialName: string;
  slot: string;
  url: string;
}

export interface CameraUpdatedEvent {
  type: "camera_updated";
  camera: CameraState;
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export interface ConnectedEvent {
  type: "connected";
  sessionId: string;
  version?: number;
  modelUrl?: string;
  environmentUrl?: string | null;
  toneMapping?: ToneMappingMode;
  camera?: CameraState;
}

export type ViewerEvent =
  | ConnectedEvent
  | ModelUpdatedEvent
  | MaterialPatchEvent
  | TexturePatchEvent
  | CameraUpdatedEvent
  | ErrorEvent;

export interface HealthResponse {
  ok: true;
  version: string;
  activeSessions: number;
}
