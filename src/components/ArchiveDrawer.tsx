import { lazy, Suspense, useState } from "react";
import { CHARACTERS } from "../game/content";
import type { GameSession } from "../app/useGameController";
import { EndingPanel } from "./EndingPanel";
import { OfficeHubPanel, RebirthArchiveSection } from "./RebirthPanel";

const loadTimelinePanel = () => import("./RebirthTimelinePanel");
const RebirthTimelinePanel = lazy(() =>
  loadTimelinePanel().then((module) => ({ default: module.RebirthTimelinePanel })),
);

type ArchiveTab = "log" | "archive" | "flow" | "office";

function DialogueHistory({ session }: { session: GameSession }) {
  const nodes = session.scene.nodes.slice(0, session.state.sceneNodeIndex + 1);
  return (
    <section className="archive-section">
      <h3>本话记录</h3>
      <ol className="dialogue-history">
        {nodes.map((node) => (
          <li key={node.id}>
            <span>{node.type === "dialogue" ? node.speaker : "研究选择"}</span>
            <p style={{ whiteSpace: "pre-line" }}>{node.id.endsWith("-competing")
              ? "三位同事围绕同一事实给出基本面、量价和风控三种假设。"
              : node.type === "dialogue" ? node.text : node.decisionPrompt || node.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RelationSummary({ session }: { session: GameSession }) {
  return (
    <section className="archive-section">
      <h3>同事关系</h3>
      <div className="archive-relations">
        {Object.values(CHARACTERS).map((character) => {
          const relation = session.state.relations[character.id] ?? 0;
          return (
            <article className={character.color} key={character.id}>
              <div>
                <strong>{character.name}</strong>
                <span>{character.role}</span>
              </div>
              <b>{relation}</b>
              <i style={{ width: `${Math.max(0, Math.min(100, relation))}%` }} />
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ResearchArchive({ session }: { session: GameSession }) {
  return (
    <>
      <RelationSummary session={session} />
      <section className="archive-section">
        <h3>研究札记</h3>
        {session.state.history.length === 0 ? (
          <p className="archive-empty">完成第一次研究选择后，复盘会留在这里。</p>
        ) : (
          <ul className="archive-history">
            {session.state.history.map((item) => (
              <li key={item.month}>
                <span>{item.label}</span>
                <strong>{item.selected.label}</strong>
                <small>{item.outcome.title}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="archive-section">
        <h3>知识卡</h3>
        {session.state.knowledgeCards.length === 0 ? (
          <p className="archive-empty">有方法的判断会逐渐积成你的工具书。</p>
        ) : (
          <ul className="archive-knowledge">
            {session.state.knowledgeCards.map((card) => (
              <li className={CHARACTERS[card.mentorId].color} key={card.id}>
                <strong>{card.concept}</strong>
                <span>{CHARACTERS[card.mentorId].name}：{card.mentorLine}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <RebirthArchiveSection meta={session.rebirth} />
      <EndingPanel state={session.state} />
    </>
  );
}

function TimelineFallback() {
  return (
    <section className="archive-section archive-lazy-fallback" aria-live="polite">
      <h3>因果回溯</h3>
      <p>正在展开时间线。树很多，浏览器也得先找到树根。</p>
    </section>
  );
}

export function ArchiveDrawer({
  session,
  onClose,
}: {
  session: GameSession;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ArchiveTab>("log");
  return (
    <div className="archive-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        className="archive-drawer"
        aria-label="剧情记录与研究档案"
        aria-modal="true"
        role="dialog"
        onMouseDown={(event: { stopPropagation(): void }) => event.stopPropagation()}
      >
        <header className="archive-drawer-head">
          <div>
            <span>{session.scene.label} · 第 {session.rebirth.cycle} 周目</span>
            <strong>{session.scene.theme.title}</strong>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭档案">×</button>
        </header>
        <div className="archive-tabs" role="tablist">
          <button aria-controls="archive-tabpanel" aria-selected={tab === "log"} className={tab === "log" ? "active" : ""} role="tab" type="button" onClick={() => setTab("log")}>本话记录</button>
          <button aria-controls="archive-tabpanel" aria-selected={tab === "archive"} className={tab === "archive" ? "active" : ""} role="tab" type="button" onClick={() => setTab("archive")}>研究档案</button>
          <button
            aria-controls="archive-tabpanel"
            aria-selected={tab === "flow"}
            className={tab === "flow" ? "active" : ""}
            role="tab"
            type="button"
            onFocus={() => void loadTimelinePanel()}
            onPointerEnter={() => void loadTimelinePanel()}
            onClick={() => setTab("flow")}
          >
            因果回溯
          </button>
          <button aria-controls="archive-tabpanel" aria-selected={tab === "office"} className={tab === "office" ? "active" : ""} role="tab" type="button" onClick={() => setTab("office")}>研究室</button>
        </div>
        <div className="archive-scroll" id="archive-tabpanel" role="tabpanel">
          {tab === "log" ? <DialogueHistory session={session} /> : null}
          {tab === "archive" ? <ResearchArchive session={session} /> : null}
          {tab === "flow" ? (
            <Suspense fallback={<TimelineFallback />}>
              <RebirthTimelinePanel
                meta={session.rebirth}
                state={session.state}
                onFork={session.forkTimelineWithSound}
                onResume={session.resumeTimelineWithSound}
                onSimulate={session.simulateTimeline}
              />
            </Suspense>
          ) : null}
          {tab === "office" ? (
            <OfficeHubPanel
              meta={session.rebirth}
              state={session.state}
              onInspect={session.inspectOfficeWithSound}
            />
          ) : null}
        </div>
      </aside>
    </div>
  );
}
