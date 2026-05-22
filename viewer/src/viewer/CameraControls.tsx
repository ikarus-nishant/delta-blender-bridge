import { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useLivePreviewStore } from "../store/useLivePreviewStore";

export function CameraControls() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const camera = useThree((state) => state.camera);
  const desiredCamera = useLivePreviewStore((state) => state.camera);
  const cameraRevision = useLivePreviewStore((state) => state.cameraRevision);

  useEffect(() => {
    if (!desiredCamera || !controlsRef.current) {
      return;
    }

    camera.position.set(...desiredCamera.position);
    camera.up.set(...desiredCamera.up);
    controlsRef.current.target.set(...desiredCamera.target);
    if ("fov" in camera && typeof desiredCamera.fov === "number") {
      camera.fov = desiredCamera.fov;
      camera.updateProjectionMatrix();
    }
    controlsRef.current.update();
  }, [camera, cameraRevision, desiredCamera]);

  return <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.08} />;
}
