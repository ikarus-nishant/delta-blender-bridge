from __future__ import annotations

import os
import shutil
import time
import webbrowser
from pathlib import Path

import bpy

from .bridge_client import notify_model_updated, send_camera_update, start_session
from .change_detector import _extract_camera_state, register_handlers, unregister_handlers
from .exporter import export_live_model
from .logger import create_logger, log_json
from .material_extractor import snapshot_materials
from .process_manager import has_node_runtime, node_runtime_error_message, start_bridge, stop_bridge, wait_for_bridge_ready
from .session import SESSION
from .updater import UPDATE_STATE, _appdata_root, start_background_update_check


def _prefs(context):
    return context.preferences.addons[__package__].preferences


def _props(context):
    return context.scene.r3f_live_preview


def _sync_environment_asset(prefs) -> str | None:
    if not prefs.production_hdri_path:
        return None

    source = Path(bpy.path.abspath(prefs.production_hdri_path))
    if not source.exists() or not source.is_file():
        raise FileNotFoundError(f"HDRI not found: {source}")

    target = SESSION.asset_dir / f"environment{source.suffix.lower() or '.hdr'}"
    shutil.copy2(source, target)
    return f"/assets/{SESSION.status.session_id}/{target.name}?v={int(time.time() * 1000)}"


def _viewer_url(prefs, port: int) -> str:
    if prefs.use_external_viewer:
        base = (prefs.external_viewer_url or "http://127.0.0.1:4173").rstrip("/")
        return f"{base}/?session={SESSION.status.session_id}&token={SESSION.status.token}"
    return f"http://127.0.0.1:{port}/?session={SESSION.status.session_id}&token={SESSION.status.token}"


class R3FPreviewStartOperator(bpy.types.Operator):
    bl_idname = "r3f_live_preview.start"
    bl_label = "Start Preview"

    def execute(self, context):
        props = _props(context)
        prefs = _prefs(context)
        if not has_node_runtime(prefs.bridge_executable_path):
            message = node_runtime_error_message()
            SESSION.status.last_error = message
            self.report({"ERROR"}, message)
            return {"CANCELLED"}
        if props.preview_selected_only and not context.selected_objects:
            self.report({"WARNING"}, "No objects selected for preview")
            return {"CANCELLED"}
        try:
            SESSION.begin(prefs.default_export_directory or None)
            logger = create_logger(SESSION.blender_log_path)

            extension_root = Path(__file__).resolve().parent
            bridge_entry = prefs.bridge_executable_path or "node"
            viewer_dist = str(Path(__file__).resolve().parent / "viewer_dist")
            bridge_script = extension_root / "bridge_dist" / "bridge.cjs"
            if bridge_entry.lower().endswith("node.exe") or bridge_entry.lower() == "node":
                bridge_command = [bridge_entry, str(bridge_script)]
            else:
                bridge_command = [bridge_entry]

            start_bridge(
                bridge_command,
                viewer_dist,
                props.viewer_port,
                SESSION.bridge_log_path,
            )
            wait_for_bridge_ready(props.viewer_port)
            SESSION.status.bridge_running = True

            environment_url = None
            if props.use_production_lighting:
                environment_url = _sync_environment_asset(prefs)

            export_live_model(props.preview_selected_only, props.export_animations)
            base_url = f"http://127.0.0.1:{props.viewer_port}"
            response = start_session(
                base_url,
                {
                    "sessionId": SESSION.status.session_id,
                    "token": SESSION.status.token,
                    "assetDir": str(SESSION.asset_dir),
                    "environmentUrl": environment_url,
                    "toneMapping": prefs.viewer_tone_mapping,
                },
            )
            notify_model_updated(
                base_url,
                {
                    "sessionId": SESSION.status.session_id,
                    "token": SESSION.status.token,
                    "modelUrl": f"/assets/{SESSION.status.session_id}/live_model.glb",
                    "version": SESSION.status.model_version,
                    "reason": "manual_sync",
                    "environmentUrl": environment_url,
                    "toneMapping": prefs.viewer_tone_mapping,
                },
            )
            camera = _extract_camera_state(context.scene)
            if camera:
                send_camera_update(
                    base_url,
                    {
                        "sessionId": SESSION.status.session_id,
                        "token": SESSION.status.token,
                        "camera": camera,
                        "timestamp": int(time.time() * 1000),
                    },
                )
                SESSION.last_camera_snapshot = camera

            SESSION.last_material_snapshot = snapshot_materials([material for material in bpy.data.materials if material])
            register_handlers()
            SESSION.status.auto_sync_enabled = True
            viewer_url = _viewer_url(prefs, props.viewer_port)
            log_json(
                logger,
                "session_started",
                {
                    "viewerUrl": viewer_url,
                    "bridgeViewerUrl": response["viewerUrl"],
                    "environmentUrl": environment_url,
                    "toneMapping": prefs.viewer_tone_mapping,
                },
            )

            if prefs.auto_open_browser:
                if prefs.browser_executable_path:
                    webbrowser.register("r3f_live_preview_browser", None, webbrowser.BackgroundBrowser(prefs.browser_executable_path))
                    webbrowser.get("r3f_live_preview_browser").open(viewer_url)
                else:
                    webbrowser.open(viewer_url)
        except Exception as error:  # noqa: BLE001
            SESSION.status.last_error = str(error)
            stop_bridge()
            self.report({"ERROR"}, str(error))
            return {"CANCELLED"}

        self.report({"INFO"}, "R3F preview started")
        return {"FINISHED"}


