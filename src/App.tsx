import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { GAME_DATA, GAME_YEARS } from "./data/gameData";
import { ProceduralBgm } from "./audio/bgm";
import { NarrativeAudio } from "./audio/sfx";
import { CHARACTERS } from "./game/content";
import {
  advanceScene,
  canAdvanceScene,
  chooseOption,
  compactDate,
  createInitialState,
  currentSceneNode,
  focusById,
  formatPct,
  gradeReviewText,
  postMortem,
  sceneForMonth,
  selectFocus,
  storyForMonth,
} from "./game/engine";
import type { CharacterId, GameState, HistoricalEvent, ResearchBrief, RoundResult, StockOption } from "./types";
import { CapitalChart } from "./components/CapitalChart";
import { EndingPanel } from "./components/EndingPanel";
import { FocusSelector } from "./components/FocusSelector";
import { HistoryPanel } from "./components/HistoryPanel";
import { OptionCard } from "./components/OptionCard";
import { StatusBar } from "./components/StatusBar";

const PixiStage = lazy(() =>
  import("./components/PixiStage").then((module) => ({ default: module.PixiStage })),
);

function canUsePixiStage(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get("pixi") === "0" || params.get("staticStage") === "1") return false;
  if (params.get("pixi") === "1") return true;

  try {
    const canvas = document.createElement("canvas");
    const contextOptions: WebGLContextAttributes = {
      antialias: false,
      failIfMajorPerformanceCaveat: true,
      powerPreference: "low-power",
    };
    const gl = canvas.getContext("webgl2", contextOptions) ?? canvas.getContext("webgl", contextOptions);
    if (!gl) return false;

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info") as {
      UNMASKED_RENDERER_WEBGL: number;
      UNMASKED_VENDOR_WEBGL: number;
    } | null;
    const renderer = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : "";
    const vendor = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();

    return !`${vendor} ${renderer}`.toLowerCase().includes("nouveau");
  } catch {
    return false;
  }
}

function StaticStageArt() {
  return <div className="pixi-stage pixi-stage-fallback" aria-hidden="true" />;
}

