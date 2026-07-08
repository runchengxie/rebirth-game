"""Unit tests for build_data.py pure functions.

Does not require DuckDB or real market data — tests the data-processing
helpers and CLI argument parsing.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

# Import the module under test — build_data.py is a script, not a package,
# so we reach in from the scripts directory.
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_data  # noqa: E402

# ── duckdb_path ──────────────────────────────────────────────


class TestDuckDBPath:
    def test_converts_backslashes_to_forward(self) -> None:
        result = build_data.duckdb_path(r"C:\data\a_share\daily")
        assert result == "C:/data/a_share/daily"

    def test_posix_path_is_unchanged(self) -> None:
        result = build_data.duckdb_path("/home/user/data/daily")
        assert result == "/home/user/data/daily"

    def test_path_object(self) -> None:
        result = build_data.duckdb_path(Path("/data") / "daily")
        assert result == "/data/daily"


# ── as_float ─────────────────────────────────────────────────


class TestAsFloat:
    def test_positive_float(self) -> None:
        assert build_data.as_float(3.14) == 3.14

    def test_negative_float(self) -> None:
        assert build_data.as_float(-0.05) == -0.05

    def test_zero(self) -> None:
        assert build_data.as_float(0) == 0.0
        assert build_data.as_float(0.0) == 0.0

    def test_none_returns_none(self) -> None:
        assert build_data.as_float(None) is None

    def test_nan_returns_none(self) -> None:
        assert build_data.as_float(float("nan")) is None

    def test_inf_returns_none(self) -> None:
        assert build_data.as_float(float("inf")) is None

    def test_neg_inf_returns_none(self) -> None:
        assert build_data.as_float(float("-inf")) is None

    def test_rounding_with_digits(self) -> None:
        assert build_data.as_float(3.14159, 2) == 3.14
        assert build_data.as_float(3.14159, 0) == 3.0
        assert build_data.as_float(3.14159, 4) == 3.1416

    def test_string_input(self) -> None:
        assert build_data.as_float("1.5") == 1.5
        assert build_data.as_float("-2") == -2.0

    def test_rounding_none_skipped(self) -> None:
        assert build_data.as_float(None, 4) is None


# ── parse_args ───────────────────────────────────────────────


class TestParseArgs:
    def test_defaults(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(sys, "argv", ["build_data.py"])
        config = build_data.parse_args()
        assert config.years == [2023, 2024, 2025]
        assert config.price_column == "adj_close"
        assert config.seed == 20240706
        assert config.out_dir == "data"

    def test_custom_years(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(sys, "argv", ["build_data.py", "--years", "2023", "2024"])
        config = build_data.parse_args()
        assert config.years == [2023, 2024]

    def test_price_column_close(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(sys, "argv", ["build_data.py", "--price-column", "close"])
        config = build_data.parse_args()
        assert config.price_column == "close"

    def test_custom_out_dir(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(sys, "argv", ["build_data.py", "--out-dir", "/tmp/out"])
        config = build_data.parse_args()
        assert config.out_dir == "/tmp/out"

    def test_custom_seed(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(sys, "argv", ["build_data.py", "--seed", "42"])
        config = build_data.parse_args()
        assert config.seed == 42
