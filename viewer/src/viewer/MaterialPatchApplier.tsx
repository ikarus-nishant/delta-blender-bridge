import { useEffect, useRef } from "react";
import { MeshPhysicalMaterial, MeshStandardMaterial, Object3D } from "three";
import { useLivePreviewStore } from "../store/useLivePreviewStore";
import type { MaterialPatchValues } from "../protocol";

type SupportedMaterial = MeshStandardMaterial | MeshPhysicalMaterial;

function isSupportedMaterial(material: unknown): material is SupportedMaterial {
  return material instanceof MeshStandardMaterial || material instanceof MeshPhysicalMaterial;
}

function applyValues(material: SupportedMaterial, values: MaterialPatchValues) {
  if (values.color) material.color.set(values.color);
  if (typeof values.roughness === "number") material.roughness = values.roughness;
  if (typeof values.metalness === "number") material.metalness = values.metalness;
  if (typeof values.opacity === "number") {
    material.opacity = values.opacity;
    material.transparent = values.opacity < 1;
  }
  if (values.emissive) material.emissive.set(values.emissive);
  if (typeof values.emissiveIntensity === "number") material.emissiveIntensity = values.emissiveIntensity;
  if (typeof values.normalScale === "number" && material.normalScale) {
    material.normalScale.setScalar(values.normalScale);
  }
  if ("clearcoat" in material && typeof values.clearcoat === "number") material.clearcoat = values.clearcoat;
  if ("clearcoatRoughness" in material && typeof values.clearcoatRoughness === "number") {
    material.clearcoatRoughness = values.clearcoatRoughness;
  }
  if ("transmission" in material && typeof values.transmission === "number") material.transmission = values.transmission;
  if ("ior" in material && typeof values.ior === "number") material.ior = values.ior;
  material.needsUpdate = true;
}

export function MaterialPatchApplier({ root, patch }: { root: Object3D | null; patch: { materialName: string; values: MaterialPatchValues } | null }) {
  const addWarning = useLivePreviewStore((state) => state.addWarning);
  const indexRef = useRef<Map<string, SupportedMaterial[]>>(new Map());

  useEffect(() => {
    const index = new Map<string, SupportedMaterial[]>();
    if (root) {
      root.traverse((object) => {
        const maybeMaterial = (object as { material?: unknown }).material;
        const materials = Array.isArray(maybeMaterial) ? maybeMaterial : maybeMaterial ? [maybeMaterial] : [];
        for (const material of materials) {
          if (isSupportedMaterial(material) && material.name) {
            const bucket = index.get(material.name) ?? [];
            bucket.push(material);
            index.set(material.name, bucket);
          }
        }
      });
    }
    indexRef.current = index;
  }, [root]);

  useEffect(() => {
    if (!patch) {
      return;
    }
    const materials = indexRef.current.get(patch.materialName);
    if (!materials?.length) {
      addWarning(`Material not found: ${patch.materialName}`);
      return;
    }
    materials.forEach((material) => applyValues(material, patch.values));
  }, [addWarning, patch]);

  return null;
}
