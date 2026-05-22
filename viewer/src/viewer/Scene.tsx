import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import type { Group } from "three";
import { useLivePreviewStore } from "../store/useLivePreviewStore";
import { CameraControls } from "./CameraControls";
import { EnvironmentSetup } from "./EnvironmentSetup";
import { LiveModel } from "./LiveModel";
import { MaterialPatchApplier } from "./MaterialPatchApplier";

export function Scene() {
  const modelUrl = useLivePreviewStore((state) => state.modelUrl);
  const lastPatch = useLivePreviewStore((state) => state.lastPatch);
  const [root, setRoot] = useState<Group | null>(null);

  return (
    <Canvas
      gl={{ antialias: true }}
      dpr={[1, 2]}
      style={{ position: "absolute", inset: 0, width: "100vw", height: "100vh" }}
    >
      <PerspectiveCamera makeDefault position={[2.8, 1.8, 4.5]} fov={42} />
      <Suspense fallback={null}>
        <EnvironmentSetup />
        {modelUrl ? <LiveModel key={modelUrl} url={modelUrl} onReady={setRoot} /> : null}
      </Suspense>
      <CameraControls />
      <gridHelper args={[10, 10, "#39404a", "#21262d"]} />
      <MaterialPatchApplier root={root} patch={lastPatch} />
    </Canvas>
  );
}
