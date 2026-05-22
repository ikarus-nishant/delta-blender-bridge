from __future__ import annotations

import time

import bpy

from .session import SESSION


def export_live_model(preview_selected_only: bool, export_animations: bool) -> float:
    started = time.time()
    filepath = str(SESSION.model_path)

    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format="GLB",
        use_selection=preview_selected_only,
        export_materials="EXPORT",
        export_cameras=True,
        export_lights=True,
        export_animations=export_animations,
        export_apply=False,
    )
    duration = time.time() - started
    SESSION.status.last_export_duration = duration
    SESSION.status.last_sync_time = time.strftime("%H:%M:%S")
    SESSION.status.model_version = int(time.time() * 1000)
    return duration
