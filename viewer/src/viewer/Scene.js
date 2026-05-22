import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useLivePreviewStore } from "../store/useLivePreviewStore";
import { CameraControls } from "./CameraControls";
import { EnvironmentSetup } from "./EnvironmentSetup";
import { LiveModel } from "./LiveModel";
import { MaterialPatchApplier } from "./MaterialPatchApplier";
export function Scene() {
    const modelUrl = useLivePreviewStore((state) => state.modelUrl);
    const lastPatch = useLivePreviewStore((state) => state.lastPatch);
    const [root, setRoot] = useState(null);
    return (_jsxs(Canvas, { gl: { antialias: true }, dpr: [1, 2], style: { position: "absolute", inset: 0, width: "100vw", height: "100vh" }, children: [_jsx(PerspectiveCamera, { makeDefault: true, position: [2.8, 1.8, 4.5], fov: 42 }), _jsxs(Suspense, { fallback: null, children: [_jsx(EnvironmentSetup, {}), modelUrl ? _jsx(LiveModel, { url: modelUrl, onReady: setRoot }, modelUrl) : null] }), _jsx(CameraControls, {}), _jsx("gridHelper", { args: [10, 10, "#39404a", "#21262d"] }), _jsx(MaterialPatchApplier, { root: root, patch: lastPatch })] }));
}
