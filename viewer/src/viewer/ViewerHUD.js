import { jsxs as _jsxs } from "react/jsx-runtime";
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
};
export function ViewerHUD() {
    const state = useLivePreviewStore();
    return (_jsxs("aside", { style: hudStyle, children: [_jsxs("div", { children: ["Connection: ", state.connected ? "Connected" : "Disconnected"] }), _jsxs("div", { children: ["Model status: ", state.loadState] }), _jsxs("div", { children: ["Version: ", state.modelVersion ?? "n/a"] }), _jsxs("div", { children: ["Materials: ", state.materialCount] }), _jsxs("div", { children: ["Textures: ", state.textureCount] }), _jsxs("div", { children: ["Triangles: ", state.triangleCount] }), _jsxs("div", { children: ["Patches: ", state.materialPatchCount] }), _jsxs("div", { children: ["Last update: ", state.lastUpdateAt ? new Date(state.lastUpdateAt).toLocaleTimeString() : "n/a"] }), _jsxs("div", { children: ["Last error: ", state.lastError ?? "none"] }), _jsxs("div", { style: { marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)" }, children: [_jsxs("div", { children: ["Environment: ", state.environmentUrl ? "Synced from Blender" : "Studio preset fallback"] }), _jsxs("div", { style: { wordBreak: "break-word" }, children: ["HDRI URL: ", state.environmentUrl ?? "none"] }), _jsxs("div", { children: ["Tone mapping: ", state.toneMapping] })] })] }));
}