function readTheme(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function bestInitialYear() {
  return GAME_YEARS[GAME_YEARS.length - 1] || "2025";
}

function createState(year = bestInitialYear()): GameState {
  return createInitialState(year, GAME_DATA[year]);
}

function ResearchBriefPanel({
  title,
  briefs,
}: {
  title: string;
  briefs: ResearchBrief[];
}) {
  if (briefs.length === 0) return null;
  return (
    <div className="research-briefs" aria-label="实战线索">
      <div className="research-briefs-head">
        <span>实战线索</span>
        <strong>{title}</strong>
      </div>
      <div className="research-brief-grid">
        {briefs.map((brief) => {
          const character = CHARACTERS[brief.characterId];
          return (
            <div className={`research-brief ${character.color}`} key={`${brief.characterId}-${brief.label}`}>
              <span>{character.name}</span>
              <strong>{brief.label}</strong>
              <p>{brief.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoricalEventPanel({ event }: { event: HistoricalEvent }) {
  return (
    <div className="historical-event" aria-label="历史金融事件">
      <div className="historical-event-head">
        <span>历史事件</span>
        <strong>{event.period}</strong>
      </div>
      <h3>{event.title}</h3>
      <p>{event.publicContext}</p>
      <dl>
        <div>
          <dt>男主内心</dt>
          <dd>{event.protagonistMemory}</dd>
        </div>
        <div>
          <dt>实战入口</dt>
          <dd>{event.gameHook}</dd>
        </div>
      </dl>
    </div>
  );
}

function StoryRecapPanel({ result }: { result: RoundResult | undefined }) {
  if (!result) return null;
  const character = CHARACTERS[result.characterId];
  const gradeReview = result.score ? gradeReviewText(result.characterId, result.score.grade) : "";
  const pm = postMortem(result.selected, result.best, result.label);

  return (
    <div className={`story-recap ${character.color}`} aria-label="角色复盘">
      <span>{character.name}的复盘</span>
      <p>{gradeReview}</p>
      <p className="story-recap-detail">{pm}</p>
    </div>
  );
}

function ScorePanel({ result }: { result: RoundResult | undefined }) {
  if (!result || !result.score) return null;
  const { score } = result;
  const bars: Array<{ label: string; value: number; max: number; className: string }> = [
    { label: "收益分", value: score.returnScore, max: 40, className: "score-return" },
    { label: "逻辑分", value: score.logicScore, max: 20, className: "score-logic" },
    { label: "风险分", value: score.riskScore, max: 15, className: "score-risk" },
    { label: "纪律分", value: score.disciplineScore, max: 10, className: "score-discipline" },
    { label: "角色分", value: score.characterScore, max: 15, className: "score-character" },
  ];

  const gradeColors: Record<string, string> = {
    S: "#ffd700",
    A: "#ff6b6b",
    B: "#4ecdc4",
    C: "#95a5a6",
    D: "#7f8c8d",
  };

  return (
    <div className="score-panel" aria-label="月度评分">
      <div className="score-head">
        <span>月度评分</span>
        <strong style={{ color: gradeColors[score.grade] || "#fff" }}>{score.grade}</strong>
        <span>{score.total}/100</span>
      </div>
      <div className="score-bars">
        {bars.map((bar) => (
          <div className={`score-bar ${bar.className}`} key={bar.label}>
            <div className="score-bar-head">
              <span>{bar.label}</span>
              <strong>
                {bar.value}/{bar.max}
              </strong>
            </div>
            <div className="score-bar-track">
              <i style={{ width: `${(bar.value / bar.max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CharacterRoutes({
  state,
  activeId,
}: {
  state: GameState;
  activeId: CharacterId;
}) {
  return (
    <div className="character-routes" aria-label="角色路线">
      {Object.values(CHARACTERS).map((character) => {
        const affection = state.affection[character.id];
        return (
          <div
            className={`character-card ${character.color} ${character.id === activeId ? "active" : ""}`}
            key={character.id}
          >
            <div className="character-avatar" aria-hidden="true">
              {character.name.slice(0, 1)}
            </div>
            <div className="character-copy">
              <div className="character-head">
                <strong>{character.name}</strong>
                <span>{character.role}</span>
              </div>
              <p>{character.intro}</p>
              <div className="mini-meter">
                <span>{character.tag}</span>
                <b>{affection}/100</b>
                <i style={{ width: `${Math.max(0, Math.min(100, affection))}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Meter({ label, value, className }: { label: string; value: number; className: string }) {
  const normalized = Math.max(0, Math.min(100, value));
  const displayValue = className === "ambition" ? `${normalized.toFixed(2)}%` : Math.round(normalized);
  return (
    <div className={`meter ${className}`}>
      <div className="meter-head">
        <span>{label}</span>
        <strong>{displayValue}</strong>
      </div>
      <div className="meter-track">
        <i style={{ width: `${normalized}%` }} />
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(readTheme());
  const [musicOn, setMusicOn] = useState(false);
  const [volume, setVolume] = useState(0.22);
  const [soundOn, setSoundOn] = useState(false);
  const [soundVolume, setSoundVolume] = useState(0.18);
  const [usePixiStage] = useState(canUsePixiStage);
  const bgmRef = useRef<ProceduralBgm | null>(null);
  const audioRef = useRef<NarrativeAudio | null>(null);
  const lastLineVoiceRef = useRef("");
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [initialCapitalInput, setInitialCapitalInput] = useState(() => String(GAME_DATA[bestInitialYear()].initialCapital || 10000));
  const [state, setState] = useState<GameState>(() => createState());
  const data = GAME_DATA[state.year];
  const month = data.months[state.monthIndex];
  const story = storyForMonth(state.monthIndex, state.year);
  const scene = sceneForMonth(state.monthIndex, state.year);
  const sceneNode = currentSceneNode(state);
  const stockRoundNode = sceneNode.type === "stockRound" ? sceneNode : null;
  const isStockRound = Boolean(stockRoundNode);
  const lineCharacterId = sceneNode.type === "line" ? sceneNode.characterId : story.characterId;
  const activeCharacter = CHARACTERS[lineCharacterId];
  const sceneBackground = sceneNode.type === "line" ? sceneNode.bg || "research-room" : stockRoundNode?.bg || "briefing-room";
  const scenePose = sceneNode.type === "line" ? sceneNode.pose || "neutral" : "thinking";
  const last = state.history[state.history.length - 1];
  const activeFocus = focusById(state.focusId);
  const sceneCanAdvance = canAdvanceScene(state);
  const sceneProgress = `${Math.min(state.sceneNodeIndex + 1, scene.nodes.length)}/${scene.nodes.length}`;
  const isLastSceneNode = state.sceneNodeIndex >= scene.nodes.length - 1;

  const speakerName = state.locked && isStockRound && last ? story.speaker : sceneNode.type === "line" ? sceneNode.speaker : story.speaker;
  const speakerRole = state.locked && isStockRound && last ? story.role : sceneNode.type === "line" ? sceneNode.role : story.role;
  const sceneMood = sceneNode.type === "line" ? sceneNode.mood : story.mood;
  const resultText = isStockRound
    ? state.locked && last
      ? last.outcome.title
      : "选择实战卡"
    : state.locked && last
      ? "结算后剧情"
      : "剧情推进中";
  const resultDetail = isStockRound
    ? state.locked && last
      ? `${last.outcome.detail} 本月参考路线为 ${month.best.name} ${formatPct(month.best.returnRate)}。`
      : `${compactDate(month.marketStart)} 至 ${compactDate(month.marketEnd)}，候选池 ${month.candidateCount} 只。`
    : state.locked && last
      ? `${last.outcome.title} · 剧情节点 ${sceneProgress}，${isLastSceneNode ? "继续后会进入下一话。" : "继续后会推进结算后剧情。"}`
      : `${story.event.title} · 剧情节点 ${sceneProgress}，继续后会进入本月实战会。`;
  const dialogue = stockRoundNode
    ? state.locked && last
      ? last.outcome.dialogue
      : "四张实战卡已经摆在桌上。先安排本话日程，再选出你要负责的路线。"
    : sceneNode.type === "line"
      ? sceneNode.text
      : "";
  const prompt = stockRoundNode
    ? state.locked
      ? "结算完成，点击继续剧情。"
      : stockRoundNode?.prompt || story.mission
    : sceneNode.prompt || "点击继续剧情。";
  const advanceLabel =
    isStockRound && !state.locked
      ? "先选择实战卡"
      : state.finished && isLastSceneNode
        ? "开启新周目"
        : state.locked && isLastSceneNode
          ? "下一话"
        : isStockRound && state.locked
          ? "继续剧情"
          : "继续";

  const topOptions = useMemo(() => month.options, [month]);

  useEffect(() => {
    if (!bgmRef.current) {
      bgmRef.current = new ProceduralBgm();
    }
    bgmRef.current.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new NarrativeAudio();
    }
    audioRef.current.setVolume(soundVolume);
  }, [soundVolume]);

  useEffect(() => {
    return () => {
      bgmRef.current?.stop();
      audioRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && !settingsRef.current?.contains(target)) {
        setSettingsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen]);

  function restart(year = state.year) {
    const parsedCapital = Number(initialCapitalInput);
    lastLineVoiceRef.current = "";
    setState(createInitialState(year, GAME_DATA[year], Number.isFinite(parsedCapital) ? parsedCapital : undefined));
  }

  function changeYear(year: string) {
    lastLineVoiceRef.current = "";
    setState(createInitialState(year, GAME_DATA[year], Number(initialCapitalInput) || undefined));
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("rebirthGameTheme", next);
    } catch {
      // Local storage can be unavailable in strict privacy modes.
    }
  }

  async function toggleMusic() {
    const controller = bgmRef.current || new ProceduralBgm();
    bgmRef.current = controller;
    if (musicOn) {
      controller.stop();
      setMusicOn(false);
      return;
    }
    await controller.start();
    controller.setVolume(volume);
    setMusicOn(true);
  }

  async function toggleSound() {
    const controller = audioRef.current || new NarrativeAudio();
    audioRef.current = controller;
    if (soundOn) {
      controller.stop();
      lastLineVoiceRef.current = "";
      setSoundOn(false);
      return;
    }
    await controller.start();
    controller.setVolume(soundVolume);
    lastLineVoiceRef.current = "";
    controller.playPreview();
    setSoundOn(true);
  }

  const lineVoiceKey =
    sceneNode.type === "line" && sceneNode.voice && sceneNode.voiceCue !== "silent"
      ? `${state.year}-${state.monthIndex}-${state.sceneNodeIndex}-${sceneNode.voice}`
      : "";

  useEffect(() => {
    if (!soundOn || !lineVoiceKey) return;
    if (lastLineVoiceRef.current === lineVoiceKey) return;
    lastLineVoiceRef.current = lineVoiceKey;
    if (sceneNode.type === "line") {
      audioRef.current?.playVoiceLine(sceneNode);
    }
  }, [lineVoiceKey, sceneNode, soundOn]);

  function advanceCurrentScene() {
    if (!sceneCanAdvance) return;
    if (soundOn) {
      audioRef.current?.playAdvance();
    }
    setState((current) => advanceScene(current, data));
  }

  function selectFocusWithSound(focusId: string) {
    if (soundOn) {
      audioRef.current?.playChoice();
    }
    setState((current) => selectFocus(current, focusId));
  }

  function chooseOptionWithSound(selected: StockOption) {
    if (soundOn) {
      audioRef.current?.playChoice();
      window.setTimeout(() => {
        audioRef.current?.playResult(selected.isBest ? "success" : "miss");
      }, 130);
    }
    setState((current) => chooseOption(current, data, selected));
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
              <span className="brand-kicker">重生投研部 · 金融事件故事 · 实战小游戏</span>
          <h1>心动 K 线：重生投研部</h1>
          <p>你回到年初投研部工位，和三位研究员一起用真实行情、日程安排和研究判断改写新周目。</p>
        </div>
        <div className="top-actions" ref={settingsRef}>
          <button
            className={`menu-button ${settingsOpen ? "active" : ""}`}
            type="button"
            title="打开设置"
            aria-controls="settingsMenu"
            aria-expanded={settingsOpen}
            aria-label="打开设置"
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
          <div className={`settings-menu ${settingsOpen ? "open" : ""}`} id="settingsMenu">
            <div className="settings-menu-head">
              <strong>游戏设置</strong>
              <span>{state.year} 线</span>
            </div>
            <div className="controls">
              <div className="segmented" aria-label="年份">
                {GAME_YEARS.map((year) => (
                  <button className={year === state.year ? "active" : ""} key={year} type="button" onClick={() => changeYear(year)}>
                    {year}线
                  </button>
                ))}
              </div>
              <label className="money-input">
                小金库
                <input
                  min="100"
                  step="100"
                  type="number"
                  value={initialCapitalInput}
                  onChange={(event) => setInitialCapitalInput(event.target.value)}
                  onBlur={() => restart(state.year)}
                />
              </label>
              <button className="icon-button theme-button" type="button" title="切换主题" aria-label="切换主题" onClick={toggleTheme}>
                {theme === "dark" ? "☀" : "☾"}
              </button>
              <button className="icon-button" type="button" title="切换背景音乐" aria-label="切换背景音乐" onClick={() => void toggleMusic()}>
                {musicOn ? "♪" : "♩"}
              </button>
              <button className="icon-button" type="button" title="切换音效" aria-label="切换音效" onClick={() => void toggleSound()}>
                {soundOn ? "音" : "静"}
              </button>
              <label className="volume-input" title="背景音乐音量">
                音量
                <input
                  max="0.7"
                  min="0"
                  step="0.01"
                  type="range"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                />
              </label>
              <label className="volume-input" title="音效音量">
                音效
                <input
                  max="0.45"
                  min="0"
                  step="0.01"
                  type="range"
                  value={soundVolume}
                  onChange={(event) => setSoundVolume(Number(event.target.value))}
                />
              </label>
              <button className="icon-button" type="button" title="重新开始" aria-label="重新开始" onClick={() => restart(state.year)}>
                ↻
              </button>
            </div>
          </div>
        </div>
      </header>

      <StatusBar state={state} />

      <section className={`vn-stage character-${activeCharacter.color}`} aria-label="剧情舞台">
        {usePixiStage ? (
          <Suspense fallback={<StaticStageArt />}>
            <PixiStage activeCharacter={activeCharacter} activePose={scenePose} backgroundId={sceneBackground} />
          </Suspense>
        ) : (
          <StaticStageArt />
        )}
        <div className="vn-stage-content">
          <div className="moe-badges">
            <span>{activeCharacter.name}路线</span>
            <span>好感 {state.affection[activeCharacter.id]}</span>
          </div>
          <div className="chapter-card">
            <span>第 {String(state.monthIndex + 1).padStart(2, "0")} 话</span>
            <h2>{scene.title}</h2>
            <p>
              {month.label} · {sceneMood} · 剧情 {sceneProgress} · 当前日程：{activeFocus.label}
            </p>
          </div>
          <div className="dialogue-box">
            <div className="speaker-row">
              <span className="speaker-name">{speakerName}</span>
              <span className="speaker-role">
                {speakerRole} · {activeCharacter.tag}
              </span>
            </div>
            <p>{dialogue}</p>
            <small>{prompt}</small>
            <button
              className="story-next-button"
              disabled={!sceneCanAdvance}
              type="button"
              onClick={advanceCurrentScene}
            >
              {advanceLabel}
            </button>
          </div>
        </div>
      </section>

      <section className="play">
        <div className="question-panel">
          <div className="month-head">
            <div>
              <span className="panel-kicker">主线事件与实战小游戏</span>
              <h2>{month.label} 事件实战</h2>
            </div>
            <div className="dates">
              {compactDate(month.marketStart)} 至 {compactDate(month.marketEnd)}
            </div>
          </div>
          <p className="scene-brief">{isStockRound ? story.mission : "剧情演出中。继续对话后，会进入本月实战小游戏。"}</p>
          <HistoricalEventPanel event={story.event} />
          {isStockRound ? (
            <>
              <ResearchBriefPanel
                briefs={stockRoundNode?.briefs || []}
                title={stockRoundNode?.briefTitle || `${month.label} 实战线索`}
              />
              <FocusSelector state={state} onSelect={selectFocusWithSound} />
              <div className="options">
                {topOptions.map((option, index) => (
                  <OptionCard
                    index={index}
                    key={option.id}
                    option={option}
                    state={state}
                    onChoose={chooseOptionWithSound}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="script-preview">
              <span>剧情节点</span>
              <strong>{scene.title}</strong>
              <p>当前节点 {sceneProgress}。继续完成对白后，本月实战小游戏会开放。</p>
            </div>
          )}
          <div className="result-band">
            <div className="result-copy">
              <strong>{resultText}</strong>
              <span>{resultDetail}</span>
            </div>
            <button
              className="primary-button"
              disabled={!sceneCanAdvance}
              type="button"
              onClick={advanceCurrentScene}
            >
              {advanceLabel}
            </button>
          </div>
          {isStockRound ? <StoryRecapPanel result={state.locked ? last : undefined} /> : null}
          {isStockRound ? <ScorePanel result={state.locked ? last : undefined} /> : null}
        </div>

        <aside className="chart-panel">
          <div className="chart-title">
            <h2>小金库曲线</h2>
            <span>
              {data.year} · {data.months.length}话
            </span>
          </div>
          <div className="route-meters">
            <Meter label="闪耀度" value={state.reputation} className="reputation" />
            <Meter label="疲劳值" value={state.fatigue} className="stress" />
            <Meter label="亿级梦想" value={Math.min(100, (state.capital / data.targetCapital) * 100)} className="ambition" />
          </div>
          <CharacterRoutes activeId={activeCharacter.id} state={state} />
          <CapitalChart state={state} />
          <div className="legend">
            <span>
              <i className="key" /> 我的路线
            </span>
            <span>
              <i className="key best" /> 参考路线
            </span>
          </div>
        </aside>
      </section>

      <EndingPanel state={state} />
      <HistoryPanel history={state.history} />

      <footer className="rules-note" aria-labelledby="rulesTitle">
        <h2 id="rulesTitle">玩法说明</h2>
        <p>
          本页面是静态剧情游戏。主线讲历史金融事件，实战小游戏使用真实 A
          股月度题库结算。日程行动会影响执行修正、角色状态和好感。当前背景音乐和轻音效由浏览器生成，未来关键句可接入离线语音素材。
        </p>
      </footer>
    </main>
  );
}
