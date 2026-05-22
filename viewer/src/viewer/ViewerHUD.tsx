import type { CSSProperties } from "react";
import { useState } from "react";
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
  cursor: "pointer",
  userSelect: "none",
};

const summaryRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "4px 8px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  fontSize: 11,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

export function ViewerHUD() {
  const state = useLivePreviewStore();
  const [expanded, setExpanded] = useState(false);
  const connectionLabel = state.connected ? "Connected" : "Disconnected";
  const modelLabel = state.modelVersion ?? "n/a";

  return (
    <aside
      style={hudStyle}
      onClick={() => setExpanded((value) => !value)}
      role="button"
      aria-expanded={expanded}
      title={expanded ? "Collapse diagnostics" : "Expand diagnostics"}
    >
      <div style={summaryRowStyle}>
        <strong>Diagnostics</strong>
        <div style={badgeStyle}>
          <span>{connectionLabel}</span>
          <span>v {modelLabel}</span>
          <span>{expanded ? "Hide" : "Show"}</span>
        </div>
      </div>
      {expanded ? (
        <div style={{ marginTop: 10 }}>
          <div>Connection: {connectionLabel}</div>
          <div>Model status: {state.loadState}</div>
          <div>Version: {modelLabel}</div>
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
        </div>
      ) : null}
    </aside>
  );
}
