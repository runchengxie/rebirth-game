#!/usr/bin/env python
"""Build monthly stock-picking game data from the local A-share clean layer."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import random
import re
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
    initial_capital: float
    target_capital: float
    active_pool: int
    min_listed_days: int
    min_trading_ratio: float
    distractor_low_pct: float
    distractor_high_pct: float
    price_column: PriceColumn
    seed: int


class Manifest(TypedDict):
    generatedAt: str
    years: list[int]
    files: list[str]


def parse_args() -> Config:
    parser = argparse.ArgumentParser(
        description="Generate compact yearly JSON for the rebirth stock game."
    )
    parser.add_argument("--years", nargs="+", type=int, default=list(DEFAULT_YEARS))
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
    namespace = parser.parse_args()
    values = vars(namespace)
    return Config(
        years=values["years"],
        daily_clean_dir=values["daily_clean_dir"],
        instruments=values["instruments"],
        out_dir=values["out_dir"],
        initial_capital=values["initial_capital"],
        target_capital=values["target_capital"],
        active_pool=values["active_pool"],
        min_listed_days=values["min_listed_days"],
        min_trading_ratio=values["min_trading_ratio"],
        distractor_low_pct=values["distractor_low_pct"],
        distractor_high_pct=values["distractor_high_pct"],
        price_column=cast(PriceColumn, values["price_column"]),
        seed=values["seed"],
    )


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


def dataset_version(path: str | Path) -> str:
    match = re.search(r"(20\d{6})(?!.*20\d{6})", str(path))
    return match.group(1) if match else "unknown"


def public_source_metadata(
    daily_clean_dir: str | Path,
    instruments: str | Path,
    price_column: PriceColumn,
) -> dict[str, str]:
    return {
        "dailyDataset": "a_share_daily_clean",
        "dailyDatasetVersion": dataset_version(daily_clean_dir),
        "instrumentDataset": "a_share_instruments",
        "instrumentDatasetVersion": dataset_version(instruments),
        "priceColumn": price_column,
    }


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
        item = dict(zip(columns, row, strict=True))
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


CLUE_TEMPLATES: dict[str, dict[str, list[str]]] = {
    "rina": {
        "fundamental": [
            "{industry}链条近期有价格弹性，但持续性要看订单。",
            "{industry}基本面处于景气验证阶段，估值需要业绩来支撑。",
            "{industry}这条线有成本改善预期，兑现节奏还要跟踪下游需求。",
        ],
        "fund_flow": [
            "成交额排名 #{rank}，需要确认资金是短期博弈还是中期布局。",
        ],
        "risk": [
            "如果只是事件脉冲，月末可能回撤。基本面能提供安全垫吗？",
        ],
    },
    "misaki": {
        "fundamental": [
            "{industry}的基本面我不太关心，我更想看资金有没有留下痕迹。",
        ],
        "fund_flow": [
            "成交额排名 #{rank}，活跃但不是最拥挤。资金反复确认过吗？",
            "成交额排名 #{rank}，市场热度已经起来了，现在就差方向确认。",
            "成交额排名 #{rank}，量能信号偏强，但要区分真放量和脉冲。",
        ],
        "risk": [
            "信号看起来不错，但不要只看热度。拥挤度太高反而容易回撤。",
        ],
    },
    "mei": {
        "fundamental": [
            "{industry}的基本面故事不差，但宏观上还有几个变量没兑现。",
        ],
        "fund_flow": [
            "成交额排名 #{rank}，流动性没问题，但要看它能撑多久。",
        ],
        "risk": [
            "月末兑现前，估值和拥挤度可能反噬。节奏比方向更重要。",
            "这个位置的风险收益比需要仔细评估，不要只被故事吸引。",
            "如果只是新闻脉冲，没有业绩和资金接力，持续性存疑。",
        ],
    },
}


def generate_clues(
    ts_code: str,
    name: str,
    industry: str,
    active_rank: int,
) -> list[dict[str, str]]:
    """Generate 3 character-perspective research clues for a stock option.

    Returns one clue per character: rina (fundamental/risk), misaki (fund_flow), mei (risk).
    Uses a deterministic seed based on ts_code so the same stock always gets the same clues.
    """
    seed = sum(ord(c) for c in ts_code)

    def pick(arr: list[str], offset: int) -> str:
        return arr[offset % len(arr)]

    def pick_text(templates: list[str], offset: int) -> str:
        return (
            pick(templates, offset)
            .replace("{industry}", industry)
            .replace("{rank}", str(active_rank))
            .replace("{name}", name)
        )

    rina_fund = pick_text(CLUE_TEMPLATES["rina"]["fundamental"], seed)
    rina_risk = pick_text(CLUE_TEMPLATES["rina"]["risk"], seed + 1)
    misaki_fund = pick_text(CLUE_TEMPLATES["misaki"]["fund_flow"], seed)
    mei_risk = pick_text(CLUE_TEMPLATES["mei"]["risk"], seed)

    return [
        {
            "characterId": "rina",
            "dimension": "fundamental" if active_rank <= 200 else "risk",
            "text": rina_fund if active_rank <= 200 else rina_risk,
        },
        {
            "characterId": "misaki",
            "dimension": "fund_flow",
            "text": misaki_fund,
        },
        {
            "characterId": "mei",
            "dimension": "risk",
            "text": mei_risk,
        },
    ]


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
        if low_rank <= int(row["return_rank"]) <= high_rank and row["ts_code"] != rows[0]["ts_code"]
    ]
    if len(band) < 3:
        band = [row for row in rows[1 : min(len(rows), 80)] if row["ts_code"] != rows[0]["ts_code"]]
    if len(band) < 3:
        raise ValueError(f"Need at least 3 distractors, only found {len(band)}")
    return rng.sample(band, 3)


def build_year_payload(args: Config, con: Any, year: int) -> dict[str, Any]:
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
            payload["clues"] = generate_clues(
                row["ts_code"],
                row.get("name", row["ts_code"]),
                row.get("industry") or "未分类",
                int(row["active_rank"]),
            )
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
        "generatedAt": dt.datetime.now(dt.UTC).isoformat(),
        "source": public_source_metadata(
            args.daily_clean_dir,
            args.instruments,
            args.price_column,
        ),
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
    bundle: dict[str, dict[str, Any]] = {}
    manifest: Manifest = {
        "generatedAt": dt.datetime.now(dt.UTC).isoformat(),
        "years": [],
        "files": [],
    }

    for payload in payloads:
        year = str(payload["year"])
        file_path = out_dir / f"{year}.json"
        file_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        bundle[year] = payload
        manifest["years"].append(int(year))
        manifest["files"].append(file_path.name)
        print(f"Wrote {file_path}")

    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    js_path = out_dir / "game-data.js"
    js_body = (
        "window.REBIRTH_GAME_DATA = " + json.dumps(bundle, ensure_ascii=False, indent=2) + ";\n"
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
