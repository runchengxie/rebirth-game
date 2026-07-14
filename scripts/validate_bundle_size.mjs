/* global console */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const DIST_DIR = path.resolve("dist");
const ASSET_DIR = path.join(DIST_DIR, "assets");
const MAX_CHUNK_BYTES = 500_000;
const MAX_ENTRY_BYTES = 150_000;
const MAX_LAZY_PANEL_BYTES = 25_000;
const MAX_TIMELINE_CSS_BYTES = 20_000;

function fail(message) {
  console.error(`Bundle budget failed: ${message}`);
  process.exitCode = 1;
}

if (!fs.existsSync(ASSET_DIR)) {
  fail("dist/assets 不存在，请先运行 npm run build");
  process.exit();
}

const files = fs.readdirSync(ASSET_DIR);
const javascript = files
  .filter((file) => file.endsWith(".js"))
  .map((file) => ({ file, bytes: fs.statSync(path.join(ASSET_DIR, file)).size }))
  .sort((left, right) => right.bytes - left.bytes);

for (const asset of javascript) {
  if (asset.bytes > MAX_CHUNK_BYTES) {
    fail(`${asset.file} 为 ${asset.bytes} bytes，超过 ${MAX_CHUNK_BYTES} bytes`);
  }
}

const entry = javascript.find((asset) => /^index-.*\.js$/.test(asset.file));
if (!entry) {
  fail("未找到 index JavaScript 入口");
} else if (entry.bytes > MAX_ENTRY_BYTES) {
  fail(`首屏入口 ${entry.file} 为 ${entry.bytes} bytes，超过 ${MAX_ENTRY_BYTES} bytes`);
}

const archiveChunk = javascript.find((asset) => asset.file.startsWith("ArchiveDrawer-"));
const timelineChunk = javascript.find((asset) => asset.file.startsWith("RebirthTimelinePanel-"));
if (!archiveChunk) {
  fail("档案抽屉没有生成独立异步 chunk");
} else if (archiveChunk.bytes > MAX_LAZY_PANEL_BYTES) {
  fail(`档案抽屉异步 chunk 为 ${archiveChunk.bytes} bytes，超过 ${MAX_LAZY_PANEL_BYTES} bytes`);
}
if (!timelineChunk) {
  fail("因果回溯没有生成独立异步 chunk");
} else if (timelineChunk.bytes > MAX_LAZY_PANEL_BYTES) {
  fail(`回溯面板异步 chunk 为 ${timelineChunk.bytes} bytes，超过 ${MAX_LAZY_PANEL_BYTES} bytes`);
}

const cssFiles = files
  .filter((file) => file.endsWith(".css"))
  .map((file) => ({ file, bytes: fs.statSync(path.join(ASSET_DIR, file)).size }));
const timelineCss = cssFiles.find((asset) => asset.file.startsWith("RebirthTimelinePanel-"));
if (!timelineCss) {
  fail("时间线样式没有随异步组件拆分");
} else if (timelineCss.bytes > MAX_TIMELINE_CSS_BYTES) {
  fail(`时间线异步样式为 ${timelineCss.bytes} bytes，超过 ${MAX_TIMELINE_CSS_BYTES} bytes`);
}

const entryCss = cssFiles.find((asset) => asset.file.startsWith("index-"));
if (entryCss) {
  const css = fs.readFileSync(path.join(ASSET_DIR, entryCss.file), "utf8");
  if (css.includes(".timeline-rewind")) {
    fail("首屏 CSS 仍包含时间线样式");
  }
}

console.log("Bundle budget passed");
for (const asset of javascript.slice(0, 8)) {
  console.log(`${asset.bytes}\t${asset.file}`);
}
