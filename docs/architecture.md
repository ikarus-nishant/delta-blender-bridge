# Architecture

The system is split into three runtime boundaries:

- Blender extension: owns authoring-side session management, dirty detection, GLB export, and material patch extraction.
- Bridge server: serves the browser viewer and session assets, validates tokens, and relays model and material updates.
- Browser viewer: renders the final-looking scene with Three.js/R3F and applies live material patches without full page reloads.

## Runtime flow

1. Blender creates a session directory and token.
2. Blender starts the local bridge bound to `127.0.0.1`.
3. Blender exports `live_model.glb` into the session directory.
4. Blender registers the session with the bridge.
5. Viewer opens with `session` and `token` query parameters.
6. Viewer connects to `/ws`.
7. Geometry changes trigger `model_updated`.
8. Supported material scalar/color changes trigger `material_patch`.
