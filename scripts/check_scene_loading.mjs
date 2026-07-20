// 一次性验证脚本（路线图 R3.6）：确认首屏只下载当前场景背景，
// 其余背景按需/预取加载。用法：node scripts/check_scene_loading.mjs [baseUrl]
import { chromium } from "@playwright/test";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:4174";
const browser = await chromium.launch({ args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const backgroundRequests = [];
page.on("request", (request) => {
  const url = request.url();
  if (/(research-room|briefing-room|night-cafe).*\.webp/.test(url)) {
    backgroundRequests.push(url.split("/").pop());
  }
});

await page.goto(`${baseUrl}/?mode=story&play=career&new=1`);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector(".immersive-app");
await page.waitForTimeout(2500);
console.log("首屏背景请求:", backgroundRequests);

// 推进到研究选择（briefing-room），确认第二背景此时才出现
for (let index = 0; index < 10; index += 1) {
  if (await page.locator(".immersive-decision-panel").count()) break;
  await page.locator(".primary-action").click();
  await page.waitForTimeout(300);
}
await page.waitForSelector(".immersive-decision-panel");
await page.waitForTimeout(1500);
console.log("进入决策后背景请求:", backgroundRequests);

await browser.close();
