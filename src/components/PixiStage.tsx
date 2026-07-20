import { useEffect, useRef } from "react";
import { Application, Assets, Container, Graphics, Sprite, type Texture, type Ticker } from "pixi.js";
import meiNeutralSprite from "../../assets/vn/characters/mei-neutral.webp";
import meiSeriousSprite from "../../assets/vn/characters/mei-serious.webp";
import meiSoftSprite from "../../assets/vn/characters/mei-soft.webp";
import misakiExcitedSprite from "../../assets/vn/characters/misaki-excited.webp";
import misakiFocusedSprite from "../../assets/vn/characters/misaki-focused.webp";
import misakiNeutralSprite from "../../assets/vn/characters/misaki-neutral.webp";
import rinaSmileSprite from "../../assets/vn/characters/rina-smile.webp";
import rinaSoftSprite from "../../assets/vn/characters/rina-soft.webp";
import rinaThinkingSprite from "../../assets/vn/characters/rina-thinking.webp";
import zhaoNeutralSprite from "../../assets/vn/characters/zhao-neutral.webp";
import zhaoReliefSprite from "../../assets/vn/characters/zhao-relief.webp";
import zhaoThinkingSprite from "../../assets/vn/characters/zhao-thinking.webp";
import { STAGE_SCENES, stageSceneImageUrl, type SceneWeather, type StageSceneId } from "../game/scenes";
import type { CharacterId, CharacterProfile } from "../types";

interface PixiStageProps {
  activeCharacter: CharacterProfile;
  backgroundId?: StageSceneId;
  // 路线图 R3.6：下一节点的背景，在当前场景播放时提前解码成纹理。
  prefetchBackgroundId?: StageSceneId | null;
  activePose?: string;
}

interface Sparkle {
  graphic: Graphics;
  speed: number;
  drift: number;
}

// 场景转场 / 立绘切换 / 天气粒子的动画状态（tick 每帧推进）。
interface StageFx {
  bgFade: number;      // 0..1：背景交叉淡入进度
  charFade: number;    // 0..1：当前立绘淡入进度
  lastBgId: StageSceneId | "";
  lastCharId: CharacterId | null;
  breathePhase: number;
}

// 天气粒子与灯光参数由场景注册表提供（路线图 R3.2/R3.3）：
// 夜晚咖啡馆星光最盛，研究室是缓慢的浮尘，会议简报室几乎干净。
const DEFAULT_WEATHER: SceneWeather = { visibleCount: 14, speedScale: 0.5, alphaScale: 0.6 };

function weatherFor(bgId: StageSceneId | ""): SceneWeather {
  return bgId ? STAGE_SCENES[bgId].weather : DEFAULT_WEATHER;
}

interface StageScene {
  app: Application;
  host: HTMLDivElement;
  background: Sprite;
  prevBackground: Sprite;
  backgroundTextures: Partial<Record<StageSceneId, Texture>>;
  characterTextures: Partial<Record<CharacterId, Record<string, Texture>>>;
  characterSprites: Partial<Record<CharacterId, Sprite>>;
  baseScales: Partial<Record<CharacterId, number>>;
  overlay: Graphics;
  sparkleItems: Sparkle[];
  fx: StageFx;
  animated: boolean;
}

interface StagePropsSnapshot {
  activeCharacter: CharacterProfile;
  backgroundId: StageSceneId;
  activePose: string;
}

// 路线图 R3.6：背景纹理按需加载并全局缓存，跨组件挂载复用；
// 不再在启动时一次加载全部背景。
const stageTextureCache = new Map<StageSceneId, Promise<Texture>>();

function loadStageTexture(id: StageSceneId): Promise<Texture> {
  let pending = stageTextureCache.get(id);
  if (!pending) {
    pending = stageSceneImageUrl(id).then((url) => Assets.load<Texture>(url));
    pending.catch(() => stageTextureCache.delete(id));
    stageTextureCache.set(id, pending);
  }
  return pending;
}

