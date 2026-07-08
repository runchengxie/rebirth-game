#!/usr/bin/env python
"""Build monthly market-review data for the rebirth research game.

Generates JSON with monthly index returns, sector rotation, and style factor
approximations — used for post-mortem recaps, not stock-picking gameplay.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal, TypedDict, cast

DEFAULT_DAILY_CLEAN_DIR = (
    r"Z:\market-data-platform\assets\tushare\a_share\daily"
    r"\a_share_all_20150101_20260703_daily_clean"
)
DEFAULT_INSTRUMENTS_FILE = (
    r"Z:\market-data-platform\assets\tushare\a_share\instruments"
    r"\a_share_all_instruments_latest.parquet"
)
DEFAULT_YEARS = (2023, 2024, 2025)
PriceColumn = Literal["adj_close", "close"]


@dataclass(frozen=True)
class Config:
    years: list[int]
    daily_clean_dir: str
    instruments: str
    out_dir: str
    price_column: PriceColumn
    seed: int


class Manifest(TypedDict):
    generatedAt: str
    years: list[int]
    files: list[str]


def parse_args() -> Config:
    parser = argparse.ArgumentParser(
        description="Generate monthly market-review JSON for the rebirth research game."
    )
    parser.add_argument("--years", nargs="+", type=int, default=list(DEFAULT_YEARS))
    parser.add_argument("--daily-clean-dir", default=DEFAULT_DAILY_CLEAN_DIR)
    parser.add_argument("--instruments", default=DEFAULT_INSTRUMENTS_FILE)
    parser.add_argument("--out-dir", default="data")
    parser.add_argument("--price-column", choices=["adj_close", "close"], default="adj_close")
    parser.add_argument("--seed", type=int, default=20240706)
    namespace = parser.parse_args()
    values = vars(namespace)
    return Config(
        years=values["years"],
        daily_clean_dir=values["daily_clean_dir"],
        instruments=values["instruments"],
        out_dir=values["out_dir"],
        price_column=cast(PriceColumn, values["price_column"]),
        seed=values["seed"],
    )


def require_duckdb():
    try:
        import duckdb
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "Missing dependency: duckdb. Install it with `uv pip install -r requirements.txt` "
            "or run via `uv run --with duckdb python scripts/build_data.py`."
        ) from exc
    return duckdb


def duckdb_path(path: str | Path) -> str:
    return str(Path(path)).replace("\\", "/")


def as_float(value: Any, digits: int | None = None) -> float | None:
    if value is None:
        return None
    result = float(value)
    if math.isnan(result) or math.isinf(result):
        return None
    if digits is not None:
        return round(result, digits)
    return result


# ═══════════════════════════════════════════════════════════
# Query: monthly index returns (market-cap weighted)
# ═══════════════════════════════════════════════════════════


def query_index_returns(
    con: Any,
    year: int,
    daily_clean_dir: str,
    instruments: str,
    price_column: str,
) -> list[dict[str, Any]]:
    """Compute market-cap-weighted index returns for top-N stocks per month."""
    daily_glob = duckdb_path(Path(daily_clean_dir) / "data" / "*.parquet")
    instruments_path = duckdb_path(instruments)
    start_date = f"{year}0101"
    end_date = f"{year}1231"

    sql = f"""
        WITH raw AS (
            SELECT
                d.ts_code,
                d.trade_date,
                d.{price_column} AS px,
                d.amount,
                COALESCE(d.is_st, false) AS is_st,
                COALESCE(d.is_suspended, false) AS is_suspended,
                i.industry,
                i.name
            FROM read_parquet(?) AS d
            LEFT JOIN read_parquet(?) AS i ON d.ts_code = i.ts_code
            WHERE d.trade_date BETWEEN ? AND ?
              AND d.{price_column} IS NOT NULL
              AND d.{price_column} > 0
              AND d.amount IS NOT NULL
              AND d.amount > 0
        ),
        month_days AS (
            SELECT
                substr(trade_date, 1, 6) AS month_key,
                min(trade_date) AS market_start,
                max(trade_date) AS market_end,
                count(DISTINCT trade_date) AS market_days
            FROM raw
            GROUP BY 1
        ),
        monthly AS (
            SELECT
                substr(r.trade_date, 1, 6) AS month_key,
                r.ts_code,
                r.name,
                r.industry,
                arg_min(r.px, r.trade_date) AS start_price,
                arg_max(r.px, r.trade_date) AS end_price,
                sum(r.amount) AS total_amount,
                (arg_max(r.px, r.trade_date) / arg_min(r.px, r.trade_date) - 1.0) AS return_rate
            FROM raw r
            WHERE NOT r.is_st
              AND NOT r.is_suspended
            GROUP BY 1, 2, 3, 4
            HAVING start_price > 0 AND end_price > 0
        ),
        ranked AS (
            SELECT
                *,
                row_number() OVER (
                    PARTITION BY month_key
                    ORDER BY total_amount DESC
                ) AS amount_rank
            FROM monthly
        ),
        -- Top 300 by volume as proxy for 沪深300
        hs300 AS (
            SELECT
                month_key,
                avg(return_rate) AS index_return,
                count(*) AS stock_count
            FROM ranked
            WHERE amount_rank <= 300
            GROUP BY month_key
        ),
        -- Stocks 301-800 as proxy for 中证500
        zz500 AS (
            SELECT
                month_key,
                avg(return_rate) AS index_return
            FROM ranked
            WHERE amount_rank > 300 AND amount_rank <= 800
            GROUP BY month_key
        )
        SELECT
            m.month_key,
            m.market_start,
            m.market_end,
            m.market_days,
            COALESCE(h.index_return, 0) AS hs300_return,
            COALESCE(z.index_return, 0) AS zz500_return
        FROM month_days m
        LEFT JOIN hs300 h USING (month_key)
        LEFT JOIN zz500 z USING (month_key)
        ORDER BY m.month_key
    """
    rows = con.execute(
        sql,
        [daily_glob, instruments_path, start_date, end_date],
    ).fetchall()
    columns = [item[0] for item in con.description]
    return [dict(zip(columns, row, strict=True)) for row in rows]


# ═══════════════════════════════════════════════════════════
# Query: sector rotation (top/bottom industries per month)
# ═══════════════════════════════════════════════════════════


def query_sector_rotation(
    con: Any,
    year: int,
    daily_clean_dir: str,
    instruments: str,
    price_column: str,
) -> dict[str, list[dict[str, Any]]]:
    """Compute industry-level monthly returns, return top/bottom 5 per month."""
    daily_glob = duckdb_path(Path(daily_clean_dir) / "data" / "*.parquet")
    instruments_path = duckdb_path(instruments)
    start_date = f"{year}0101"
    end_date = f"{year}1231"

    sql = f"""
        WITH raw AS (
            SELECT
                d.ts_code,
                d.trade_date,
                d.{price_column} AS px,
                d.amount,
                COALESCE(d.is_st, false) AS is_st,
                COALESCE(d.is_suspended, false) AS is_suspended,
                COALESCE(i.industry, '未分类') AS industry
            FROM read_parquet(?) AS d
            LEFT JOIN read_parquet(?) AS i ON d.ts_code = i.ts_code
            WHERE d.trade_date BETWEEN ? AND ?
              AND d.{price_column} IS NOT NULL
              AND d.{price_column} > 0
              AND d.amount IS NOT NULL
              AND d.amount > 0
        ),
        monthly AS (
            SELECT
                substr(r.trade_date, 1, 6) AS month_key,
                r.ts_code,
                r.industry,
                arg_min(r.px, r.trade_date) AS start_price,
                arg_max(r.px, r.trade_date) AS end_price,
                avg(r.amount) AS avg_amount
            FROM raw r
            WHERE NOT r.is_st AND NOT r.is_suspended
            GROUP BY 1, 2, 3
            HAVING start_price > 0 AND end_price > 0
        ),
        industry_monthly AS (
            SELECT
                month_key,
                industry,
                -- Amount-weighted average return per industry
                sum(avg_amount * (end_price / start_price - 1.0)) /
                  nullif(sum(avg_amount), 0) AS weighted_return,
                count(*) AS stock_count
            FROM monthly
            WHERE avg_amount > 0
            GROUP BY 1, 2
            HAVING stock_count >= 3
        ),
        ranked AS (
            SELECT
                *,
                row_number() OVER (
                    PARTITION BY month_key
                    ORDER BY weighted_return DESC
                ) AS rank_desc,
                row_number() OVER (
                    PARTITION BY month_key
                    ORDER BY weighted_return ASC
                ) AS rank_asc
            FROM industry_monthly
        )
        SELECT
            month_key,
            industry,
            ROUND(weighted_return, 6) AS return_rate,
            rank_desc,
            rank_asc
        FROM ranked
        WHERE rank_desc <= 5 OR rank_asc <= 5
        ORDER BY month_key, rank_desc
    """
    rows = con.execute(
        sql,
        [daily_glob, instruments_path, start_date, end_date],
    ).fetchall()
    columns = [item[0] for item in con.description]

    by_month: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        item = dict(zip(columns, row, strict=True))
        by_month[item["month_key"]].append(item)
    return dict(by_month)


# ═══════════════════════════════════════════════════════════
# Query: style factor approximations
# ═══════════════════════════════════════════════════════════


def query_style_factors(
    con: Any,
    year: int,
    daily_clean_dir: str,
    instruments: str,
    price_column: str,
) -> list[dict[str, Any]]:
    """Compute approximate style factor returns per month.

    Size factor: small-cap return (bottom 30% by volume) minus large-cap (top 30%).
    Momentum factor: top 20% past-1-month winners minus bottom 20% (crude approximation).
    """
    daily_glob = duckdb_path(Path(daily_clean_dir) / "data" / "*.parquet")
    instruments_path = duckdb_path(instruments)
    start_date = f"{year}0101"
    end_date = f"{year}1231"

    sql = f"""
        WITH raw AS (
            SELECT
                d.ts_code,
                d.trade_date,
                d.{price_column} AS px,
                d.amount,
                COALESCE(d.is_st, false) AS is_st,
                COALESCE(d.is_suspended, false) AS is_suspended
            FROM read_parquet(?) AS d
            LEFT JOIN read_parquet(?) AS i ON d.ts_code = i.ts_code
            WHERE d.trade_date BETWEEN ? AND ?
              AND d.{price_column} IS NOT NULL
              AND d.{price_column} > 0
              AND d.amount IS NOT NULL
              AND d.amount > 0
        ),
        monthly AS (
            SELECT
                substr(r.trade_date, 1, 6) AS month_key,
                r.ts_code,
                arg_min(r.px, r.trade_date) AS start_price,
                arg_max(r.px, r.trade_date) AS end_price,
                sum(r.amount) AS total_amount
            FROM raw r
            WHERE NOT r.is_st AND NOT r.is_suspended
            GROUP BY 1, 2
            HAVING start_price > 0 AND end_price > 0
        ),
        with_return AS (
            SELECT
                *,
                (end_price / start_price - 1.0) AS return_rate,
                ntile(3) OVER (PARTITION BY month_key ORDER BY total_amount) AS size_tercile
            FROM monthly
        ),
        -- Size factor: small minus large
        size_factor AS (
            SELECT
                month_key,
                avg(CASE WHEN size_tercile = 3 THEN return_rate END) -
                  avg(CASE WHEN size_tercile = 1 THEN return_rate END) AS size_premium
            FROM with_return
            GROUP BY month_key
        ),
        -- Momentum factor: use equal-weight top/bottom quartile (simplified)
        momentum AS (
            SELECT
                month_key,
                return_rate,
                ntile(4) OVER (PARTITION BY month_key ORDER BY return_rate) AS mom_quartile
            FROM with_return
        ),
        mom_factor AS (
            SELECT
                month_key,
                avg(CASE WHEN mom_quartile = 4 THEN return_rate END) -
                  avg(CASE WHEN mom_quartile = 1 THEN return_rate END) AS momentum_premium
            FROM momentum
            GROUP BY month_key
        )
        SELECT
            s.month_key,
            ROUND(COALESCE(s.size_premium, 0), 6) AS size_premium,
            ROUND(COALESCE(m.momentum_premium, 0), 6) AS momentum_premium
        FROM size_factor s
        LEFT JOIN mom_factor m USING (month_key)
        ORDER BY s.month_key
    """
    rows = con.execute(
        sql,
        [daily_glob, instruments_path, start_date, end_date],
    ).fetchall()
    columns = [item[0] for item in con.description]
    return [dict(zip(columns, row, strict=True)) for row in rows]


# ═══════════════════════════════════════════════════════════
# Build year payload
# ═══════════════════════════════════════════════════════════


def build_year_payload(
    args: Config,
    con: Any,
    year: int,
) -> dict[str, Any]:
    index_data = query_index_returns(
        con, year, args.daily_clean_dir, args.instruments, args.price_column
    )
    sector_data = query_sector_rotation(
        con, year, args.daily_clean_dir, args.instruments, args.price_column
    )
    factor_data = query_style_factors(
        con, year, args.daily_clean_dir, args.instruments, args.price_column
    )

    # Build factor lookup by month
    factor_by_month: dict[str, dict[str, Any]] = {}
    for f in factor_data:
        mk: str = str(f["month_key"])
        factor_by_month[mk] = dict(f)

    months = []
    for idx in index_data:
        month_key = idx["month_key"]
        month_number = int(month_key[4:6])
        sectors = sector_data.get(month_key, [])

        # Top performers (rank_desc 1-5)
        top_sectors = sorted(
            [s for s in sectors if s.get("rank_desc", 99) <= 5],
            key=lambda x: x.get("rank_desc", 99),
        )
        # Bottom performers (rank_asc 1-5)
        bottom_sectors = sorted(
            [s for s in sectors if s.get("rank_asc", 99) <= 5],
            key=lambda x: x.get("rank_asc", 99),
        )

        sector_rotation = []
        for i, s in enumerate(top_sectors):
            sector_rotation.append(
                {
                    "sector": s["industry"],
                    "returnRate": as_float(s["return_rate"], 4) or 0,
                    "rank": i + 1,
                }
            )
        for i, s in enumerate(bottom_sectors):
            sector_rotation.append(
                {
                    "sector": s["industry"],
                    "returnRate": as_float(s["return_rate"], 4) or 0,
                    "rank": -(i + 1),  # negative rank = bottom
                }
            )

        factors = factor_by_month.get(month_key, {})
        size_premium = as_float(factors.get("size_premium", 0), 4) or 0
        mom_premium = as_float(factors.get("momentum_premium", 0), 4) or 0

        style_factor_returns = [
            {
                "factor": "size",
                "returnRate": size_premium,
                "direction": "小盘溢价" if size_premium > 0 else "大盘溢价",
            },
            {
                "factor": "momentum",
                "returnRate": mom_premium,
                "direction": "动量强势" if mom_premium > 0 else "反转占优",
            },
        ]

        months.append(
            {
                "month": f"{year}-{month_number:02d}",
                "label": f"{year}年{month_number}月",
                "marketStart": idx.get("market_start", f"{year}{month_number:02d}01"),
                "marketEnd": idx.get("market_end", f"{year}{month_number:02d}28"),
                "themeIndex": "000300.SH",
                "themeReturn": as_float(idx.get("hs300_return", 0), 4) or 0,
                "sectorRotation": sector_rotation,
                "styleFactorReturns": style_factor_returns,
                "eventSummary": "",  # filled by frontend from MARKET_THEMES
            }
        )

    return {
        "year": year,
        "currency": "CNY",
        "generatedAt": dt.datetime.now(dt.UTC).isoformat(),
        "source": {
            "dailyDataset": "a_share_daily_clean",
            "priceColumn": args.price_column,
        },
        "rules": {
            "indexProxy": "top-300-by-volume for HS300, 301-800 for ZZ500",
            "sectorMethod": "amount-weighted industry average",
            "factorMethod": "tercile/quartile spread (crude approximation)",
        },
        "benchmarks": months,
    }


# ═══════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════


def main() -> None:
    args = parse_args()
    duckdb = require_duckdb()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    con = duckdb.connect(":memory:")

    files_written = []
    for year in args.years:
        payload = build_year_payload(args, con, year)
        out_path = out_dir / f"market-review-{year}.json"
        out_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        files_written.append(out_path.name)
        print(f"  [OK] {out_path} — {len(payload['benchmarks'])} months")

    # Write manifest
    manifest: Manifest = {
        "generatedAt": dt.datetime.now(dt.UTC).isoformat(),
        "years": list(args.years),
        "files": files_written,
    }
    manifest_path = out_dir / "market-review-manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"  [OK] {manifest_path}")

    con.close()


if __name__ == "__main__":
    main()
