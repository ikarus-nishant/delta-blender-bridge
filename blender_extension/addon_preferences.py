from __future__ import annotations

import bpy

from .process_manager import has_node_runtime
from .updater import UPDATE_STATE
from .version import APP_VERSION


class R3FLivePreviewPreferences(bpy.types.AddonPreferences):
    bl_idname = __package__ or "r3f_live_preview"

    bridge_executable_path: bpy.props.StringProperty(name="Bridge executable path", subtype="FILE_PATH")
    viewer_port: bpy.props.IntProperty(name="Viewer port", default=48731)
    websocket_port: bpy.props.IntProperty(name="WebSocket port", default=48732)
    default_export_directory: bpy.props.StringProperty(name="Default export directory", subtype="DIR_PATH")
    browser_executable_path: bpy.props.StringProperty(name="Browser executable path", subtype="FILE_PATH")
    auto_open_browser: bpy.props.BoolProperty(name="Auto-open browser", default=True)
    material_patch_debounce_ms: bpy.props.IntProperty(name="Material patch debounce", default=100, min=50)
    glb_export_debounce_ms: bpy.props.IntProperty(name="GLB export debounce", default=750, min=100)
    production_hdri_path: bpy.props.StringProperty(name="Production HDRI path", subtype="FILE_PATH")
    auto_update_enabled: bpy.props.BoolProperty(name="Auto-check for updates", default=True)
    update_channel: bpy.props.EnumProperty(
        name="Update channel",
        items=[("stable", "Stable", "")],
        default="stable",
    )
    update_feed_url: bpy.props.StringProperty(name="Update feed URL", default="")
    viewer_tone_mapping: bpy.props.EnumProperty(
        name="Viewer tone mapping",
        items=[
            ("ACESFilmic", "ACES Filmic", ""),
            ("Neutral", "Neutral", ""),
            ("Cineon", "Cineon", ""),
            ("Linear", "Linear", ""),
            ("NoToneMapping", "None", ""),
        ],
        default="ACESFilmic",
    )

    def draw(self, context):
        layout = self.layout
        layout.label(text=f"Version: {APP_VERSION}")
        if not has_node_runtime(self.bridge_executable_path):
            box = layout.box()
            box.label(text="Node.js runtime not found.", icon="ERROR")
            box.label(text="Install Node.js or set Bridge executable path before starting preview.")
        layout.prop(self, "bridge_executable_path")
        layout.prop(self, "viewer_port")
        layout.prop(self, "websocket_port")
        layout.prop(self, "default_export_directory")
        layout.prop(self, "browser_executable_path")
        layout.prop(self, "auto_open_browser")
        layout.prop(self, "material_patch_debounce_ms")
        layout.prop(self, "glb_export_debounce_ms")
        layout.prop(self, "production_hdri_path")
        layout.prop(self, "viewer_tone_mapping")
        layout.separator()
        layout.prop(self, "auto_update_enabled")
        layout.prop(self, "update_channel")
        layout.prop(self, "update_feed_url")
        box = layout.box()
        box.label(text=f"Update status: {UPDATE_STATE.status_message}")
        box.label(text=f"Last checked: {UPDATE_STATE.last_checked or 'n/a'}")
        box.label(text=f"Pending version: {UPDATE_STATE.pending_version or 'none'}")
        if UPDATE_STATE.downloaded_zip_path:
            box.label(text="Staged zip downloaded locally")
