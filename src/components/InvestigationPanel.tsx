import type { GameState } from "../types";
import {
  currentInvestigation,
  currentInvestigationChapter,
  investigationClues,
  investigationNodeViews,
  isInvestigationActive,
  memorySourceNote,
  type InvestigationNodeId,
  type InvestigationNodeView,
  type RebirthMetaState,
} from "../game/rebirth";

function InvestigationNode({
  node,
  onInvestigate,
}: {
  node: InvestigationNodeView;
  onInvestigate: (nodeId: InvestigationNodeId) => void;
}) {
  const disabled = node.completed || Boolean(node.lockedReason);
  return (
    <button
      className={`rebirth-node ${node.completed ? "completed" : ""}`}
      disabled={disabled}
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
}

function InvestigationNodes({
  nodes,
  onInvestigate,
}: {
  nodes: InvestigationNodeView[];
  onInvestigate: (nodeId: InvestigationNodeId) => void;
}) {
  return (
    <div className="rebirth-node-grid">
      {nodes.map((node) => (
        <InvestigationNode key={node.id} node={node} onInvestigate={onInvestigate} />
      ))}
    </div>
  );
}

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
  const availableNodes = nodes.filter((node) => !node.lockedReason);
  const lockedNodes = nodes.filter((node) => Boolean(node.lockedReason));
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

      <div className="rebirth-unlocks" role="note">
        <span>当前可执行</span>
        <p>先处理眼前能验证的线索。需要前置条件或记忆钥匙的节点已暂时收起。</p>
      </div>
      <InvestigationNodes nodes={availableNodes} onInvestigate={onInvestigate} />

      {lockedNodes.length > 0 ? (
        <details className="rebirth-unlocks rebirth-locked-nodes">
          <summary>查看待解锁节点（{lockedNodes.length}）</summary>
          <InvestigationNodes nodes={lockedNodes} onInvestigate={onInvestigate} />
        </details>
      ) : null}

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