class R3FPreviewStopOperator(bpy.types.Operator):
    bl_idname = "r3f_live_preview.stop"
    bl_label = "Stop Preview"

    def execute(self, context):
        unregister_handlers()
        stop_bridge()
        SESSION.status = SESSION.status.__class__()
        SESSION.dirty_state.clear()
        SESSION.last_material_snapshot = {}
        self.report({"INFO"}, "R3F preview stopped")
        return {"FINISHED"}


class R3FPreviewSyncOperator(bpy.types.Operator):
    bl_idname = "r3f_live_preview.sync_now"
    bl_label = "Sync Now"

    def execute(self, context):
        if not SESSION.status.session_id:
            self.report({"WARNING"}, "Preview is not running")
            return {"CANCELLED"}

        props = _props(context)
        prefs = _prefs(context)
        environment_url = None
        if props.use_production_lighting:
            environment_url = _sync_environment_asset(prefs)
        export_live_model(props.preview_selected_only, props.export_animations)
        base_url = f"http://127.0.0.1:{props.viewer_port}"
        notify_model_updated(
            base_url,
            {
                "sessionId": SESSION.status.session_id,
                "token": SESSION.status.token,
                "modelUrl": f"/assets/{SESSION.status.session_id}/live_model.glb",
                "version": int(time.time() * 1000),
                "reason": "manual_sync",
                "environmentUrl": environment_url,
                "toneMapping": prefs.viewer_tone_mapping,
            },
        )
        camera = _extract_camera_state(context.scene)
        if camera:
            send_camera_update(
                base_url,
                {
                    "sessionId": SESSION.status.session_id,
                    "token": SESSION.status.token,
                    "camera": camera,
                    "timestamp": int(time.time() * 1000),
                },
            )
            SESSION.last_camera_snapshot = camera
        self.report({"INFO"}, "Preview synced")
        return {"FINISHED"}


class R3FOpenViewerOperator(bpy.types.Operator):
    bl_idname = "r3f_live_preview.open_viewer"
    bl_label = "Open Viewer"

    def execute(self, context):
        if not SESSION.status.session_id:
            self.report({"WARNING"}, "Preview is not running")
            return {"CANCELLED"}

        props = _props(context)
        prefs = _prefs(context)
        url = _viewer_url(prefs, props.viewer_port)
        webbrowser.open(url)
        return {"FINISHED"}


class R3FCheckUpdatesOperator(bpy.types.Operator):
    bl_idname = "r3f_live_preview.check_updates"
    bl_label = "Check for Updates"

    def execute(self, context):
        prefs = _prefs(context)
        if not prefs.update_feed_url:
            self.report({"WARNING"}, "Set Update feed URL in add-on preferences first")
            return {"CANCELLED"}
        start_background_update_check(prefs.update_feed_url, bpy.app.version[:3])
        self.report({"INFO"}, "Checking for updates in background")
        return {"FINISHED"}


class R3FOpenUpdateFolderOperator(bpy.types.Operator):
    bl_idname = "r3f_live_preview.open_update_folder"
    bl_label = "Open Update Folder"

    def execute(self, context):
        folder = _appdata_root()
        if hasattr(os, "startfile"):
            os.startfile(str(folder))  # type: ignore[attr-defined]
        else:
            webbrowser.open(folder.as_uri())
        if UPDATE_STATE.pending_version:
            self.report({"INFO"}, f"Pending update {UPDATE_STATE.pending_version} is staged here")
        else:
            self.report({"INFO"}, "Opened update staging folder")
        return {"FINISHED"}
