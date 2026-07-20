// 路线图 R3A：统一场景契约。
// 年度剧情舞台（Pixi、静态舞台、观点交锋）和独立投委会共用这一套场景编号
// 与注册表。新增场景必须先在这里登记，未登记的编号在类型检查阶段直接失败。

// 年度剧情舞台的位图场景。SceneNode.bg 只能取这些值（R3.1）。
export type StageSceneId = "research-room" | "briefing-room" | "night-cafe";

// 独立投委会的程序化场景：由 CSS 绘制，不依赖位图（R3.7）。
export type ProceduralSceneId =
  | "committee-room"
  | "data-wall"
  | "risk-review"
  | "compliance-desk";

export type SceneId = StageSceneId | ProceduralSceneId;

// 粒子策略：visibleCount 控制粒子数，speed/alpha 控制气质。
export interface SceneWeather {
  visibleCount: number;
  speedScale: number;
  alphaScale: number;
}

// 灯光策略：整体压暗层与路线色晕染层的参数。
export interface SceneLighting {
  dimColor: number;
  dimAlpha: number;
  tintAlpha: number;
}

// 构图焦点（0..1 归一化坐标），位图裁切时以该点为视觉中心。
export interface SceneFocus {
  desktop: { x: number; y: number };
  mobile: { x: number; y: number };
}

// R3.8：场景位图的来源、生成参数、授权状态、尺寸与压缩信息。
export interface SceneAssetMeta {
  path: string;
  source: string;
  generation: string;
  license: string;
  width: number;
  height: number;
  sizeKiB: number;
  compression: string;
}

export interface StageSceneDefinition {
  id: StageSceneId;
  label: string;
  presentation: "bitmap";
  loadImage: () => Promise<string>;
  asset: SceneAssetMeta;
  focus: SceneFocus;
  lighting: SceneLighting;
  weather: SceneWeather;
}

export interface ProceduralSceneDefinition {
  id: ProceduralSceneId;
  label: string;
  presentation: "procedural";
  cssClass: string;
}

export type SceneDefinition = StageSceneDefinition | ProceduralSceneDefinition;

const CENTER_FOCUS: SceneFocus = {
  desktop: { x: 0.5, y: 0.5 },
  mobile: { x: 0.5, y: 0.5 },
};

const DEFAULT_LIGHTING: SceneLighting = {
  dimColor: 0x140a1b,
  dimAlpha: 0.12,
  tintAlpha: 0.14,
};

// 三张位图同批产出：AI 概念图先出 PNG，再统一转码 WebP 交付
//（提交 c580ae7「refresh game art and optimize delivery」，2026-07-13）。
const STAGE_ASSET_PROVENANCE = {
  source: "项目内 AI 生成概念图（2026-07 美术更新，提交 c580ae7）",
  generation: "AI 图像生成；原始提示词未存档，原稿为同名 PNG",
  license: "项目自有资源，仅限本项目内使用",
  compression: "WebP 有损转码（自 PNG 原稿），单张预算 500 KiB",
} as const;

export const STAGE_SCENES: Record<StageSceneId, StageSceneDefinition> = {
  "research-room": {
    id: "research-room",
    label: "研究室",
    presentation: "bitmap",
    loadImage: () =>
      import("../../assets/vn/backgrounds/research-room.webp").then((module) => module.default),
    asset: {
      path: "assets/vn/backgrounds/research-room.webp",
      width: 557,
      height: 941,
      sizeKiB: 90,
      ...STAGE_ASSET_PROVENANCE,
    },
    focus: CENTER_FOCUS,
    lighting: DEFAULT_LIGHTING,
    weather: { visibleCount: 14, speedScale: 0.45, alphaScale: 0.6 },
  },
  "briefing-room": {
    id: "briefing-room",
    label: "会议简报室",
    presentation: "bitmap",
    loadImage: () =>
      import("../../assets/vn/backgrounds/briefing-room.webp").then((module) => module.default),
    asset: {
      path: "assets/vn/backgrounds/briefing-room.webp",
      width: 558,
      height: 941,
      sizeKiB: 67,
      ...STAGE_ASSET_PROVENANCE,
    },
    focus: CENTER_FOCUS,
    lighting: DEFAULT_LIGHTING,
    weather: { visibleCount: 6, speedScale: 0.35, alphaScale: 0.4 },
  },
  "night-cafe": {
    id: "night-cafe",
    label: "夜间咖啡馆",
    presentation: "bitmap",
    loadImage: () =>
      import("../../assets/vn/backgrounds/night-cafe.webp").then((module) => module.default),
    asset: {
      path: "assets/vn/backgrounds/night-cafe.webp",
      width: 557,
      height: 941,
      sizeKiB: 91,
      ...STAGE_ASSET_PROVENANCE,
    },
    focus: CENTER_FOCUS,
    lighting: DEFAULT_LIGHTING,
    weather: { visibleCount: 26, speedScale: 1, alphaScale: 1 },
  },
};

export const PROCEDURAL_SCENES: Record<ProceduralSceneId, ProceduralSceneDefinition> = {
  "committee-room": {
    id: "committee-room",
    label: "投委会会议室",
    presentation: "procedural",
    cssClass: "scene-committee-room",
  },
  "data-wall": {
    id: "data-wall",
    label: "数据墙",
    presentation: "procedural",
    cssClass: "scene-data-wall",
  },
  "risk-review": {
    id: "risk-review",
    label: "风险审查室",
    presentation: "procedural",
    cssClass: "scene-risk-review",
  },
  "compliance-desk": {
    id: "compliance-desk",
    label: "合规桌面",
    presentation: "procedural",
    cssClass: "scene-compliance-desk",
  },
};

export const SCENES: Record<SceneId, SceneDefinition> = {
  ...STAGE_SCENES,
  ...PROCEDURAL_SCENES,
};

// 节点未显式指定背景时的默认值：对白在研究室，研究选择在会议简报室。
export function stageSceneIdFor(
  nodeType: "dialogue" | "decision",
  bg?: StageSceneId,
): StageSceneId {
  return bg ?? (nodeType === "dialogue" ? "research-room" : "briefing-room");
}

const imageUrlCache = new Map<StageSceneId, Promise<string>>();

// R3.6：按需解析场景位图 URL。同一场景全局只解析一次，Pixi 舞台、
// 静态舞台和观点交锋共享缓存。
export function stageSceneImageUrl(id: StageSceneId): Promise<string> {
  let pending = imageUrlCache.get(id);
  if (!pending) {
    pending = STAGE_SCENES[id].loadImage();
    imageUrlCache.set(id, pending);
  }
  return pending;
}

// 预取下一节点背景：提前解析 URL 并让浏览器开始下载位图，
// 场景切换时命中 HTTP 缓存。
export function prefetchStageScene(id: StageSceneId): void {
  void stageSceneImageUrl(id)
    .then((url) => {
      if (typeof Image === "undefined") return;
      const image = new Image();
      image.decoding = "async";
      image.src = url;
    })
    .catch(() => {
      // 预取失败不影响主流程，真正显示时会再尝试加载。
    });
}
