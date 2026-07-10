/* eslint-disable no-undef */
// Dump 2024 content (themes + 12 decision pools) out of content.ts into
// src/game/content/2024.json, so content2024.ts can become a validated loader
// (matching the already-extracted 2023 / 2025 layers).
//
// Why Vite ssrLoadModule: raw `node --experimental-strip-types` cannot resolve
// extensionless relative imports, so load through Vite.

import { createServer } from "vite";
import { writeFileSync } from "node:fs";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "warn",
});

try {
  const mod = await server.ssrLoadModule("/src/game/content.ts");
  const themes = mod.YEAR_THEMES["2024"];
  const decisions = Array.from({ length: 12 }, (_, i) => {
    const scene = mod.buildMonthScene(i, "2024");
    const decisionNode = scene.nodes.find((n) => n.type === "decision");
    return decisionNode ? decisionNode.decisions : [];
  });
  const data = { year: "2024", themes, decisions };
  writeFileSync("src/game/content/2024.json", JSON.stringify(data, null, 2) + "\n");
  const total = decisions.reduce((n, pool) => n + pool.length, 0);
  console.log(`dumped 2024.json: ${themes.length} themes, ${decisions.length} pools, ${total} decisions`);
} finally {
  await server.close();
}