const characterAssets: Partial<Record<CharacterId, Record<string, string>>> = {
  lin_ruoning: {
    smile: rinaSmileSprite,
    thinking: rinaThinkingSprite,
    soft: rinaSoftSprite,
  },
  chen_xinghe: {
    neutral: misakiNeutralSprite,
    excited: misakiExcitedSprite,
    focused: misakiFocusedSprite,
  },
  zhou_mingzhao: {
    neutral: meiNeutralSprite,
    serious: meiSeriousSprite,
    soft: meiSoftSprite,
  },
  zhao_chengyu: {
    neutral: zhaoNeutralSprite,
    relief: zhaoReliefSprite,
    thinking: zhaoThinkingSprite,
  },
};

const defaultPose: Partial<Record<CharacterId, string>> = {
  lin_ruoning: "smile",
  chen_xinghe: "neutral",
  zhou_mingzhao: "neutral",
  zhao_chengyu: "neutral",
};

const stageCharacterIds: readonly CharacterId[] = [
  "lin_ruoning",
  "chen_xinghe",
  "zhou_mingzhao",
  "zhao_chengyu",
];

const routeTint: Record<CharacterProfile["color"], number> = {
  pink: 0xff8ec3,
  blue: 0x8fc7ff,
  lavender: 0xc6a7ff,
  slate: 0x6f7f90,
};

async function loadTextureMap<T extends string>(assets: Record<T, string>): Promise<Record<T, Texture>> {
  const entries = await Promise.all(
    Object.entries(assets).map(async ([key, url]) => [key, await Assets.load<Texture>(url as string)] as const),
  );
  return Object.fromEntries(entries) as Record<T, Texture>;
}

async function loadCharacterTextureMap(): Promise<Partial<Record<CharacterId, Record<string, Texture>>>> {
  const entries = await Promise.all(
    (Object.entries(characterAssets) as Array<[CharacterId, Record<string, string>]>).map(
      async ([characterId, poseAssets]) => [characterId, await loadTextureMap(poseAssets)] as const,
    ),
  );
  return Object.fromEntries(entries) as Partial<Record<CharacterId, Record<string, Texture>>>;
}

function createCharacterSprites(
  textures: Partial<Record<CharacterId, Record<string, Texture>>>,
): Partial<Record<CharacterId, Sprite>> {
  const sprites: Partial<Record<CharacterId, Sprite>> = {};
  for (const characterId of stageCharacterIds) {
    const pose = defaultPose[characterId];
    const texture = pose ? textures[characterId]?.[pose] : undefined;
    if (texture) sprites[characterId] = new Sprite(texture);
  }
  return sprites;
}

function normalizePose(characterId: CharacterId, pose: string): string {
  const aliases: Partial<Record<CharacterId, Record<string, string>>> = {
    lin_ruoning: {
      calm: "smile", neutral: "smile", smile: "smile",
      thinking: "thinking", serious: "thinking", soft: "soft",
    },
    chen_xinghe: {
      neutral: "neutral", smile: "neutral",
      wink: "excited", excited: "excited", speaking: "excited",
      focused: "focused", thinking: "focused",
    },
    zhou_mingzhao: {
      calm: "neutral", neutral: "neutral",
      observing: "serious", serious: "serious", thinking: "serious",
      soft: "soft", smile: "soft",
    },
    zhao_chengyu: {
      neutral: "neutral", calm: "neutral", serious: "thinking",
      thinking: "thinking", observing: "thinking",
      soft: "relief", smile: "relief", happy: "relief", relieved: "relief",
    },
  };
  return aliases[characterId]?.[pose] || defaultPose[characterId] || "neutral";
}

function layoutCover(
  sprite: Sprite,
  texture: Texture,
  width: number,
  height: number,
  focus: { x: number; y: number },
): void {
  const scale = Math.max(width / texture.width, height / texture.height);
  sprite.width = texture.width * scale;
  sprite.height = texture.height * scale;
  sprite.x = (width - sprite.width) * focus.x;
  sprite.y = (height - sprite.height) * focus.y;
}

