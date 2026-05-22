from __future__ import annotations

import json
import logging
from logging import Logger
from pathlib import Path


def create_logger(log_file: Path | None = None) -> Logger:
    logger = logging.getLogger("r3f_live_preview")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)

    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger


def log_json(logger: Logger, message: str, payload: dict) -> None:
    logger.info("%s %s", message, json.dumps(payload, sort_keys=True))
