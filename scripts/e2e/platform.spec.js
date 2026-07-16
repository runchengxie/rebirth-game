const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

async function waitForPageReady(page, path) {
  if (path === "/") {
    await expect(page.getByRole("heading", { name: "心动 K 线" })).toBeVisible();
    return;
  }
  if (path.includes("mode=committee")) {
    await expect(page.getByRole("heading", { name: "投委会答辩室" })).toBeVisible();
    return;
  }
  if (path.includes("mode=daily")) {
    await expect(page.getByRole("heading", { name: "每日研究挑战" })).toBeVisible();
    return;
  }
  if (path.includes("mode=studio")) {
    await expect(page.getByRole("heading", { name: "研究案例内容工坊" })).toBeVisible();
    return;
  }
  await expect(page.locator(".immersive-app")).toBeVisible();
}

async function openClean(page, path) {
  await page.goto(path);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForPageReady(page, path);
}

async function openDark(page, path) {
  await page.goto(path);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("rebirthGameTheme", "dark");
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await waitForPageReady(page, path);
}

async function answerCommittee(page) {
  for (let index = 0; index < 5; index += 1) {
    const response = page.locator(".committee-responses button").first();
    await expect(response).toBeVisible();
    await response.click();
  }
}

async function advanceToDecision(page) {
  for (let index = 0; index < 10; index += 1) {
    if (await page.locator(".immersive-decision-panel").count()) return;
    const advance = page.locator(".primary-action");
    await expect(advance).toBeEnabled();
    await advance.click();
  }
  await expect(page.locator(".immersive-decision-panel")).toBeVisible();
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

async function contrastRatio(page, foregroundSelector, backgroundSelector) {
  return page.evaluate(({ foregroundSelector: foreground, backgroundSelector: background }) => {
    function parseColor(value) {
      if (value === "transparent") {
        return { red: 0, green: 0, blue: 0, alpha: 0 };
      }
      const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
      if (channels.length < 3) throw new Error(`无法解析颜色：${value}`);
      const scale = value.startsWith("color(srgb") ? 255 : 1;
      return {
        red: channels[0] * scale,
        green: channels[1] * scale,
        blue: channels[2] * scale,
        alpha: channels[3] ?? 1,
      };
    }

    function blend(front, back) {
      const alpha = front.alpha + back.alpha * (1 - front.alpha);
      if (alpha === 0) return { red: 0, green: 0, blue: 0, alpha: 0 };
      return {
        red: (front.red * front.alpha + back.red * back.alpha * (1 - front.alpha)) / alpha,
        green: (front.green * front.alpha + back.green * back.alpha * (1 - front.alpha)) / alpha,
        blue: (front.blue * front.alpha + back.blue * back.alpha * (1 - front.alpha)) / alpha,
        alpha,
      };
    }

    function luminance(color) {
      const transform = (channel) => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * transform(color.red)
        + 0.7152 * transform(color.green)
        + 0.0722 * transform(color.blue);
    }

    const foregroundElement = document.querySelector(foreground);
    const backgroundElement = document.querySelector(background);
    if (!foregroundElement || !backgroundElement) {
      throw new Error(`缺少对比度目标：${foreground} / ${background}`);
    }

    const pageBackground = parseColor(getComputedStyle(document.body).backgroundColor);
    const backgroundColor = blend(
      parseColor(getComputedStyle(backgroundElement).backgroundColor),
      pageBackground,
    );
    const foregroundColor = blend(
      parseColor(getComputedStyle(foregroundElement).color),
      backgroundColor,
    );
    const foregroundLuminance = luminance(foregroundColor);
    const backgroundLuminance = luminance(backgroundColor);
    const lighter = Math.max(foregroundLuminance, backgroundLuminance);
    const darker = Math.min(foregroundLuminance, backgroundLuminance);
    return (lighter + 0.05) / (darker + 0.05);
  }, { foregroundSelector, backgroundSelector });
}

async function expectReadableContrast(page, samples) {
  for (const [label, foregroundSelector, backgroundSelector] of samples) {
    const ratio = await contrastRatio(page, foregroundSelector, backgroundSelector);
    expect(ratio, `${label} 的文字对比度为 ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  }
}

async function expectScrollablePage(page, path) {
  await openClean(page, path);
  const metrics = await page.evaluate(() => ({
    clientHeight: document.documentElement.clientHeight,
    scrollHeight: document.documentElement.scrollHeight,
    overflowY: getComputedStyle(document.body).overflowY,
  }));
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  expect(["auto", "visible", "scroll"]).toContain(metrics.overflowY);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
}

test("主菜单把两种年度体验与独立玩法分开", async ({ page }) => {
  await openClean(page, "/");

  const romance = page.getByRole("link", { name: /剧情模式/ });
  const career = page.getByRole("link", { name: /职业模式/ });
  await expect(romance).toHaveAttribute("href", /mode=story.*play=romance.*new=1/);
  await expect(career).toHaveAttribute("href", /mode=story.*play=career.*new=1/);
  await expect(page.getByText("当前浏览器还没有本地进度")).toBeVisible();
  await expect(page.getByRole("link", { name: "继续游戏" })).toHaveCount(0);
  await expect(page.locator('a[href*="mode=committee"]')).toBeVisible();
  await expect(page.getByRole("link", { name: /每日挑战/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /内容工坊/ })).toBeVisible();
});

test("剧情模式只让玩家处理人物回应", async ({ page }) => {
  await openClean(page, "/?mode=story&play=romance&new=1&staticStage=1");

  await advanceToDecision(page);

  await expect(page.locator(".romance-assist-note")).toBeVisible();
  await expect(page.locator(".stakeholder-pressure")).toHaveCount(0);
  await expect(page.locator(".research-commitment")).toHaveCount(0);
  await expect(page.locator(".investigation-panel")).toHaveCount(0);
});

test("键盘可以跳过导航，并在档案弹窗关闭后恢复焦点", async ({ page }) => {
  await openClean(page, "/?staticStage=1");

  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  const archiveButton = page.getByRole("button", { name: "记录与档案" });
  await archiveButton.focus();
  await archiveButton.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "关闭档案" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(archiveButton).toBeFocused();
});

test("年度剧情的主菜单入口不会遮挡操作按钮", async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 768 });
  await openClean(page, "/?staticStage=1");

  const actionBox = await page.locator(".interaction-actions").boundingBox();
  const menuBox = await page.locator(".back-to-menu-bar").boundingBox();
  expect(actionBox).not.toBeNull();
  expect(menuBox).not.toBeNull();
  expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(actionBox.y - 3);
  await expect(page.getByRole("link", { name: "主菜单" })).toBeVisible();
  await expect(page.getByRole("button", { name: /继续/ })).toBeVisible();
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
  await page.getByRole("link", { name: "主菜单" }).click();
  await expect(page.getByRole("heading", { name: "心动 K 线" })).toBeVisible();
  await page.locator('a[href*="mode=committee"]').click();

  await expect(page).toHaveURL(/mode=committee/);
  await expect(page.getByRole("button", { name: /利润增长，现金流下降/ })).toBeVisible();
});

test("投委会、每日挑战和内容工坊都可以滚动到底部", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 640 });
  await expectScrollablePage(page, "/?mode=committee");
  await expectScrollablePage(page, "/?mode=daily");
  await expectScrollablePage(page, "/?mode=studio");
});

test("窄屏平台模式没有横向裁切", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/?mode=committee", "/?mode=daily", "/?mode=studio"]) {
    await openClean(page, path);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test("深色年度剧情的压力卡和研究承诺文字保持清晰", async ({ page }) => {
  await openDark(page, "/?staticStage=1");
  await advanceToDecision(page);
  await expect(page.locator(".stakeholder-pressure")).toBeVisible();
  await expect(page.locator(".research-commitment")).toBeVisible();

  await expectReadableContrast(page, [
    ["压力来源", ".stakeholder-pressure header span", ".stakeholder-pressure"],
    ["压力标题", ".stakeholder-pressure header strong", ".stakeholder-pressure"],
    ["压力正文", ".stakeholder-pressure p", ".stakeholder-pressure"],
    ["压力取舍", ".stakeholder-pressure small", ".stakeholder-pressure"],
    ["研究承诺栏目标", ".research-commitment-heading span", ".research-commitment"],
    ["研究承诺说明", ".research-commitment-heading p", ".research-commitment"],
    ["置信度选项", ".commitment-choice-grid button strong", ".commitment-choice-grid button"],
    ["置信度解释", ".commitment-choice-grid button span", ".commitment-choice-grid button"],
    ["反例选择", ".commitment-falsifier select", ".commitment-falsifier select"],
    ["自检标签", ".commitment-review-checks label strong", ".commitment-review-checks label"],
    ["自检说明", ".commitment-review-checks label small", ".commitment-review-checks label"],
  ]);
});

test("深色投委会的研究承诺表单保持清晰", async ({ page }) => {
  await openDark(page, "/?mode=committee");
  await expect(page.locator(".research-commitment")).toBeVisible();

  await expectReadableContrast(page, [
    ["投委会承诺栏目标", ".research-commitment-heading span", ".research-commitment"],
    ["投委会承诺说明", ".research-commitment-heading p", ".research-commitment"],
    ["投委会置信度", ".commitment-choice-grid button strong", ".commitment-choice-grid button"],
    ["投委会置信度解释", ".commitment-choice-grid button span", ".commitment-choice-grid button"],
    ["投委会反例选择", ".commitment-falsifier select", ".commitment-falsifier select"],
    ["投委会自检说明", ".commitment-review-checks label small", ".commitment-review-checks label"],
  ]);
});

test("深色每日挑战的研究承诺表单保持清晰", async ({ page }) => {
  await openDark(page, "/?mode=daily");
  await expect(page.locator(".research-commitment")).toBeVisible();

  await expectReadableContrast(page, [
    ["每日挑战承诺栏目标", ".research-commitment-heading span", ".research-commitment"],
    ["每日挑战承诺说明", ".research-commitment-heading p", ".research-commitment"],
    ["每日挑战置信度", ".commitment-choice-grid button strong", ".commitment-choice-grid button"],
    ["每日挑战置信度解释", ".commitment-choice-grid button span", ".commitment-choice-grid button"],
    ["每日挑战反例选择", ".commitment-falsifier select", ".commitment-falsifier select"],
    ["每日挑战自检说明", ".commitment-review-checks label small", ".commitment-review-checks label"],
  ]);
});

test("深色模式关键平台文字和设置说明保持可读对比度", async ({ page }) => {
  await openDark(page, "/?mode=committee");
  expect(await contrastRatio(page, ".case-brief > p", ".committee-workspace")).toBeGreaterThanOrEqual(4.5);

  await openDark(page, "/?mode=daily");
  expect(await contrastRatio(page, ".daily-card > p", ".daily-card")).toBeGreaterThanOrEqual(4.5);

  await openDark(page, "/?mode=studio");
  expect(await contrastRatio(page, ".studio-field > span", ".studio-editor")).toBeGreaterThanOrEqual(4.5);

  await openDark(page, "/?staticStage=1");
  await page.getByRole("button", { name: "打开设置" }).click();
  await page.getByText("存档与跨设备转移", { exact: true }).click();
  await expect(page.locator(".share-code-field textarea")).toBeVisible();
  expect(await contrastRatio(page, ".share-code-field textarea", ".share-code-field textarea")).toBeGreaterThanOrEqual(4.5);
  await page.getByText("加密云同步", { exact: true }).click();
  await expect(page.locator(".cloud-sync-warning")).toBeVisible();
  expect(await contrastRatio(page, ".cloud-sync-warning", ".cloud-sync-body")).toBeGreaterThanOrEqual(4.5);
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