// 目标背景尚未加载完成时先保持当前画面，纹理就绪后 ensureBackground 会重绘。
function resolveBackgroundId(scene: StageScene, requestedId: StageSceneId): StageSceneId {
  if (scene.backgroundTextures[requestedId]) return requestedId;
  return scene.fx.lastBgId || requestedId;
}

// 背景切换：把旧纹理放到 prevBackground 上，重置交叉淡入进度。
function beginBackgroundCrossfade(scene: StageScene, resolvedBgId: StageSceneId, backgroundTexture: Texture): void {
  if (scene.fx.lastBgId === resolvedBgId) return;
  if (scene.fx.lastBgId && scene.animated) {
    scene.prevBackground.texture = scene.backgroundTextures[scene.fx.lastBgId] || backgroundTexture;
    scene.prevBackground.visible = true;
    scene.fx.bgFade = 0;
  }
  scene.fx.lastBgId = resolvedBgId;
}

function renderScene(scene: StageScene, props: StagePropsSnapshot): void {
  const width = Math.max(1, scene.host.clientWidth);
  const height = Math.max(1, scene.host.clientHeight);
  const tint = routeTint[props.activeCharacter.color];
  const resolvedBgId = resolveBackgroundId(scene, props.backgroundId);
  const backgroundTexture = scene.backgroundTextures[resolvedBgId];
  if (!backgroundTexture) return;
  const definition = STAGE_SCENES[resolvedBgId];
  const isCompactViewport = width < 700 || (width < 1024 && height < 560);
  const focus = isCompactViewport ? definition.focus.mobile : definition.focus.desktop;

  scene.app.renderer.resize(width, height);

  beginBackgroundCrossfade(scene, resolvedBgId, backgroundTexture);
  scene.background.texture = backgroundTexture;
  layoutCover(scene.background, backgroundTexture, width, height, focus);
  if (scene.prevBackground.visible) {
    layoutCover(scene.prevBackground, scene.prevBackground.texture, width, height, focus);
  }

  scene.overlay.clear();
  scene.overlay.rect(0, 0, width, height).fill({ color: definition.lighting.dimColor, alpha: definition.lighting.dimAlpha });
  scene.overlay.rect(0, height * 0.6, width, height * 0.4).fill({ color: tint, alpha: definition.lighting.tintAlpha });

  // 立绘切换：新角色上台时重置淡入进度。
  if (scene.fx.lastCharId !== props.activeCharacter.id) {
    if (scene.animated) scene.fx.charFade = 0;
    scene.fx.lastCharId = props.activeCharacter.id;
  }

  const targetHeight = Math.min(height * 0.92, isCompactViewport ? width * 1.38 : width * 0.52);
  const bottom = isCompactViewport ? height - Math.min(26, height * 0.045) : height + Math.min(26, height * 0.05);
  (Object.keys(scene.characterSprites) as CharacterId[]).forEach((characterId) => {
    const sprite = scene.characterSprites[characterId];
    if (!sprite) return;
    const active = characterId === props.activeCharacter.id;
    const pose = active ? normalizePose(characterId, props.activePose) : defaultPose[characterId] || "neutral";
    const textures = scene.characterTextures[characterId];
    const fallback = defaultPose[characterId] || "neutral";
    sprite.texture = (textures && (textures[pose] || textures[fallback])) || sprite.texture;
    const baseScale = targetHeight / sprite.texture.height;
    scene.baseScales[characterId] = baseScale;

    sprite.visible = active;
    sprite.x = width * 0.5;
    sprite.y = bottom;
    sprite.scale.set(baseScale);
    sprite.alpha = scene.animated && active ? Math.min(1, scene.fx.charFade) : 1;
    sprite.tint = 0xffffff;
    sprite.zIndex = active ? 4 : 0;
  });

  const weather = definition.weather;
  scene.sparkleItems.forEach((item, index) => {
    item.graphic.tint = tint;
    item.graphic.visible = index < weather.visibleCount;
  });
}

