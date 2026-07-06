const fs = require("fs");
const vm = require("vm");

function fail(message) {
  throw new Error(message);
}

const html = fs.readFileSync("index.html", "utf8");
for (const required of [
  'href="styles.css"',
  'src="data/game-data.js"',
  'src="app.js"',
]) {
  if (!html.includes(required)) {
    fail(`index.html missing ${required}`);
  }
}

new Function(fs.readFileSync("app.js", "utf8"));

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

console.log(`Validated frontend for years: ${years.join(", ")}`);
