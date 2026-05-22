import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useLivePreviewStore } from "../store/useLivePreviewStore";
const hudStyle = {
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
const summaryRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
};
const badgeStyle = {
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
    return (_jsxs("aside", { style: hudStyle, onClick: () => setExpanded((value) => !value), role: "button", "aria-expanded": expanded, title: expanded ? "Collapse diagnostics" : "Expand diagnostics", children: [_jsxs("div", { style: summaryRowStyle, children: [_jsx("strong", { children: "Diagnostics" }), _jsxs("div", { style: badgeStyle, children: [_jsx("span", { children: connectionLabel }), _jsxs("span", { children: ["v ", modelLabel] }), _jsx("span", { children: expanded ? "Hide" : "Show" })] })] }), expanded ? (_jsxs("div", { style: { marginTop: 10 }, children: [_jsxs("div", { children: ["Connection: ", connectionLabel] }), _jsxs("div", { children: ["Model status: ", state.loadState] }), _jsxs("div", { children: ["Version: ", modelLabel] }), _jsxs("div", { children: ["Materials: ", state.materialCount] }), _jsxs("div", { children: ["Textures: ", state.textureCount] }), _jsxs("div", { children: ["Triangles: ", state.triangleCount] }), _jsxs("div", { children: ["Patches: ", state.materialPatchCount] }), _jsxs("div", { children: ["Last update: ", state.lastUpdateAt ? new Date(state.lastUpdateAt).toLocaleTimeString() : "n/a"] }), _jsxs("div", { children: ["Last error: ", state.lastError ?? "none"] }), _jsxs("div", { style: { marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)" }, children: [_jsxs("div", { children: ["Environment: ", state.environmentUrl ? "Synced from Blender" : "Studio preset fallback"] }), _jsxs("div", { style: { wordBreak: "break-word" }, children: ["HDRI URL: ", state.environmentUrl ?? "none"] }), _jsxs("div", { children: ["Tone mapping: ", state.toneMapping] })] })] })) : null] }));
}
