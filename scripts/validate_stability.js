const fs = require("fs");

function fail(message) {
  throw new Error(message);
}

function requireFile(path) {
  if (!fs.existsSync(path)) fail(`缺少稳定性文件：${path}`);
}

function requireText(path, expected) {
  const text = fs.readFileSync(path, "utf8");
  for (const item of expected) {
    if (!text.includes(item)) fail(`${path} 缺少稳定性契约：${item}`);
  }
}

for (const file of [
  "src/components/AppErrorBoundary.tsx",
  "src/stability.css",
  "src/game/communityContent.test.ts",
  "scripts/playwright.config.js",
  "scripts/e2e/platform.spec.js",
  "vitest.config.ts",
  "docs/stability-and-accessibility.md",
]) requireFile(file);

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
for (const script of ["e2e:prepare", "test:e2e", "validate:stability"]) {
  if (!packageJson.scripts?.[script]) fail(`package.json 缺少脚本：${script}`);
}

requireText("src/App.tsx", [
  "AppErrorBoundary",
  "skip-link",
  'id="main-content"',
  'aria-busy="true"',
]);
requireText("src/components/ArchiveDrawer.tsx", [
  "FOCUSABLE_SELECTOR",
  "previousFocusRef",
  'event.key === "Escape"',
  'event.key !== "Tab"',
  'aria-modal="true"',
  'role="tablist"',
]);
requireText("src/game/communityContent.ts", [
  "COMMUNITY_PACK_MAX_BYTES",
  "COMMUNITY_PACK_MAX_CASES",
  "COMMUNITY_CASE_MAX_DECISIONS",
  "存在重复 id",
  "TextEncoder",
]);
requireText("scripts/e2e/platform.spec.js", [
  "AxeBuilder",
  "answerCommittee",
  "档案弹窗关闭后恢复焦点",
  "内容工坊保存的案例会进入投委会案例库",
  "模式代码加载失败时显示恢复界面",
]);
requireText(".github/workflows/pages.yml", [
  "e2e:",
  "Browser journeys and accessibility",
  "playwright-diagnostics",
  "needs: [quality, e2e]",
]);
requireText("vitest.config.ts", ['"scripts/e2e/**"']);

console.log("稳定性契约校验通过。浏览器回归、焦点恢复、错误边界和内容包限制已接入。");
