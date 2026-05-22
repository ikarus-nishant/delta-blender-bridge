# Release Checklist

- Build viewer and bridge in a clean workspace.
- Verify `viewer/dist` is copied into the Blender extension package.
- Verify `bridge/dist` is copied into the Blender extension package.
- Install the generated zip in Blender 4.2+.
- Run the selected-object preview flow on Windows.
- Validate geometry reload and material patch behavior.
- Confirm logs are written into the session folder.
- Validate bridge only binds to `127.0.0.1`.
