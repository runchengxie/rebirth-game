#!/usr/bin/env python
"""Unified check runner — Python + frontend.

All Python tools run via `uv run` which picks up the project's locked
dependencies automatically. No virtualenv activation needed.

Usage:
    uv run python scripts/check.py              # Full check (blocking only)
    uv run python scripts/check.py --all         # Include non-blocking type checks
    uv run python scripts/check.py --python      # Python checks only
    uv run python scripts/check.py --frontend    # Frontend checks only
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _uv_run(*args: str) -> list[str]:
    """Build a uv-run command for a tool installed in the project venv."""
    return ["uv", "run", *args]


def run(cmd: list[str], *, label: str, allow_failure: bool = False) -> bool:
    header = f"[{label}]"
    try:
        result = subprocess.run(
            cmd,
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=300,
        )
        if result.returncode == 0:
            print(f"  \033[32mPASS\033[0m {header}")
            return True
        else:
            marker = "\033[33mWARN\033[0m" if allow_failure else "\033[31mFAIL\033[0m"
            print(f"  {marker} {header}")
            if result.stdout.strip():
                for line in result.stdout.strip().split("\n")[:20]:
                    print(f"    {line}")
            if result.stderr.strip():
                for line in result.stderr.strip().split("\n")[:10]:
                    print(f"    {line}")
            return allow_failure  # non-blocking = always "pass" for overall result
    except FileNotFoundError:
        print(f"  \033[33mSKIP\033[0m {header} (tool not found)")
        return allow_failure


def check_python(*, all_checks: bool = False) -> bool:
    print("── Python ──")
    ok = True

    ok &= run(_uv_run("ruff", "check", "."), label="ruff check")
    ok &= run(_uv_run("ruff", "format", "--check", "."), label="ruff format")
    ok &= run(
        _uv_run("python", "-m", "compileall", "scripts"),
        label="compileall",
    )
    ok &= run(
        _uv_run("pytest", "scripts/", "-v"),
        label="pytest",
    )
    ok &= run(
        _uv_run("python", "scripts/validate_data.py"),
        label="validate_data",
    )

    if all_checks:
        ok &= run(
            _uv_run("basedpyright", "scripts"),
            label="basedpyright",
            allow_failure=True,
        )
        ok &= run(
            _uv_run("ty", "check", "scripts"),
            label="ty",
            allow_failure=True,
        )

    return ok


def check_frontend() -> bool:
    print("── Frontend ──")
    ok = True

    ok &= run(["node", "scripts/validate_frontend.js"], label="validate_frontend")
    ok &= run(["npm", "run", "lint"], label="ESLint")
    ok &= run(["npm", "run", "typecheck"], label="tsc")
    ok &= run(["npm", "run", "test:run"], label="Vitest")
    ok &= run(["npm", "run", "build"], label="build")

    return ok


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Unified check runner")
    parser.add_argument("--all", action="store_true", help="Include non-blocking type checks")
    parser.add_argument("--python", action="store_true", help="Python checks only")
    parser.add_argument("--frontend", action="store_true", help="Frontend checks only")
    args = parser.parse_args()

    python_only = args.python
    frontend_only = args.frontend
    if not python_only and not frontend_only:
        python_only = frontend_only = True

    ok = True
    if python_only:
        ok &= check_python(all_checks=args.all)
    if frontend_only:
        ok &= check_frontend()

    if ok:
        print("\n\033[32mAll checks passed.\033[0m")
        sys.exit(0)
    else:
        print("\n\033[31mSome checks failed.\033[0m")
        sys.exit(1)


if __name__ == "__main__":
    main()
