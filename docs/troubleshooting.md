# Troubleshooting

## Viewer does not open

- Check Blender add-on preferences for the browser executable override.
- Confirm the bridge process started and `bridge.log` exists in the session log folder.

## Bridge fails to start

- Verify the `Bridge executable path` setting.
- Check whether port `48731` is already in use.
- Run `pnpm build` and confirm `viewer/dist` and `bridge/dist` exist before packaging.

## Material patches do not apply

- Confirm the material uses a supported Principled BSDF setup.
- Verify the exported glTF preserved the material name used in Blender.
- Check the viewer HUD for `Material not found` warnings.

## Geometry updates lag

- Increase the export debounce if heavy meshes are re-exporting too often.
- Confirm the session directory is on a local disk and not a synced network drive.
