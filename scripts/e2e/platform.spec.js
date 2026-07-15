const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

async function openClean(page, path) {
  await page.goto(path);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

async function answerCommittee(page) {
  for (let index = 0; index < 5; index += 1) {
    const response = page.locator(".committee-responses button").first();
    await expect(response).toBeVisible();
    await response.click();
  }
}

async function expectNoSeriousAccessibilityViolations(page) {
  const result = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();
  const violations = result.violations.filter((violation) =>
    violation.impact === "serious" || violation.impact === "critical");
  const summary = violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.flatMap((node) => node.target),
  }));
  expect(summary).toEqual([]);
}

test("键盘可以跳过导航，并在档案弹窗关闭后恢复焦点", async ({ page }) => {
  await openClean(page, "/?staticStage=1");

  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  const archiveButton = page.getByRole("button", { name: "记录与档案" });
  await archiveButton.focus();
  await archiveButton.click();
  await expect(page.getByRole("dialog", { name: /AI叙事重构|研究档案|剧情记录/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "关闭档案" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(archiveButton).toBeFocused();
});

test("独立投委会完成五轮答辩并保存历史", async ({ page }) => {
  await openClean(page, "/?mode=committee");

  await page.locator(".committee-decisions button").first().click();
  await page.getByRole("button", { name: "进入五轮答辩" }).click();
  await answerCommittee(page);

  await expect(page.locator(".committee-result")).toBeVisible();
  const history = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("rebirthCommitteeHistory:v1") || "[]"));
  expect(history).toHaveLength(1);
  expect(history[0].score.total).toBeGreaterThanOrEqual(0);
});

test("每日挑战保存首次结果，刷新后允许不覆盖记录的练习", async ({ page }) => {
  await openClean(page, "/?mode=daily");

  await page.locator(".daily-decisions button").first().click();
  await page.getByRole("button", { name: "开始今日答辩" }).click();
  await answerCommittee(page);
  await expect(page.locator(".daily-result")).toBeVisible();

  const firstRecord = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("rebirthDailyResults:v1") || "[]")[0]);
  expect(firstRecord).toBeTruthy();

  await page.reload();
  await expect(page.getByText("今日已完成")).toBeVisible();
  await page.getByRole("button", { name: "再次练习" }).click();
  await expect(page.getByText(/练习结果不会覆盖今日首次记录/)).toBeVisible();

  const preservedRecord = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("rebirthDailyResults:v1") || "[]")[0]);
  expect(preservedRecord.completedAt).toBe(firstRecord.completedAt);
});

test("内容工坊保存的案例会进入投委会案例库", async ({ page }) => {
  await openClean(page, "/?mode=studio");

  await page.getByRole("button", { name: "保存到案例库" }).click();
  await expect(page.getByText(/内容包已保存到本地案例库/)).toBeVisible();
  await page.getByRole("button", { name: /独立投委会/ }).click();

  await expect(page).toHaveURL(/mode=committee/);
  await expect(page.getByRole("button", { name: /利润增长，现金流下降/ })).toBeVisible();
});

test("模式代码加载失败时显示恢复界面而不是白屏", async ({ page }) => {
  await page.route("**/src/modes/CommitteeMode.tsx*", (route) => route.abort());
  await page.goto("/?mode=committee");

  await expect(page.getByRole("heading", { name: "这个研究流程没有正常展开" })).toBeVisible();
  await expect(page.getByRole("button", { name: "返回年度剧情" })).toBeVisible();
});

test("四种模式没有严重或致命的自动无障碍问题", async ({ page }) => {
  const samples = [
    ["/?staticStage=1", "重生投研部"],
    ["/?mode=committee", "投委会答辩室"],
    ["/?mode=daily", "每日研究挑战"],
    ["/?mode=studio", "研究案例内容工坊"],
  ];

  for (const [path, heading] of samples) {
    await page.goto(path);
    await expect(page.getByText(heading, { exact: false }).first()).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);
  }
});
