from __future__ import annotations

import secrets
import tempfile
import time
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class PreviewStatus:
    bridge_running: bool = False
    viewer_connected: bool = False
    session_id: str = ""
    token: str = ""
    session_dir: Path | None = None
    last_sync_time: str = ""
    last_export_duration: float = 0.0
    last_error: str = ""
    model_version: int = 0
    auto_sync_enabled: bool = False


@dataclass
class DirtyState:
    material_dirty: bool = False
    texture_dirty: bool = False
    geometry_dirty: bool = False
    hierarchy_dirty: bool = False
    transform_dirty: bool = False
    animation_dirty: bool = False

    def clear(self) -> None:
        self.material_dirty = False
        self.texture_dirty = False
        self.geometry_dirty = False
        self.hierarchy_dirty = False
        self.transform_dirty = False
        self.animation_dirty = False


@dataclass
class PreviewSession:
    status: PreviewStatus = field(default_factory=PreviewStatus)
    dirty_state: DirtyState = field(default_factory=DirtyState)
    last_material_snapshot: dict = field(default_factory=dict)
    last_camera_snapshot: dict | None = None

    def begin(self, export_root: str | None = None) -> None:
        session_id = f"r3f-{int(time.time())}"
        token = secrets.token_urlsafe(24)
        base_dir = Path(export_root) if export_root else Path(tempfile.gettempdir()) / "r3f-live-preview"
        session_dir = base_dir / session_id
        session_dir.mkdir(parents=True, exist_ok=True)
        (session_dir / "logs").mkdir(exist_ok=True)

        self.status = PreviewStatus(
            bridge_running=False,
            viewer_connected=False,
            session_id=session_id,
            token=token,
            session_dir=session_dir,
            model_version=int(time.time() * 1000),
        )
        self.dirty_state.clear()
        self.last_material_snapshot = {}
        self.last_camera_snapshot = None

    @property
    def asset_dir(self) -> Path:
        if not self.status.session_dir:
            raise RuntimeError("Preview session is not active")
        return self.status.session_dir

    @property
    def model_path(self) -> Path:
        return self.asset_dir / "live_model.glb"

    @property
    def bridge_log_path(self) -> Path:
        return self.asset_dir / "logs" / "bridge.log"

    @property
    def blender_log_path(self) -> Path:
        return self.asset_dir / "logs" / "blender_extension.log"


SESSION = PreviewSession()
