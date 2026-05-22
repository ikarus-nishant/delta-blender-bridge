from __future__ import annotations

from typing import Any


PRINCIPLED_ALIASES = {
    "clearcoat": ("Clearcoat", "Coat Weight"),
    "clearcoat_roughness": ("Clearcoat Roughness", "Coat Roughness"),
    "transmission": ("Transmission", "Transmission Weight"),
}


def _find_input(node: Any, *names: str):
    for name in names:
        if name in node.inputs:
            return node.inputs[name]
    return None


def _principled_node(material: Any):
    if not material or not material.use_nodes or not material.node_tree:
        return None

    for node in material.node_tree.nodes:
        if node.type == "BSDF_PRINCIPLED":
            return node
    return None


def snapshot_material(material: Any) -> dict | None:
    node = _principled_node(material)
    if not node:
        return None

    base_color = _find_input(node, "Base Color")
    metallic = _find_input(node, "Metallic")
    roughness = _find_input(node, "Roughness")
    alpha = _find_input(node, "Alpha")
    emission_color = _find_input(node, "Emission Color", "Emission")
    emission_strength = _find_input(node, "Emission Strength")
    normal = _find_input(node, "Normal")
    clearcoat = _find_input(node, *PRINCIPLED_ALIASES["clearcoat"])
    clearcoat_roughness = _find_input(node, *PRINCIPLED_ALIASES["clearcoat_roughness"])
    transmission = _find_input(node, *PRINCIPLED_ALIASES["transmission"])
    ior = _find_input(node, "IOR")

    rgba = base_color.default_value if base_color else (1.0, 1.0, 1.0, 1.0)
    emissive = emission_color.default_value if emission_color else (0.0, 0.0, 0.0, 1.0)

    return {
        "materialName": material.name,
        "values": {
            "color": "#{:02x}{:02x}{:02x}".format(
                int(max(0.0, min(1.0, rgba[0])) * 255),
                int(max(0.0, min(1.0, rgba[1])) * 255),
                int(max(0.0, min(1.0, rgba[2])) * 255),
            ),
            "roughness": float(roughness.default_value) if roughness else 0.5,
            "metalness": float(metallic.default_value) if metallic else 0.0,
            "opacity": float(alpha.default_value) if alpha else 1.0,
            "emissive": "#{:02x}{:02x}{:02x}".format(
                int(max(0.0, min(1.0, emissive[0])) * 255),
                int(max(0.0, min(1.0, emissive[1])) * 255),
                int(max(0.0, min(1.0, emissive[2])) * 255),
            ),
            "emissiveIntensity": float(emission_strength.default_value) if emission_strength else 0.0,
            "normalScale": 1.0,
            "clearcoat": float(clearcoat.default_value) if clearcoat else 0.0,
            "clearcoatRoughness": float(clearcoat_roughness.default_value) if clearcoat_roughness else 0.0,
            "transmission": float(transmission.default_value) if transmission else 0.0,
            "ior": float(ior.default_value) if ior else 1.5,
        },
    }


def snapshot_materials(materials: list[Any]) -> dict[str, dict]:
    snapshot = {}
    for material in materials:
        entry = snapshot_material(material)
        if entry:
            snapshot[material.name] = entry["values"]
    return snapshot
