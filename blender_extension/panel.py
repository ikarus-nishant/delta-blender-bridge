from __future__ import annotations

import bpy

from .session import SESSION
from .updater import UPDATE_STATE
from .version import APP_VERSION


class R3FLivePreviewSceneProperties(bpy.types.PropertyGroup):
    preview_selected_only: bpy.props.BoolProperty(name="Preview Selected Only", default=True)
    auto_sync_materials: bpy.props.BoolProperty(name="Auto Sync Materials", default=True)
    auto_sync_geometry: bpy.props.BoolProperty(name="Auto Sync Geometry", default=True)
    auto_sync_camera: bpy.props.BoolProperty(name="Auto Sync Camera", default=True)
    use_production_lighting: bpy.props.BoolProperty(name="Use Production Lighting", default=True)
    export_animations: bpy.props.BoolProperty(name="Export Animations", default=False)
    show_debug_logs: bpy.props.BoolProperty(name="Show Debug Logs", default=False)
    viewer_port: bpy.props.IntProperty(name="Viewer Port", default=48731)
    websocket_port: bpy.props.IntProperty(name="WebSocket Port", default=48732)
    material_patch_debounce_ms: bpy.props.IntProperty(name="Material Patch Debounce", default=100)
    glb_export_debounce_ms: bpy.props.IntProperty(name="GLB Export Debounce", default=750)


class R3FLivePreviewPanel(bpy.types.Panel):
    bl_label = "R3F Live Preview"
    bl_idname = "VIEW3D_PT_r3f_live_preview"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "R3F Preview"

    def draw(self, context):
        props = context.scene.r3f_live_preview
        layout = self.layout

        row = layout.row(align=True)
        row.operator("r3f_live_preview.start", text="Start Preview")
        row.operator("r3f_live_preview.stop", text="Stop Preview")

        row = layout.row(align=True)
        row.operator("r3f_live_preview.sync_now", text="Sync Now")
        row.operator("r3f_live_preview.open_viewer", text="Open Viewer")

        row = layout.row(align=True)
        row.operator("r3f_live_preview.check_updates", text="Check Updates")
        row.operator("r3f_live_preview.open_update_folder", text="Open Update Folder")

        layout.prop(props, "preview_selected_only")
        layout.prop(props, "auto_sync_materials")
        layout.prop(props, "auto_sync_geometry")
        layout.prop(props, "auto_sync_camera")
        layout.prop(props, "use_production_lighting")
        layout.prop(props, "export_animations")
        layout.prop(props, "show_debug_logs")

        box = layout.box()
        box.label(text=f"Version: {APP_VERSION}")
        box.label(text=f"Update: {UPDATE_STATE.pending_version or UPDATE_STATE.status_message}")
        box.label(text=f"Bridge: {'Running' if SESSION.status.bridge_running else 'Stopped'}")
        box.label(text=f"Viewer: {'Connected' if SESSION.status.viewer_connected else 'Not Connected'}")
        box.label(text=f"Session ID: {SESSION.status.session_id or 'n/a'}")
        box.label(text=f"Last Sync: {SESSION.status.last_sync_time or 'n/a'}")
        box.label(text=f"Last Export: {SESSION.status.last_export_duration:.2f}s")
        box.label(text=f"Last Error: {SESSION.status.last_error or 'none'}")
