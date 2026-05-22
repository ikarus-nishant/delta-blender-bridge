from __future__ import annotations

import os
import shutil
import subprocess
import time
from pathlib import Path


BRIDGE_PROCESS: subprocess.Popen[str] | None = None


def has_node_runtime(override_path: str = "") -> bool:
    if override_path:
        return Path(override_path).exists()
    return shutil.which("node") is not None


def node_runtime_error_message() -> str:
    return "Node.js was not found. Install Node.js and restart Blender, or set Bridge executable path in the add-on preferences."


def resolve_bridge_command(command: list[str]) -> list[str]:
    if not command:
        raise RuntimeError("Bridge command is empty")

    executable = command[0]
    if executable.lower() in {"node", "node.exe"}:
        resolved = shutil.which(executable)
        if not resolved:
            raise RuntimeError(node_runtime_error_message())
        return [resolved, *command[1:]]

    return command


def start_bridge(command: list[str], viewer_dist: str, port: int, log_path: Path) -> subprocess.Popen[str]:
    global BRIDGE_PROCESS
    if BRIDGE_PROCESS and BRIDGE_PROCESS.poll() is None:
        return BRIDGE_PROCESS

    command = resolve_bridge_command(command)
    env = os.environ.copy()
    env["R3F_LIVE_PREVIEW_HTTP_PORT"] = str(port)
    env["R3F_LIVE_PREVIEW_VIEWER_DIST"] = viewer_dist
    env["R3F_LIVE_PREVIEW_BRIDGE_LOG"] = str(log_path)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    stderr_path = log_path.with_name("bridge.stderr.log")
    stdout_handle = open(log_path, "a", encoding="utf-8")
    stderr_handle = open(stderr_path, "a", encoding="utf-8")

    BRIDGE_PROCESS = subprocess.Popen(
        command,
        env=env,
        stdout=stdout_handle,
        stderr=stderr_handle,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    return BRIDGE_PROCESS


def wait_for_bridge_ready(port: int, timeout_seconds: float = 8.0) -> None:
    from .bridge_client import health_check

    deadline = time.time() + timeout_seconds
    last_error: Exception | None = None
    base_url = f"http://127.0.0.1:{port}"

    while time.time() < deadline:
        if BRIDGE_PROCESS and BRIDGE_PROCESS.poll() is not None:
            raise RuntimeError(f"Bridge exited early with code {BRIDGE_PROCESS.returncode}")
        try:
            health_check(base_url)
            return
        except Exception as error:  # noqa: BLE001
            last_error = error
            time.sleep(0.2)

    if last_error:
        raise RuntimeError(f"Bridge did not become ready: {last_error}") from last_error
    raise RuntimeError("Bridge did not become ready before timeout")


def stop_bridge() -> None:
    global BRIDGE_PROCESS
    if BRIDGE_PROCESS and BRIDGE_PROCESS.poll() is None:
        BRIDGE_PROCESS.terminate()
        BRIDGE_PROCESS.wait(timeout=5)
    BRIDGE_PROCESS = None
