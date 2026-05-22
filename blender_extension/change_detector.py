from __future__ import annotations

import time

import bpy
from mathutils import Vector

from .bridge_client import notify_model_updated, send_camera_update, send_material_patch
from .exporter import export_live_model
from .material_extractor import snapshot_materials
from .session import SESSION

LAST_MATERIAL_SYNC = 0.0
LAST_EXPORT_SYNC = 0.0
LAST_CAMERA_SYNC = 0.0


def _blender_to_viewer_vector(vector: Vector) -> list[float]:
    # Match Blender's Z-up basis to the exported glTF / Three.js Y-up basis.
    return [float(vector.x), float(vector.z), float(-vector.y)]


def _active_view3d_region():
    window_manager = bpy.context.window_manager
    for window in window_manager.windows:
        screen = window.screen
        if not screen:
            continue
        for area in screen.areas:
            if area.type != "VIEW_3D":
                continue
            for space in area.spaces:
                if space.type == "VIEW_3D" and space.region_3d:
                    return space
    return None


def _extract_camera_state(scene):
    space = _active_view3d_region()
    if not space:
        return None

    region_3d = space.region_3d
    if region_3d.view_perspective == "CAMERA" and scene.camera:
        matrix = scene.camera.matrix_world.copy()
        quaternion = matrix.to_quaternion()
        position = matrix.translation.copy()
        forward = quaternion @ Vector((0.0, 0.0, -1.0))
        up = quaternion @ Vector((0.0, 1.0, 0.0))
        target = position + forward
        fov = getattr(scene.camera.data, "angle", None)
    else:
        matrix = region_3d.view_matrix.inverted()
        quaternion = matrix.to_quaternion()
        position = matrix.translation.copy()
        target = region_3d.view_location.copy()
        up = quaternion @ Vector((0.0, 1.0, 0.0))
        fov = None

    payload = {
        "position": _blender_to_viewer_vector(position),
        "target": _blender_to_viewer_vector(target),
        "up": _blender_to_viewer_vector(up),
    }
    if fov:
        payload["fov"] = float(fov * 57.29577951308232)
    return payload


def _camera_changed(previous: dict | None, current: dict | None, tolerance: float = 0.0005) -> bool:
    if previous is None or current is None:
        return previous != current

    for key in ("position", "target", "up"):
        for previous_value, current_value in zip(previous[key], current[key]):
            if abs(previous_value - current_value) > tolerance:
                return True

    previous_fov = previous.get("fov")
    current_fov = current.get("fov")
    if previous_fov is None and current_fov is None:
        return False
    if previous_fov is None or current_fov is None:
        return True
    return abs(previous_fov - current_fov) > 0.01


def depsgraph_update_handler(scene, depsgraph):
    if not SESSION.status.session_id:
        return

    for update in depsgraph.updates:
        id_name = getattr(update.id, "bl_rna", None)
        if id_name and update.id.bl_rna.name == "Material":
            SESSION.dirty_state.material_dirty = True
        if id_name and update.id.bl_rna.name in {"Mesh", "Object"}:
            SESSION.dirty_state.geometry_dirty = True


def process_dirty_state():
    global LAST_EXPORT_SYNC, LAST_MATERIAL_SYNC, LAST_CAMERA_SYNC
    if not SESSION.status.session_id:
        return None

    now = time.time()
    context = bpy.context
    scene = context.scene
    props = scene.r3f_live_preview
    base_url = f"http://127.0.0.1:{props.viewer_port}"

    if SESSION.dirty_state.geometry_dirty and (now - LAST_EXPORT_SYNC) * 1000 >= props.glb_export_debounce_ms:
        export_live_model(props.preview_selected_only, props.export_animations)
        notify_model_updated(
            base_url,
            {
                "sessionId": SESSION.status.session_id,
                "token": SESSION.status.token,
                "modelUrl": f"/assets/{SESSION.status.session_id}/live_model.glb",
                "version": SESSION.status.model_version,
                "reason": "geometry_changed",
            },
        )
        SESSION.dirty_state.clear()
        LAST_EXPORT_SYNC = now

    elif SESSION.dirty_state.material_dirty and (now - LAST_MATERIAL_SYNC) * 1000 >= props.material_patch_debounce_ms:
        materials = [material for material in bpy.data.materials if material]
        new_snapshot = snapshot_materials(materials)
        for material_name, values in new_snapshot.items():
            if SESSION.last_material_snapshot.get(material_name) != values:
                send_material_patch(
                    base_url,
                    {
                        "type": "material_patch",
                        "sessionId": SESSION.status.session_id,
                        "token": SESSION.status.token,
                        "materialName": material_name,
                        "values": values,
                        "timestamp": int(time.time() * 1000),
                    },
                )
        SESSION.last_material_snapshot = new_snapshot
        SESSION.dirty_state.material_dirty = False
        LAST_MATERIAL_SYNC = now

    if props.auto_sync_camera and (now - LAST_CAMERA_SYNC) * 1000 >= 150:
        current_camera = _extract_camera_state(scene)
        if current_camera and _camera_changed(SESSION.last_camera_snapshot, current_camera):
            send_camera_update(
                base_url,
                {
                    "sessionId": SESSION.status.session_id,
                    "token": SESSION.status.token,
                    "camera": current_camera,
                    "timestamp": int(time.time() * 1000),
                },
            )
            SESSION.last_camera_snapshot = current_camera
            LAST_CAMERA_SYNC = now

    return 0.1


def register_handlers():
    if depsgraph_update_handler not in bpy.app.handlers.depsgraph_update_post:
        bpy.app.handlers.depsgraph_update_post.append(depsgraph_update_handler)
    bpy.app.timers.register(process_dirty_state, persistent=True)


def unregister_handlers():
    if depsgraph_update_handler in bpy.app.handlers.depsgraph_update_post:
        bpy.app.handlers.depsgraph_update_post.remove(depsgraph_update_handler)
