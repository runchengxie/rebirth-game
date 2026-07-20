import { useEffect, useRef } from "react";
import { Application, Assets, Container, Graphics, Sprite, type Texture, type Ticker } from "pixi.js";
import bgBriefingRoom from "../../assets/vn/backgrounds/briefing-room.webp";
import bgNightCafe from "../../assets/vn/backgrounds/night-cafe.webp";
import bgResearchRoom from "../../assets/vn/backgrounds/research-room.webp";
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
import type { CharacterId, CharacterProfile } from "../types";

interface PixiStageProps {
  activeCharacter: CharacterProfile;
  backgroundId?: string;
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
  lastBgId: string;
  lastCharId: CharacterId | null;
  breathePhase: number;
}

// 每个背景一套天气粒子参数：夜晚咖啡馆星光最盛，研究室是缓慢的浮尘，
// 会议室几乎干净。visibleCount 控制粒子数，speed/alpha 控制气质。
interface WeatherStyle {
  visibleCount: number;
  speedScale: number;
  alphaScale: number;
}

const WEATHER_BY_BACKGROUND: Record<string, WeatherStyle> = {
  "night-cafe": { visibleCount: 26, speedScale: 1, alphaScale: 1 },
  "research-room": { visibleCount: 14, speedScale: 0.45, alphaScale: 0.6 },
  "briefing-room": { visibleCount: 6, speedScale: 0.35, alphaScale: 0.4 },
};

const DEFAULT_WEATHER: WeatherStyle = { visibleCount: 14, speedScale: 0.5, alphaScale: 0.6 };

interface StageScene {
  app: Application;
  host: HTMLDivElement;
  background: Sprite;
  prevBackground: Sprite;
  backgroundTextures: Record<string, Texture>;
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
  backgroundId: string;
  activePose: string;
}

const backgroundAssets: Record<string, string> = {
  "research-room": bgResearchRoom,
  "briefing-room": bgBriefingRoom,
  "night-cafe": bgNightCafe,
};

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

function layoutCover(sprite: Sprite, texture: Texture, width: number, height: number): void {
  const scale = Math.max(width / texture.width, height / texture.height);
  sprite.width = texture.width * scale;
  sprite.height = texture.height * scale;
  sprite.x = (width - sprite.width) / 2;
  sprite.y = (height - sprite.height) / 2;
}

function renderScene(scene: StageScene, props: StagePropsSnapshot): void {
  const width = Math.max(1, scene.host.clientWidth);
  const height = Math.max(1, scene.host.clientHeight);
  const tint = routeTint[props.activeCharacter.color];
  const resolvedBgId = scene.backgroundTextures[props.backgroundId] ? props.backgroundId : "research-room";
  const backgroundTexture = scene.backgroundTextures[resolvedBgId];

  scene.app.renderer.resize(width, height);

  // 背景切换：把旧纹理放到 prevBackground 上，重置交叉淡入进度。
  if (scene.fx.lastBgId !== resolvedBgId) {
    if (scene.fx.lastBgId && scene.animated) {
      scene.prevBackground.texture = scene.backgroundTextures[scene.fx.lastBgId] || backgroundTexture;
      scene.prevBackground.visible = true;
      scene.fx.bgFade = 0;
    }
    scene.fx.lastBgId = resolvedBgId;
  }
  scene.background.texture = backgroundTexture;
  layoutCover(scene.background, backgroundTexture, width, height);
  if (scene.prevBackground.visible) {
    layoutCover(scene.prevBackground, scene.prevBackground.texture, width, height);
  }

  scene.overlay.clear();
  scene.overlay.rect(0, 0, width, height).fill({ color: 0x140a1b, alpha: 0.12 });
  scene.overlay.rect(0, height * 0.6, width, height * 0.4).fill({ color: tint, alpha: 0.14 });

  // 立绘切换：新角色上台时重置淡入进度。
  if (scene.fx.lastCharId !== props.activeCharacter.id) {
    if (scene.animated) scene.fx.charFade = 0;
    scene.fx.lastCharId = props.activeCharacter.id;
  }

  const compactStage = width < 700 || (width < 1024 && height < 560);
  const targetHeight = Math.min(height * 0.92, compactStage ? width * 1.38 : width * 0.52);
  const bottom = compactStage ? height - Math.min(26, height * 0.045) : height + Math.min(26, height * 0.05);
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

  const weather = WEATHER_BY_BACKGROUND[resolvedBgId] ?? DEFAULT_WEATHER;
  scene.sparkleItems.forEach((item, index) => {
    item.graphic.tint = tint;
    item.graphic.visible = index < weather.visibleCount;
  });
}

export function PixiStage({ activeCharacter, backgroundId = "research-room", activePose = "neutral" }: PixiStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<StageScene | null>(null);
  const latestPropsRef = useRef<StagePropsSnapshot>({ activeCharacter, backgroundId, activePose });

  useEffect(() => {
    latestPropsRef.current = { activeCharacter, backgroundId, activePose };
    const scene = sceneRef.current;
    if (scene) renderScene(scene, latestPropsRef.current);
  }, [activeCharacter, activePose, backgroundId]);

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

      let backgroundTextures: Record<string, Texture>;
      let characterTextures: Partial<Record<CharacterId, Record<string, Texture>>>;
      try {
        [backgroundTextures, characterTextures] = await Promise.all([
          loadTextureMap(backgroundAssets),
          loadCharacterTextureMap(),
        ]);
      } catch {
        return;
      }
      if (disposed) return;

      const background = new Sprite(backgroundTextures["research-room"]);
      const prevBackground = new Sprite(backgroundTextures["research-room"]);
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
      draw();
      hostElement.classList.remove("pixi-stage-fallback");
      const resizeObserver = new ResizeObserver(draw);
      resizeObserver.observe(hostElement);

      const tick = (ticker: Ticker) => {
        const width = Math.max(1, hostElement.clientWidth);
        const height = Math.max(1, hostElement.clientHeight);
        const props = latestPropsRef.current;
        const weather = WEATHER_BY_BACKGROUND[scene.fx.lastBgId] ?? DEFAULT_WEATHER;

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
