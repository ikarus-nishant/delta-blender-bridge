import type { CSSProperties } from "react";
import { useLivePreviewStore } from "../store/useLivePreviewStore";

const hudStyle: CSSProperties = {
  position: "absolute",
  top: 16,
  left: 16,
  width: 320,
  padding: 14,
  borderRadius: 12,
  background: "rgba(11, 14, 20, 0.78)",
  color: "#f3f5f7",
  fontSize: 12,
  lineHeight: 1.5,
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
};

export function ViewerHUD() {
  const state = useLivePreviewStore();

  return (
    <aside style={hudStyle}>
      <div>Connection: {state.connected ? "Connected" : "Disconnected"}</div>
      <div>Model status: {state.loadState}</div>
      <div>Version: {state.modelVersion ?? "n/a"}</div>
      <div>Materials: {state.materialCount}</div>
      <div>Textures: {state.textureCount}</div>
      <div>Triangles: {state.triangleCount}</div>
      <div>Patches: {state.materialPatchCount}</div>
      <div>Last update: {state.lastUpdateAt ? new Date(state.lastUpdateAt).toLocaleTimeString() : "n/a"}</div>
      <div>Last error: {state.lastError ?? "none"}</div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div>Environment: {state.environmentUrl ? "Synced from Blender" : "Studio preset fallback"}</div>
        <div style={{ wordBreak: "break-word" }}>
          HDRI URL: {state.environmentUrl ?? "none"}
        </div>
        <div>Tone mapping: {state.toneMapping}</div>
      </div>
    </aside>
  );
}
