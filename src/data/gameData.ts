import data2023 from "../../data/2023.json";
import data2024 from "../../data/2024.json";
import data2025 from "../../data/2025.json";
import type { GameDataMap, GameDataYear } from "../types";

export const GAME_DATA: GameDataMap = {
  "2023": data2023 as GameDataYear,
  "2024": data2024 as GameDataYear,
  "2025": data2025 as GameDataYear,
};

export const GAME_YEARS = Object.keys(GAME_DATA).sort();
