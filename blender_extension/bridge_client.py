from __future__ import annotations

import json
import urllib.error
import urllib.request


def _post_json(url: str, payload: dict) -> dict:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))


def start_session(base_url: str, payload: dict) -> dict:
    return _post_json(f"{base_url}/api/session/start", payload)


def notify_model_updated(base_url: str, payload: dict) -> dict:
    return _post_json(f"{base_url}/api/model-updated", payload)


def send_material_patch(base_url: str, payload: dict) -> dict:
    return _post_json(f"{base_url}/api/material-patch", payload)


def send_camera_update(base_url: str, payload: dict) -> dict:
    return _post_json(f"{base_url}/api/camera-updated", payload)


def health_check(base_url: str) -> dict:
    with urllib.request.urlopen(f"{base_url}/health", timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))