// 目标背景不在纹理缓存时异步补载，就绪后重绘（挂载期间只会真正加载一次）。
function ensureBackground(sceneRef: { current: StageScene | null }, propsRef: { current: StagePropsSnapshot }, id: StageSceneId): void {
  const scene = sceneRef.current;
  if (!scene || scene.backgroundTextures[id]) return;
  void loadStageTexture(id)
    .then((texture) => {
      const current = sceneRef.current;
      if (!current) return;
      current.backgroundTextures[id] = texture;
      renderScene(current, propsRef.current);
    })
    .catch(() => {
      // 加载失败时保持当前背景，下一次场景切换会重试。
    });
}

export function PixiStage({
  activeCharacter,
  backgroundId = "research-room",
  prefetchBackgroundId = null,
  activePose = "neutral",
}: PixiStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<StageScene | null>(null);
  const latestPropsRef = useRef<StagePropsSnapshot>({ activeCharacter, backgroundId, activePose });

  useEffect(() => {
    latestPropsRef.current = { activeCharacter, backgroundId, activePose };
    const scene = sceneRef.current;
    if (!scene) return;
    ensureBackground(sceneRef, latestPropsRef, backgroundId);
    renderScene(scene, latestPropsRef.current);
  }, [activeCharacter, activePose, backgroundId]);

  // 预取下一节点背景纹理，切换时零等待（路线图 R3.6）。
  useEffect(() => {
    if (prefetchBackgroundId) void loadStageTexture(prefetchBackgroundId).catch(() => undefined);
  }, [prefetchBackgroundId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const hostElement = host;

    let disposed = false;
    let initialized = false;
    const app = new Application();
    const overlay = new Graphics();
    const sparkles = new Container();
    const characters = new Container();
    const sparkleItems: Sparkle[] = [];
    hostElement.classList.add("pixi-stage-fallback");
    characters.sortableChildren = true;

    async function boot() {
      try {
        await app.init({
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          failIfMajorPerformanceCaveat: true,
          powerPreference: "low-power",
          preference: "webgl",
          resolution: Math.min(window.devicePixelRatio || 1, 2),
        });
      } catch {
        return;
      }
      initialized = true;
      if (disposed) {
        safelyDestroy(app);
        return;
      }

      hostElement.appendChild(app.canvas);

      // 只加载当前节点的背景（路线图 R3.6），其余背景按需补载或预取。
      const initialBgId = latestPropsRef.current.backgroundId;
      let initialBackground: Texture;
      let characterTextures: Partial<Record<CharacterId, Record<string, Texture>>>;
      try {
        [initialBackground, characterTextures] = await Promise.all([
          loadStageTexture(initialBgId),
          loadCharacterTextureMap(),
        ]);
      } catch {
        return;
      }
      if (disposed) return;

      const backgroundTextures: Partial<Record<StageSceneId, Texture>> = {
        [initialBgId]: initialBackground,
      };
      const background = new Sprite(initialBackground);
      const prevBackground = new Sprite(initialBackground);
      prevBackground.visible = false;
      const characterSprites = createCharacterSprites(characterTextures);

      Object.values(characterSprites).forEach((sprite) => {
        if (!sprite) return;
        sprite.anchor.set(0.5, 1);
        characters.addChild(sprite);
      });

      app.stage.addChild(background);
      app.stage.addChild(prevBackground);
      app.stage.addChild(characters);
      app.stage.addChild(overlay);
      app.stage.addChild(sparkles);

      const makeSparkle = (index: number) => {
        const graphic = new Graphics();
        const radius = 2 + (index % 4);
        graphic.star(0, 0, 4, radius * 2.2, radius * 0.72).fill({
          color: 0xffffff,
          alpha: 0.72,
        });
        graphic.x = 40 + Math.random() * Math.max(1, hostElement.clientWidth - 80);
        graphic.y = 40 + Math.random() * Math.max(1, hostElement.clientHeight - 80);
        graphic.alpha = 0.24 + Math.random() * 0.34;
        sparkles.addChild(graphic);
        sparkleItems.push({
          graphic,
          speed: 0.08 + Math.random() * 0.18,
          drift: -0.14 + Math.random() * 0.28,
        });
      };

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduceMotion) {
        for (let index = 0; index < 26; index += 1) makeSparkle(index);
      }

      const scene: StageScene = {
        app, host: hostElement, background, prevBackground, backgroundTextures,
        characterTextures, characterSprites, baseScales: {}, overlay, sparkleItems,
        fx: { bgFade: 1, charFade: 1, lastBgId: "", lastCharId: null, breathePhase: 0 },
        animated: !reduceMotion,
      };
      sceneRef.current = scene;

      const draw = () => renderScene(scene, latestPropsRef.current);
      // boot 期间背景可能已经被剧情推进换掉，补载最新目标背景。
      ensureBackground(sceneRef, latestPropsRef, latestPropsRef.current.backgroundId);
      draw();
      hostElement.classList.remove("pixi-stage-fallback");
      const resizeObserver = new ResizeObserver(draw);
      resizeObserver.observe(hostElement);

      const tick = (ticker: Ticker) => {
        const width = Math.max(1, hostElement.clientWidth);
        const height = Math.max(1, hostElement.clientHeight);
        const props = latestPropsRef.current;
        const weather = weatherFor(scene.fx.lastBgId);

        sparkleItems.forEach((item, index) => {
          if (!item.graphic.visible) return;
          item.graphic.y -= item.speed * weather.speedScale * ticker.deltaTime;
          item.graphic.x += item.drift * ticker.deltaTime;
          item.graphic.rotation += 0.012 * ticker.deltaTime;
          item.graphic.alpha = (0.32 + Math.sin(performance.now() / 760 + index) * 0.2) * weather.alphaScale;
          if (item.graphic.y < -20) {
            item.graphic.y = height + 20;
            item.graphic.x = 30 + Math.random() * Math.max(1, width - 60);
          }
        });

        // 背景交叉淡入：旧背景淡出，淡完隐藏。
        if (scene.fx.bgFade < 1) {
          scene.fx.bgFade = Math.min(1, scene.fx.bgFade + 0.045 * ticker.deltaTime);
          prevBackground.alpha = 1 - scene.fx.bgFade;
          if (scene.fx.bgFade >= 1) prevBackground.visible = false;
        }

        // 立绘淡入 + 呼吸动画：正弦微缩放，幅度小到不喧宾夺主。
        if (scene.fx.charFade < 1) {
          scene.fx.charFade = Math.min(1, scene.fx.charFade + 0.08 * ticker.deltaTime);
        }
        scene.fx.breathePhase += 0.018 * ticker.deltaTime;
        const activeSprite = scene.characterSprites[props.activeCharacter.id];
        const baseScale = scene.baseScales[props.activeCharacter.id];
        if (activeSprite && activeSprite.visible && baseScale) {
          activeSprite.alpha = scene.fx.charFade;
          const breathe = 1 + Math.sin(scene.fx.breathePhase) * 0.004;
          activeSprite.scale.set(baseScale, baseScale * breathe);
        }
      };

      if (!reduceMotion) app.ticker.add(tick);

      return () => {
        resizeObserver.disconnect();
        if (!reduceMotion) app.ticker.remove(tick);
      };
    }

    let cleanup: (() => void) | undefined;
    void boot().then((result) => {
      cleanup = result;
    });

    return () => {
      disposed = true;
      cleanup?.();
      sceneRef.current = null;
      if (initialized) {
        safelyDestroy(app);
      }
      hostElement.classList.add("pixi-stage-fallback");
      hostElement.replaceChildren();
    };
  }, []);

  return <div className="pixi-stage" ref={hostRef} aria-hidden="true" />;
}

function safelyDestroy(app: Application) {
  try {
    app.destroy(true);
  } catch {
    // Pixi can throw during dev-server HMR if a renderer plugin is already torn down.
  }
}
