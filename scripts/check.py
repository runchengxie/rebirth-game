#!/usr/bin/env python
"""统一运行 Python 和前端检查。"""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _uv_run(*args: str) -> list[str]:
    return ["uv", "run", *args]


def run(cmd: list[str], *, label: str, allow_failure: bool = False) -> bool:
    """运行一条检查命令并打印精简结果。

    allow_failure=True 时即使失败也返回 True（非阻塞检查）。
    """
    header = f"[{label}]"
    try:
        result = subprocess.run(
            cmd,
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=300,
            check=False,
        )
    except FileNotFoundError:
        print(f"  失败 {header}，未找到命令")
        return False
    except subprocess.TimeoutExpired:
        print(f"  失败 {header}，运行超过 300 秒")
        return False

    if result.returncode == 0:
        print(f"  通过 {header}")
        return True

    if allow_failure:
        print(f"  警告 {header}（非阻塞）")
        if result.stdout.strip():
            for line in result.stdout.strip().splitlines()[:20]:
                print(f"    {line}")
        if result.stderr.strip():
            for line in result.stderr.strip().splitlines()[:10]:
                print(f"    {line}")
        return True

    print(f"  失败 {header}")
    if result.stdout.strip():
        for line in result.stdout.strip().splitlines()[:20]:
            print(f"    {line}")
    if result.stderr.strip():
        for line in result.stderr.strip().splitlines()[:10]:
            print(f"    {line}")
    return False


def check_python() -> bool:
    print("── Python ──")
    ok = True
    ok &= run(_uv_run("ruff", "check", "."), label="ruff check")
    ok &= run(_uv_run("ruff", "format", "--check", "."), label="ruff format")
    ok &= run(
        _uv_run("python", "-m", "compileall", "scripts"),
        label="compileall",
    )
    ok &= run(
        _uv_run("ty", "check", "scripts"),
        label="ty",
    )
    ok &= run(
        _uv_run("pytest", "scripts/", "-v"),
        label="pytest",
    )
    ok &= run(
        _uv_run("python", "scripts/validate_data.py"),
        label="validate_data",
    )

    return ok


def check_frontend() -> bool:
    print("── 前端 ──")
    ok = True
    ok &= run(["node", "scripts/validate_frontend.js"], label="validate_frontend")
    ok &= run(["npm", "run", "lint:ci"], label="ESLint")
    ok &= run(["npm", "run", "typecheck"], label="TypeScript")
    ok &= run(["npm", "run", "test:run"], label="Vitest")
    ok &= run(["npm", "run", "build"], label="build")
    return ok


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="运行项目检查")
    parser.add_argument("--all", action="store_true", help="兼容参数，完整检查现已默认执行")
    parser.add_argument("--python", action="store_true", help="只运行 Python 检查")
    parser.add_argument("--frontend", action="store_true", help="只运行前端检查")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    run_python = args.python
    run_frontend = args.frontend
    if not run_python and not run_frontend:
        run_python = True
        run_frontend = True

    ok = True
    if run_python:
        ok &= check_python()
    if run_frontend:
        ok &= check_frontend()

    if ok:
        print("\n全部阻塞检查通过。")
        raise SystemExit(0)

    print("\n存在未通过的阻塞检查。")
    raise SystemExit(1)


if __name__ == "__main__":
    main()
