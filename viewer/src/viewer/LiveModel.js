import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useLivePreviewStore } from "../store/useLivePreviewStore";
function collectSceneStats(root) {
    let triangleCount = 0;
    const materials = new Set();
    const textures = new Set();
    root.traverse((object) => {
        const mesh = object;
        if (mesh.geometry?.index) {
            triangleCount += mesh.geometry.index.count / 3;
        }
        else if (mesh.geometry?.attributes?.position) {
            triangleCount += mesh.geometry.attributes.position.count / 3;
        }
        const maybeMaterial = object.material;
        const list = Array.isArray(maybeMaterial) ? maybeMaterial : maybeMaterial ? [maybeMaterial] : [];
        for (const material of list) {
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
export function LiveModel({ url, onReady }) {
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
                const mesh = object;
                mesh.geometry?.dispose?.();
                const maybeMaterial = object.material;
                const materials = Array.isArray(maybeMaterial) ? maybeMaterial : maybeMaterial ? [maybeMaterial] : [];
                for (const material of materials) {
                    ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "alphaMap"].forEach((key) => {
                        const texture = material[key];
                        texture?.dispose?.();
                    });
                    material.dispose?.();
                }
            });
        };
    }, [onReady, scene, setLoadState, setSceneStats]);
    return _jsx("primitive", { object: scene });
}
