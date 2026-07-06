#!/usr/bin/env python
"""Validate published game data files and the JavaScript data bundle."""

from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path
from typing import Any, NoReturn

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
DATA_BUNDLE_RE = re.compile(r"^\s*window\.REBIRTH_GAME_DATA\s*=\s*(?P<data>.*);\s*$", re.S)


def fail(message: str) -> NoReturn:
    raise ValueError(message)


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def assert_no_local_paths(value: Any, context: str) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            assert_no_local_paths(child, f"{context}.{key}")
        return
    if isinstance(value, list):
        for index, child in enumerate(value):
            assert_no_local_paths(child, f"{context}[{index}]")
        return
    if isinstance(value, str) and (":\\" in value or "/home/" in value):
        fail(f"{context} contains a local filesystem path: {value}")


def validate_year_file(path: Path) -> tuple[int, dict[str, Any]]:
    data = load_json(path)
    year = data.get("year")
    if not isinstance(year, int):
        fail(f"{path}: year must be an integer")
    if path.name != f"{year}.json":
        fail(f"{path}: file name does not match year {year}")

    months = data.get("months")
    if not isinstance(months, list) or len(months) != 12:
        fail(f"{path}: expected 12 monthly rounds")

    assert_no_local_paths(data.get("source", {}), f"{path.name}.source")

    expected_months = [f"{year}-{month:02d}" for month in range(1, 13)]
    actual_months = [month.get("month") for month in months]
    if actual_months != expected_months:
        fail(f"{path}: months are not a complete sorted calendar year")

    perfect_capital = float(data["initialCapital"])
    for month in months:
        options = month.get("options")
        best = month.get("best")
        if not isinstance(options, list) or len(options) != 4:
            fail(f"{path}:{month.get('month')}: expected 4 options")
        if not isinstance(best, dict):
            fail(f"{path}:{month.get('month')}: missing best stock")
        best_flags = [option for option in options if option.get("isBest")]
        if len(best_flags) != 1:
            fail(f"{path}:{month.get('month')}: expected exactly one isBest option")
        if best_flags[0].get("tsCode") != best.get("tsCode"):
            fail(f"{path}:{month.get('month')}: isBest option does not match best")
        option_ids = [option.get("tsCode") for option in options]
        if len(option_ids) != len(set(option_ids)):
            fail(f"{path}:{month.get('month')}: duplicate option")
        for option in options:
            return_rate = option.get("returnRate")
            if not isinstance(return_rate, int | float) or not math.isfinite(return_rate):
                fail(f"{path}:{month.get('month')}: invalid returnRate")
        perfect_capital *= 1 + float(best["returnRate"])

    expected = round(perfect_capital, 2)
    actual = round(float(data["perfectCapital"]), 2)
    if expected != actual:
        fail(f"{path}: perfectCapital mismatch, expected {expected}, got {actual}")

    return year, data


def load_js_bundle(path: Path) -> dict[str, Any]:
    match = DATA_BUNDLE_RE.match(path.read_text(encoding="utf-8"))
    if not match:
        fail(f"{path}: expected `window.REBIRTH_GAME_DATA = ...;`")
    return json.loads(match.group("data"))


def main() -> int:
    manifest = load_json(DATA_DIR / "manifest.json")
    manifest_years = manifest.get("years")
    manifest_files = manifest.get("files")
    if not isinstance(manifest_years, list) or not isinstance(manifest_files, list):
        fail("manifest.json must contain years and files arrays")

    year_payloads: dict[str, dict[str, Any]] = {}
    for file_name in manifest_files:
        if not isinstance(file_name, str) or not re.fullmatch(r"20\d{2}\.json", file_name):
            fail(f"manifest has invalid data file: {file_name}")
        year, payload = validate_year_file(DATA_DIR / file_name)
        year_payloads[str(year)] = payload

    if sorted(int(year) for year in year_payloads) != manifest_years:
        fail("manifest years do not match year files")

    bundle = load_js_bundle(DATA_DIR / "game-data.js")
    if bundle != year_payloads:
        fail("game-data.js does not match JSON year files")

    print(f"Validated years: {', '.join(sorted(year_payloads))}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"validate_data.py: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
