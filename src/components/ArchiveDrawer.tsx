import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { CHARACTERS } from "../game/content";
import type { GameSession } from "../app/useGameController";
import { EndingPanel } from "./EndingPanel";
import { OfficeHubPanel, RebirthArchiveSection } from "./RebirthPanel";

const loadTimelinePanel = () => import("./RebirthTimelinePanel");
const RebirthTimelinePanel = lazy(() =>
  loadTimelinePanel().then((module) => ({ default: module.RebirthTimelinePanel })),
);

type ArchiveTab = "log" | "archive" | "flow" | "office";

const ARCHIVE_TABS: ArchiveTab[] = ["log", "archive", "flow", "office"];
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableElements(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
    .filter((element) => !element.hasAttribute("hidden"));
}

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
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const elements = focusableElements(dialog);
      if (elements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, []);

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const currentIndex = ARCHIVE_TABS.indexOf(tab);
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextTab = ARCHIVE_TABS[(currentIndex + delta + ARCHIVE_TABS.length) % ARCHIVE_TABS.length];
    event.preventDefault();
    setTab(nextTab);
    document.getElementById(`archive-tab-${nextTab}`)?.focus();
  };

  return (
    <div className="archive-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        aria-labelledby="archive-dialog-title"
        aria-modal="true"
        className="archive-drawer"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="archive-drawer-head">
          <div>
            <span>{session.scene.label} · 第 {session.rebirth.cycle} 周目</span>
            <strong id="archive-dialog-title">{session.scene.theme.title}</strong>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="关闭档案">×</button>
        </header>
        <div className="archive-tabs" role="tablist" onKeyDown={handleTabKeyDown}>
          <button id="archive-tab-log" aria-controls="archive-tabpanel" aria-selected={tab === "log"} className={tab === "log" ? "active" : ""} role="tab" tabIndex={tab === "log" ? 0 : -1} type="button" onClick={() => setTab("log")}>本话记录</button>
          <button id="archive-tab-archive" aria-controls="archive-tabpanel" aria-selected={tab === "archive"} className={tab === "archive" ? "active" : ""} role="tab" tabIndex={tab === "archive" ? 0 : -1} type="button" onClick={() => setTab("archive")}>研究档案</button>
          <button
            id="archive-tab-flow"
            aria-controls="archive-tabpanel"
            aria-selected={tab === "flow"}
            className={tab === "flow" ? "active" : ""}
            role="tab"
            tabIndex={tab === "flow" ? 0 : -1}
            type="button"
            onFocus={() => void loadTimelinePanel()}
            onPointerEnter={() => void loadTimelinePanel()}
            onClick={() => setTab("flow")}
          >
            因果回溯
          </button>
          <button id="archive-tab-office" aria-controls="archive-tabpanel" aria-selected={tab === "office"} className={tab === "office" ? "active" : ""} role="tab" tabIndex={tab === "office" ? 0 : -1} type="button" onClick={() => setTab("office")}>研究室</button>
        </div>
        <div
          aria-labelledby={`archive-tab-${tab}`}
          className="archive-scroll"
          id="archive-tabpanel"
          role="tabpanel"
          tabIndex={0}
        >
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
