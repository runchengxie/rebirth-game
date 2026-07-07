const fs = require("fs");
const vm = require("vm");

function fail(message) {
  throw new Error(message);
}

const html = fs.readFileSync("index.html", "utf8");
for (const required of ['id="root"', 'type="module"', 'src="/src/main.tsx"']) {
  if (!html.includes(required)) {
    fail(`index.html missing ${required}`);
  }
}

const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
for (const [, script] of inlineScripts) {
  new Function(script);
}

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
for (const dependency of ["@vitejs/plugin-react", "typescript", "vite", "react", "react-dom", "pixi.js"]) {
  const installed = packageJson.dependencies?.[dependency] || packageJson.devDependencies?.[dependency];
  if (!installed) {
    fail(`package.json missing ${dependency}`);
  }
}

for (const file of [
  "src/main.tsx",
  "src/App.tsx",
  "src/components/PixiStage.tsx",
  "src/audio/bgm.ts",
  "src/game/engine.ts",
  "src/game/content.ts",
  "src/data/gameData.ts",
  "src/styles.css",
  "vite.config.ts",
  "tsconfig.json",
  "tsconfig.app.json",
  "assets/galgame-key-art.png",
]) {
  if (!fs.existsSync(file)) {
    fail(`missing ${file}`);
  }
}

const app = fs.readFileSync("src/App.tsx", "utf8");
if (!app.includes("PixiStage") || !app.includes("FocusSelector") || !app.includes("CharacterRoutes") || !app.includes("ProceduralBgm")) {
  fail("src/App.tsx missing expected React game panels");
}

const pixiStage = fs.readFileSync("src/components/PixiStage.tsx", "utf8");
if (!pixiStage.includes("pixi.js") || !pixiStage.includes("galgame-key-art.png")) {
  fail("Pixi stage should use pixi.js and the generated key art");
}

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("data/game-data.js", "utf8"), sandbox);
const data = sandbox.window.REBIRTH_GAME_DATA;
if (!data || typeof data !== "object") {
  fail("data/game-data.js did not define window.REBIRTH_GAME_DATA");
}

const years = Object.keys(data).sort();
if (years.length === 0) {
  fail("no game years found");
}

for (const year of years) {
  if (!Array.isArray(data[year].months) || data[year].months.length !== 12) {
    fail(`${year} should have 12 months`);
  }
}

console.log(`Validated Vite frontend for years: ${years.join(", ")}`);
