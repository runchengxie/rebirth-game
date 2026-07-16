import { lazy, Suspense, useState } from "react";
import { ImmersiveGameScreen } from "./app/ImmersiveGameScreen";
import { useGameSessionMachine } from "./app/useGameSessionMachine";
import {
  canUsePixiStage,
  useGameAudio,
  useSettingsMenu,
  useThemeControl,
} from "./app/useGameController";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { BackToMenu } from "./components/BackToMenu";
import {
  appDestinationFromSearch,
  type AppDestination,
  type PlatformMode,
} from "./game/platformModes";
import "./start-menu.css";

const StartMenu = lazy(() =>
  import("./components/StartMenu").then((module) => ({ default: module.StartMenu })),
);

const Chapter1Spike = lazy(() =>
  import("./spike/pixivn/Chapter1Spike").then((module) => ({
    default: module.Chapter1Spike,
  })),
);

async function loadPlatformChrome(): Promise<void> {
  await import("./platform.css");
  await import("./platform-polish.css");
  await import("./platform-theme.css");
}

const CommitteeMode = lazy(async () => {
  const modulePromise = import("./modes/CommitteeMode");
  await loadPlatformChrome();
  const module = await modulePromise;
  return { default: module.CommitteeMode };
});

const DailyChallengeMode = lazy(async () => {
  const modulePromise = import("./modes/DailyChallengeMode");
  await loadPlatformChrome();
  const module = await modulePromise;
  return { default: module.DailyChallengeMode };
});

const ContentStudioMode = lazy(async () => {
  const modulePromise = import("./modes/ContentStudioMode");
  await loadPlatformChrome();
  const module = await modulePromise;
  return { default: module.ContentStudioMode };
});

const INTERACTIVE_TARGETS = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "[contenteditable='true']",
].join(",");

function focusMainContent(): void {
  const target = document.getElementById("main-content");
  if (!target) return;
  window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}#main-content`);
  window.requestAnimationFrame(() => target.focus());
}

function StoryMode() {
  const audio = useGameAudio();
  const session = useGameSessionMachine(audio);
  const settings = useSettingsMenu();
  const themeControl = useThemeControl();
  const [usePixiStage] = useState(canUsePixiStage);
  const [usePixivnSpike] = useState(
    () => new URLSearchParams(window.location.search).get("pixivn") === "1",
  );

  if (usePixivnSpike) {
    return (
      <Suspense
        fallback={(
          <main className="platform-screen platform-loading" role="status">
            <strong>正在加载 Pixi'VN 第一话原型</strong>
          </main>
        )}
      >
        <Chapter1Spike
          state={session.state}
          onDecision={session.makeDecisionWithSound}
          onFocus={session.selectFocusWithSound}
        />
      </Suspense>
    );
  }

  return (
    <ImmersiveGameScreen
      audio={audio}
      session={session}
      settingsOpen={settings.settingsOpen}
      settingsRef={settings.settingsRef}
      setSettingsOpen={settings.setSettingsOpen}
      themeControl={themeControl}
      usePixiStage={usePixiStage}
    />
  );
}

function ModeContent({ mode }: { mode: PlatformMode }) {
  if (mode === "committee") return <CommitteeMode />;
  if (mode === "daily") return <DailyChallengeMode />;
  if (mode === "studio") return <ContentStudioMode />;
  return <StoryMode />;
}

function DestinationContent({ destination }: { destination: AppDestination }) {
  if (destination === "menu") return <StartMenu />;
  return <ModeContent mode={destination} />;
}

export default function App() {
  const [destination] = useState(
    () => appDestinationFromSearch(window.location.search),
  );
  return (
    <div
      className={`app-shell mode-${destination}`}
      data-platform-mode={destination}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const target = event.target;
        if (target instanceof HTMLElement && target.closest(INTERACTIVE_TARGETS)) {
          event.stopPropagation();
        }
      }}
    >
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          focusMainContent();
        }}
      >
        跳到主要内容
      </a>
      {destination === "menu" ? null : <BackToMenu />}
      <div className="app-main-focus-target" id="main-content" tabIndex={-1}>
        <AppErrorBoundary>
          <Suspense
            fallback={(
              <main
                aria-busy="true"
                aria-live="polite"
                className="platform-screen platform-loading"
                role="status"
              >
                <strong>正在加载研究平台</strong>
                <p>浏览器在整理档案、会议室和人类制造的各种流程。</p>
              </main>
            )}
          >
            <DestinationContent destination={destination} />
          </Suspense>
        </AppErrorBoundary>
      </div>
    </div>
  );
}
