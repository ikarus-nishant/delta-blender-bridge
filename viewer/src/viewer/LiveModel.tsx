import { useEffect, useMemo } from "react";
import { Group, Mesh } from "three";
import { useGLTF } from "@react-three/drei";
import { useLivePreviewStore } from "../store/useLivePreviewStore";

function collectSceneStats(root: Group) {
  let triangleCount = 0;
  const materials = new Set<unknown>();
  const textures = new Set<unknown>();

  root.traverse((object) => {
    const mesh = object as Mesh;
    if (mesh.geometry?.index) {
      triangleCount += mesh.geometry.index.count / 3;
    } else if (mesh.geometry?.attributes?.position) {
      triangleCount += mesh.geometry.attributes.position.count / 3;
    }
    const maybeMaterial = (object as { material?: unknown }).material;
    const list = Array.isArray(maybeMaterial) ? maybeMaterial : maybeMaterial ? [maybeMaterial] : [];
    for (const material of list as Array<Record<string, unknown>>) {
      materials.add(material);
      ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "alphaMap"].forEach((key) => {
        if (material[key]) {
          textures.add(material[key]);
        }
      });
    }
  });

  return {
    triangleCount: Math.round(triangleCount),
    materialCount: materials.size,
    textureCount: textures.size,
  };
}

export function LiveModel({ url, onReady }: { url: string; onReady(root: Group): void }) {
  const setLoadState = useLivePreviewStore((state) => state.setLoadState);
  const setSceneStats = useLivePreviewStore((state) => state.setSceneStats);
  useEffect(() => {
    setLoadState("loading");
  }, [setLoadState, url]);

  const gltf = useGLTF(url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    const stats = collectSceneStats(scene);
    setSceneStats(stats);
    setLoadState("ready");
    onReady(scene);
    return () => {
      scene.traverse((object) => {
        const mesh = object as Mesh;
        mesh.geometry?.dispose?.();
        const maybeMaterial = (object as { material?: unknown }).material;
        const materials = Array.isArray(maybeMaterial) ? maybeMaterial : maybeMaterial ? [maybeMaterial] : [];
        for (const material of materials as Array<Record<string, unknown>>) {
          ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "alphaMap"].forEach((key) => {
            const texture = material[key] as { dispose?: () => void } | undefined;
            texture?.dispose?.();
          });
          (material as { dispose?: () => void }).dispose?.();
        }
      });
    };
  }, [onReady, scene, setLoadState, setSceneStats]);

  return <primitive object={scene} />;
}
