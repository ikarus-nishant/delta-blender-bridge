from __future__ import annotations

import hashlib
import json
import os
import tempfile
import threading
import time
import urllib.request
from dataclasses import asdict, dataclass
from pathlib import Path

from .version import APP_VERSION


@dataclass
class UpdateState:
    checking: bool = False
    update_available: bool = False
    pending_version: str = ""
    downloaded_zip_path: str = ""
    last_checked: str = ""
    status_message: str = "No update check yet"
    latest_version: str = ""
    release_notes: str = ""
    error: str = ""


UPDATE_STATE = UpdateState()
_CHECK_THREAD: threading.Thread | None = None
_LOCK = threading.Lock()


def _version_key(version: str) -> tuple[int, ...]:
    parts: list[int] = []
    for chunk in version.split("."):
        try:
            parts.append(int(chunk))
        except ValueError:
            digits = "".join(character for character in chunk if character.isdigit())
            parts.append(int(digits or "0"))
    return tuple(parts)


def is_newer_version(candidate: str, current: str = APP_VERSION) -> bool:
    return _version_key(candidate) > _version_key(current)


def _appdata_root() -> Path:
    root = os.environ.get("LOCALAPPDATA") or tempfile.gettempdir()
    path = Path(root) / "R3FLivePreview" / "updates"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _state_path() -> Path:
    return _appdata_root() / "state.json"


def _timestamp() -> str:
    return time.strftime("%Y-%m-%d %H:%M:%S")


def load_state() -> None:
    path = _state_path()
    if not path.exists():
        return
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        with _LOCK:
            UPDATE_STATE.pending_version = payload.get("pending_version", "")
            UPDATE_STATE.downloaded_zip_path = payload.get("downloaded_zip_path", "")
            UPDATE_STATE.last_checked = payload.get("last_checked", "")
            UPDATE_STATE.status_message = payload.get("status_message", UPDATE_STATE.status_message)
            UPDATE_STATE.latest_version = payload.get("latest_version", "")
            UPDATE_STATE.release_notes = payload.get("release_notes", "")
            UPDATE_STATE.update_available = bool(UPDATE_STATE.pending_version)
    except Exception as error:  # noqa: BLE001
        with _LOCK:
            UPDATE_STATE.error = str(error)
            UPDATE_STATE.status_message = "Failed to load updater state"


def save_state() -> None:
    with _LOCK:
        payload = asdict(UPDATE_STATE)
        payload.pop("checking", None)
        payload.pop("error", None)
    _state_path().write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _download_to_path(url: str, destination: Path) -> None:
    with urllib.request.urlopen(url, timeout=30) as response:  # noqa: S310
        destination.write_bytes(response.read())


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def _read_manifest(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=15) as response:  # noqa: S310
        return json.loads(response.read().decode("utf-8"))


def _is_blender_compatible(minimum_version: str, blender_version: tuple[int, int, int]) -> bool:
    if not minimum_version:
        return True
    return _version_key(".".join(str(part) for part in blender_version)) >= _version_key(minimum_version)


def _apply_manifest_result(manifest: dict, blender_version: tuple[int, int, int]) -> None:
    latest_version = manifest.get("latestVersion") or manifest.get("version") or ""
    channel = manifest.get("channel", "stable")
    download_url = manifest.get("downloadUrl") or manifest.get("url") or ""
    sha256 = manifest.get("sha256", "")
    minimum_blender_version = manifest.get("minimumBlenderVersion") or manifest.get("minBlenderVersion") or ""
    release_notes = manifest.get("releaseNotes") or manifest.get("releaseNotesUrl") or ""

    with _LOCK:
        UPDATE_STATE.last_checked = _timestamp()
        UPDATE_STATE.latest_version = latest_version
        UPDATE_STATE.release_notes = release_notes
        UPDATE_STATE.error = ""

    if channel != "stable":
        with _LOCK:
            UPDATE_STATE.status_message = f"Ignored {channel} release channel"
            UPDATE_STATE.update_available = False
        save_state()
        return

    if not latest_version or not download_url or not sha256:
        with _LOCK:
            UPDATE_STATE.status_message = "Update feed is missing required fields"
            UPDATE_STATE.update_available = False
        save_state()
        return

    if not _is_blender_compatible(minimum_blender_version, blender_version):
        with _LOCK:
            UPDATE_STATE.status_message = f"Latest version {latest_version} requires Blender {minimum_blender_version}+"
            UPDATE_STATE.update_available = False
        save_state()
        return

    if not is_newer_version(latest_version):
        with _LOCK:
            UPDATE_STATE.status_message = f"Up to date ({APP_VERSION})"
            UPDATE_STATE.update_available = bool(UPDATE_STATE.pending_version)
        save_state()
        return

    zip_path = _appdata_root() / f"r3f_live_preview_blender_v{latest_version}.zip"
    if zip_path.exists():
        actual_hash = _sha256(zip_path)
        if actual_hash.lower() != sha256.lower():
            zip_path.unlink(missing_ok=True)
    if not zip_path.exists():
        _download_to_path(download_url, zip_path)
        actual_hash = _sha256(zip_path)
        if actual_hash.lower() != sha256.lower():
            zip_path.unlink(missing_ok=True)
            raise RuntimeError("Downloaded update checksum mismatch")

    with _LOCK:
        UPDATE_STATE.update_available = True
        UPDATE_STATE.pending_version = latest_version
        UPDATE_STATE.downloaded_zip_path = str(zip_path)
        UPDATE_STATE.status_message = f"Update {latest_version} downloaded. Reinstall the staged zip on next restart."
    save_state()


def check_for_updates(feed_url: str, blender_version: tuple[int, int, int]) -> None:
    manifest = _read_manifest(feed_url)
    _apply_manifest_result(manifest, blender_version)


def start_background_update_check(feed_url: str, blender_version: tuple[int, int, int]) -> None:
    global _CHECK_THREAD
    if not feed_url:
        return

    with _LOCK:
        if UPDATE_STATE.checking:
            return
        UPDATE_STATE.checking = True
        UPDATE_STATE.status_message = "Checking for updates..."
        UPDATE_STATE.error = ""

    def runner() -> None:
        global _CHECK_THREAD
        try:
            check_for_updates(feed_url, blender_version)
        except Exception as error:  # noqa: BLE001
            with _LOCK:
                UPDATE_STATE.error = str(error)
                UPDATE_STATE.status_message = f"Update check failed: {error}"
        finally:
            with _LOCK:
                UPDATE_STATE.checking = False
            save_state()
            _CHECK_THREAD = None

    _CHECK_THREAD = threading.Thread(target=runner, name="r3f_live_preview_updater", daemon=True)
    _CHECK_THREAD.start()


def clear_pending_update() -> None:
    with _LOCK:
        UPDATE_STATE.update_available = False
        UPDATE_STATE.pending_version = ""
        UPDATE_STATE.downloaded_zip_path = ""
        UPDATE_STATE.status_message = f"Up to date ({APP_VERSION})"
    save_state()
