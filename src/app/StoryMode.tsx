import { lazy, Suspense, useState } from "react";
import { ImmersiveGameScreen } from "./ImmersiveGameScreen";
import {
  canUsePixiStage,
  useGameAudio,
  useSettingsMenu,
  useThemeControl,
} from "./useGameController";
import { useGameSessionMachine } from "./useGameSessionMachine";

const Chapter1Spike = lazy(() =>
  import("../spike/pixivn/Chapter1Spike").then((module) => ({
    default: module.Chapter1Spike,
  })),
);

export function StoryMode() {
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
