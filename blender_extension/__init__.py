from __future__ import annotations

from .version import APP_VERSION_TUPLE, DEFAULT_UPDATE_FEED_URL, MIN_BLENDER_VERSION_TUPLE

bl_info = {
    "name": "R3F Live Preview",
    "author": "Ikarus Delta",
    "version": APP_VERSION_TUPLE,
    "blender": MIN_BLENDER_VERSION_TUPLE,
    "location": "View3D > Sidebar > R3F Preview",
    "description": "Preview Blender models in a local React Three Fiber viewer",
    "category": "3D View",
}

import bpy

from .addon_preferences import R3FLivePreviewPreferences
from .operators import (
    R3FCheckUpdatesOperator,
    R3FOpenViewerOperator,
    R3FOpenUpdateFolderOperator,
    R3FPreviewStartOperator,
    R3FPreviewStopOperator,
    R3FPreviewSyncOperator,
)
from .panel import R3FLivePreviewPanel, R3FLivePreviewSceneProperties
from .process_manager import has_node_runtime
from .updater import load_state, mark_installed_build_if_ready, start_background_update_check


CLASSES = (
    R3FLivePreviewPreferences,
    R3FLivePreviewSceneProperties,
    R3FPreviewStartOperator,
    R3FPreviewStopOperator,
    R3FPreviewSyncOperator,
    R3FOpenViewerOperator,
    R3FCheckUpdatesOperator,
    R3FOpenUpdateFolderOperator,
    R3FLivePreviewPanel,
)


def _notify_missing_node():
    if has_node_runtime():
        return None

    def draw(self, _context):
        self.layout.label(text="R3F Live Preview requires Node.js.", icon="ERROR")
        self.layout.label(text="Install Node.js, then restart Blender.")
        self.layout.label(text="You can also set Bridge executable path in add-on preferences.")

    bpy.context.window_manager.popup_menu(draw, title="Node.js Required", icon="ERROR")
    return None


def register():
    for cls in CLASSES:
        bpy.utils.register_class(cls)
    bpy.types.Scene.r3f_live_preview = bpy.props.PointerProperty(type=R3FLivePreviewSceneProperties)
    load_state()
    mark_installed_build_if_ready()
    if not has_node_runtime():
        bpy.app.timers.register(_notify_missing_node, first_interval=1.0)
    addon = bpy.context.preferences.addons.get(__package__)
    if addon:
        preferences = addon.preferences
        if not preferences.update_feed_url:
            preferences.update_feed_url = DEFAULT_UPDATE_FEED_URL
        if preferences.auto_update_enabled and preferences.update_feed_url:
            bpy.app.timers.register(
                lambda: start_background_update_check(preferences.update_feed_url, bpy.app.version[:3]) or None,
                first_interval=2.0,
            )


def unregister():
    del bpy.types.Scene.r3f_live_preview
    for cls in reversed(CLASSES):
        bpy.utils.unregister_class(cls)
