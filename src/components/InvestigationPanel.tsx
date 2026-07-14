import type { GameState } from "../types";
import {
  currentInvestigation,
  currentInvestigationChapter,
  investigationClues,
  investigationNodeViews,
  isInvestigationActive,
  memorySourceNote,
  type InvestigationNodeId,
  type RebirthMetaState,
} from "../game/rebirth";

export function InvestigationPanel({
  meta,
  state,
  onInvestigate,
}: {
  meta: RebirthMetaState;
  state: GameState;
  onInvestigate: (nodeId: InvestigationNodeId) => void;
}) {
  if (!isInvestigationActive(meta, state)) return null;
  const investigation = currentInvestigation(meta, state);
  const chapter = currentInvestigationChapter(state);
  if (!investigation || !chapter) return null;
  const remaining = Math.max(0, investigation.timeBudget - investigation.timeSpent);
  const nodes = investigationNodeViews(meta, state);
  const clues = investigationClues(meta, state);

  return (
    <section className="rebirth-investigation" aria-label="本月调查网络">
      <header className="rebirth-investigation-head">
        <div>
          <span>第 {meta.cycle} 周目 · {chapter.title}</span>
          <strong>{chapter.thesis}</strong>
        </div>
        <b>{remaining} / {investigation.timeBudget} 时间块</b>
      </header>

      <p className="rebirth-memory-source">{memorySourceNote(meta)}</p>

      {meta.lastCycleUnlocks.length > 0 ? (
        <div className="rebirth-unlocks" aria-label="上一周目解锁">
          <span>上一周目带回</span>
          <ul>
            {meta.lastCycleUnlocks.map((unlock) => <li key={unlock}>{unlock}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="rebirth-node-grid">
        {nodes.map((node) => {
          const disabled = node.completed || Boolean(node.lockedReason);
          return (
            <button
              className={`rebirth-node ${node.completed ? "completed" : ""}`}
              disabled={disabled}
              key={node.id}
              title={node.lockedReason ?? undefined}
              type="button"
              onClick={() => onInvestigate(node.id)}
            >
              <span>{node.completed ? node.reliabilityLabel : `${node.cost} 时间`}</span>
              <strong>{node.label}</strong>
              <p>{node.summary}</p>
              {node.shortcutLabel ? <small>捷径生效：{node.shortcutLabel}</small> : null}
              {node.lockedReason ? <small>{node.lockedReason}</small> : null}
              {node.completed ? <small>线索：{node.clue}</small> : null}
            </button>
          );
        })}
      </div>

      <div className="rebirth-clues">
        <span>当前证据板</span>
        {clues.length === 0 ? (
          <p>还没有。直接提交也可以，只是未来记忆会继续替你把中间步骤含糊过去。</p>
        ) : (
          <ul>
            {clues.map((clue) => (
              <li className={`reliability-${clue.reliability}`} key={clue.id}>
                <small>{clue.reliabilityLabel}</small>
                <strong>{clue.label}</strong>
                <span>{clue.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
