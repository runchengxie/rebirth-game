#!/usr/bin/env python
"""Build monthly stock-picking game data from the local A-share clean layer."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import random
from collections import defaultdict
from pathlib import Path
from typing import Any


DEFAULT_DAILY_CLEAN_DIR = (
    r"Z:\market-data-platform\assets\tushare\a_share\daily"
    r"\a_share_all_20150101_20260703_daily_clean"
)
DEFAULT_INSTRUMENTS_FILE = (
    r"Z:\market-data-platform\assets\tushare\a_share\instruments"
    r"\a_share_all_instruments_latest.parquet"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate compact yearly JSON for the rebirth stock game."
    )
    parser.add_argument("--years", nargs="+", type=int, default=[2023, 2024])
    parser.add_argument("--daily-clean-dir", default=DEFAULT_DAILY_CLEAN_DIR)
    parser.add_argument("--instruments", default=DEFAULT_INSTRUMENTS_FILE)
    parser.add_argument("--out-dir", default="data")
    parser.add_argument("--initial-capital", type=float, default=10_000)
    parser.add_argument("--target-capital", type=float, default=100_000_000)
    parser.add_argument("--active-pool", type=int, default=500)
    parser.add_argument("--min-listed-days", type=int, default=120)
    parser.add_argument("--min-trading-ratio", type=float, default=0.8)
    parser.add_argument("--distractor-low-pct", type=float, default=0.10)
    parser.add_argument("--distractor-high-pct", type=float, default=0.30)
    parser.add_argument("--price-column", choices=["adj_close", "close"], default="adj_close")
    parser.add_argument("--seed", type=int, default=20240706)
    return parser.parse_args()


def require_duckdb():
    try:
        import duckdb  # type: ignore
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "Missing dependency: duckdb. Install it with `uv pip install -r requirements.txt` "
            "or run via `uv run --with duckdb python scripts/build_data.py`."
        ) from exc
    return duckdb


def duckdb_path(path: str | Path) -> str:
    return str(Path(path)).replace("\\", "/")


def query_year(
    con: Any,
    year: int,
    daily_clean_dir: str,
    instruments: str,
    price_column: str,
    active_pool: int,
    min_listed_days: int,
    min_trading_ratio: float,
) -> dict[str, list[dict[str, Any]]]:
    daily_glob = duckdb_path(Path(daily_clean_dir) / "data" / "*.parquet")
    instruments_path = duckdb_path(instruments)
    start_date = f"{year}0101"
    end_date = f"{year}1231"

    sql = f"""
        WITH raw AS (
            SELECT
                ts_code,
                trade_date,
                {price_column} AS px,
                close,
                amount,
                COALESCE(is_st, false) AS is_st,
                COALESCE(is_suspended, false) AS is_suspended,
                listed_days,
                board
            FROM read_parquet(?)
            WHERE trade_date BETWEEN ? AND ?
              AND {price_column} IS NOT NULL
              AND {price_column} > 0
              AND close IS NOT NULL
              AND close > 0
              AND amount IS NOT NULL
              AND amount > 0
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
                arg_min(r.px, r.trade_date) AS start_price,
                arg_max(r.px, r.trade_date) AS end_price,
                min(r.trade_date) AS first_trade_date,
                max(r.trade_date) AS last_trade_date,
                count(*) AS trading_days,
                sum(r.amount) AS total_amount,
                avg(r.amount) AS avg_amount,
                bool_or(r.is_st) AS had_st,
                bool_or(r.is_suspended) AS had_suspend,
                min(r.listed_days) AS min_listed_days,
                max(r.board) AS board
            FROM raw r
            GROUP BY 1, 2
        ),
        instruments AS (
            SELECT
                ts_code,
                name,
                industry,
                market,
                exchange,
                list_date,
                delist_date
            FROM read_parquet(?)
        ),
        qualified AS (
            SELECT
                m.month_key,
                m.ts_code,
                COALESCE(i.name, m.ts_code) AS name,
                i.industry,
                i.market,
                i.exchange,
                m.board,
                md.market_start,
                md.market_end,
                md.market_days,
                m.first_trade_date,
                m.last_trade_date,
                m.trading_days,
                m.total_amount,
                m.avg_amount,
                m.start_price,
                m.end_price,
                (m.end_price / m.start_price - 1.0) AS return_rate
            FROM monthly m
            JOIN month_days md USING (month_key)
            LEFT JOIN instruments i USING (ts_code)
            WHERE m.start_price > 0
              AND m.end_price > 0
              AND NOT m.had_st
              AND NOT m.had_suspend
              AND m.min_listed_days >= ?
              AND m.first_trade_date = md.market_start
              AND m.last_trade_date = md.market_end
              AND m.trading_days >= ceil(md.market_days * ?)
              AND (i.list_date IS NULL OR i.list_date <= md.market_start)
              AND (i.delist_date IS NULL OR i.delist_date = '' OR i.delist_date >= md.market_end)
        ),
        active AS (
            SELECT
                *,
                row_number() OVER (
                    PARTITION BY month_key
                    ORDER BY total_amount DESC
                ) AS active_rank
            FROM qualified
        ),
        ranked AS (
            SELECT
                *,
                row_number() OVER (
                    PARTITION BY month_key
                    ORDER BY return_rate DESC, total_amount DESC
                ) AS return_rank,
                count(*) OVER (PARTITION BY month_key) AS candidate_count
            FROM active
            WHERE active_rank <= ?
        )
        SELECT *
        FROM ranked
        ORDER BY month_key, return_rank
    """
    rows = con.execute(
        sql,
        [
            daily_glob,
            start_date,
            end_date,
            instruments_path,
            min_listed_days,
            min_trading_ratio,
            active_pool,
        ],
    ).fetchall()
    columns = [item[0] for item in con.description]

    by_month: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        item = dict(zip(columns, row))
        by_month[item["month_key"]].append(item)
    return by_month


def as_float(value: Any, digits: int | None = None) -> float | None:
    if value is None:
        return None
    result = float(value)
    if math.isnan(result) or math.isinf(result):
        return None
    if digits is not None:
        return round(result, digits)
    return result


def stock_payload(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["ts_code"],
        "tsCode": row["ts_code"],
        "name": row["name"],
        "industry": row.get("industry") or "未分类",
        "market": row.get("market") or row.get("board") or "",
        "exchange": row.get("exchange") or "",
        "board": row.get("board") or "",
        "activeRank": int(row["active_rank"]),
        "returnRank": int(row["return_rank"]),
        "returnRate": as_float(row["return_rate"], 6),
        "returnPct": as_float(float(row["return_rate"]) * 100, 2),
        "startPrice": as_float(row["start_price"], 4),
        "endPrice": as_float(row["end_price"], 4),
        "monthlyAmount": as_float(row["total_amount"], 2),
        "avgAmount": as_float(row["avg_amount"], 2),
        "tradingDays": int(row["trading_days"]),
    }


def pick_distractors(
    rows: list[dict[str, Any]],
    rng: random.Random,
    low_pct: float,
    high_pct: float,
) -> list[dict[str, Any]]:
    candidate_count = len(rows)
    low_rank = max(2, int(math.floor(candidate_count * low_pct)))
    high_rank = max(low_rank + 2, int(math.ceil(candidate_count * high_pct)))
    band = [
        row
        for row in rows
        if low_rank <= int(row["return_rank"]) <= high_rank
        and row["ts_code"] != rows[0]["ts_code"]
    ]
    if len(band) < 3:
        band = [row for row in rows[1 : min(len(rows), 80)] if row["ts_code"] != rows[0]["ts_code"]]
    if len(band) < 3:
        raise ValueError(f"Need at least 3 distractors, only found {len(band)}")
    return rng.sample(band, 3)


def build_year_payload(args: argparse.Namespace, con: Any, year: int) -> dict[str, Any]:
    by_month = query_year(
        con=con,
        year=year,
        daily_clean_dir=args.daily_clean_dir,
        instruments=args.instruments,
        price_column=args.price_column,
        active_pool=args.active_pool,
        min_listed_days=args.min_listed_days,
        min_trading_ratio=args.min_trading_ratio,
    )

    months = []
    perfect_capital = float(args.initial_capital)
    for month_key in sorted(by_month):
        rows = by_month[month_key]
        if len(rows) < 4:
            raise ValueError(f"{month_key} has only {len(rows)} qualified candidates")
        month_number = int(month_key[4:6])
        rng = random.Random(args.seed + year * 100 + month_number)
        best_row = rows[0]
        distractors = pick_distractors(
            rows,
            rng,
            args.distractor_low_pct,
            args.distractor_high_pct,
        )
        option_rows = [best_row, *distractors]
        rng.shuffle(option_rows)
        best = stock_payload(best_row)
        options = []
        for row in option_rows:
            payload = stock_payload(row)
            payload["isBest"] = row["ts_code"] == best_row["ts_code"]
            options.append(payload)

        perfect_capital *= 1 + float(best["returnRate"])
        months.append(
            {
                "month": f"{year}-{month_number:02d}",
                "label": f"{year}年{month_number}月",
                "marketStart": best_row["market_start"],
                "marketEnd": best_row["market_end"],
                "marketDays": int(best_row["market_days"]),
                "candidateCount": int(best_row["candidate_count"]),
                "best": best,
                "options": options,
            }
        )

    return {
        "year": year,
        "initialCapital": float(args.initial_capital),
        "targetCapital": float(args.target_capital),
        "currency": "CNY",
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "source": {
            "dailyCleanDir": str(args.daily_clean_dir),
            "instruments": str(args.instruments),
            "priceColumn": args.price_column,
        },
        "rules": {
            "activePool": args.active_pool,
            "minListedDays": args.min_listed_days,
            "minTradingRatio": args.min_trading_ratio,
            "distractorBand": [
                args.distractor_low_pct,
                args.distractor_high_pct,
            ],
            "excludeST": True,
            "excludeSuspended": True,
            "requireTradableAtMonthEnds": True,
        },
        "perfectCapital": round(perfect_capital, 2),
        "months": months,
    }


def write_outputs(out_dir: Path, payloads: list[dict[str, Any]]) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    bundle: dict[str, Any] = {}
    manifest = {
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "years": [],
        "files": [],
    }

    for payload in payloads:
        year = str(payload["year"])
        file_path = out_dir / f"{year}.json"
        file_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        bundle[year] = payload
        manifest["years"].append(int(year))
        manifest["files"].append(file_path.name)
        print(f"Wrote {file_path}")

    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    js_path = out_dir / "game-data.js"
    js_body = (
        "window.REBIRTH_GAME_DATA = "
        + json.dumps(bundle, ensure_ascii=False, indent=2)
        + ";\n"
    )
    js_path.write_text(js_body, encoding="utf-8")
    print(f"Wrote {manifest_path}")
    print(f"Wrote {js_path}")


def main() -> None:
    args = parse_args()
    duckdb = require_duckdb()
    con = duckdb.connect()
    payloads = []
    for year in args.years:
        print(f"Building {year}...")
        payload = build_year_payload(args, con, year)
        payloads.append(payload)
        print(
            f"{year}: {len(payload['months'])} months, "
            f"perfect capital {payload['perfectCapital']:,.2f}"
        )
    write_outputs(Path(args.out_dir), payloads)


if __name__ == "__main__":
    main()
