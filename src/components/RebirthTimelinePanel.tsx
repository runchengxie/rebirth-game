import { useMemo, useState } from "react";
import type { GameState } from "../types";
import type { RebirthMetaState } from "../game/rebirth";
import { canForkTimelineAnchor } from "../game/rebirthTimeline";
import {
  simulationProfileViews,
  simulationsForAnchor,
  timelineAnchorDetail,
  timelineBranchViews,
  timelineMonthViews,
  type TimelineBranchView,
} from "../game/rebirthTimelineInsights";
import type { TimelineSimulationProfileId } from "../game/rebirthTimelineState";
import "../timeline.css";

interface RebirthTimelinePanelProps {
  meta: RebirthMetaState;
  state: GameState;
  onFork: (anchorId: string) => void;
  onResume: (branchId: string) => void;
  onSimulate: (anchorId: string, profileId: TimelineSimulationProfileId) => void;
}

function statusLabel(status: "active" | "paused" | "completed"): string {
  if (status === "active") return "正在推进";
  if (status === "paused") return "已暂停";
  return "已完成";
}

function forkLabel(meta: RebirthMetaState, branchId: string): string | null {
  const branch = meta.timeline.branches.find((candidate) => candidate.id === branchId);
  if (!branch?.forkAnchorId) return null;
  const anchor = meta.timeline.anchors.find((candidate) => candidate.id === branch.forkAnchorId);
  return anchor ? `从 ${anchor.monthIndex + 1} 月分叉` : "从旧锚点分叉";
}

function BranchTreeItem({
  meta,
  branch,
  childrenByParent,
  selectedBranchId,
  onSelect,
  onResume,
}: {
  meta: RebirthMetaState;
  branch: TimelineBranchView;
  childrenByParent: Map<string, TimelineBranchView[]>;
  selectedBranchId: string;
  onSelect: (branchId: string) => void;
  onResume: (branchId: string) => void;
}) {
  const children = childrenByParent.get(branch.id) ?? [];
  const source = forkLabel(meta, branch.id);
  return (
    <li className={`timeline-tree-item ${branch.status}`}>
      <article className={branch.id === selectedBranchId ? "selected" : ""}>
        <button type="button" onClick={() => onSelect(branch.id)}>
          <span>第 {branch.cycle} 周目 · {statusLabel(branch.status)}</span>
          <strong>{branch.label}</strong>
          <small>
            {source ? `${source} · ` : ""}完成 {branch.completedMonths}/12 月
            {branch.endingId ? ` · 结局 ${branch.endingId}` : ""}
          </small>
        </button>
        {branch.canResume ? (
          <button className="timeline-resume" type="button" onClick={() => onResume(branch.id)}>
            继续这条线
          </button>
        ) : null}
      </article>
      {children.length > 0 ? (
        <ol>
          {children.map((child) => (
            <BranchTreeItem
              branch={child}
              childrenByParent={childrenByParent}
              key={child.id}
              meta={meta}
              selectedBranchId={selectedBranchId}
              onSelect={onSelect}
              onResume={onResume}
            />
          ))}
        </ol>
      ) : null}
    </li>
  );
}

function BranchTree({
  meta,
  selectedBranchId,
  onSelect,
  onResume,
}: {
  meta: RebirthMetaState;
  selectedBranchId: string;
  onSelect: (branchId: string) => void;
  onResume: (branchId: string) => void;
}) {
  const branches = timelineBranchViews(meta);
  const branchIds = new Set(branches.map((branch) => branch.id));
  const childrenByParent = new Map<string, TimelineBranchView[]>();
  for (const branch of branches) {
    if (!branch.parentBranchId || !branchIds.has(branch.parentBranchId)) continue;
    const siblings = childrenByParent.get(branch.parentBranchId) ?? [];
    siblings.push(branch);
    childrenByParent.set(branch.parentBranchId, siblings);
  }
  const roots = branches.filter((branch) => (
    !branch.parentBranchId || !branchIds.has(branch.parentBranchId)
  ));
  return (
    <div className="timeline-tree" aria-label="时间线树状图">
      <div className="timeline-tree-legend">
        <span><i className="root" /> 主时间线</span>
        <span><i className="fork" /> 回溯分支</span>
        <span><i className="active" /> 当前路线</span>
      </div>
      <ol>
        {roots.map((branch) => (
          <BranchTreeItem
            branch={branch}
            childrenByParent={childrenByParent}
            key={branch.id}
            meta={meta}
            selectedBranchId={selectedBranchId}
            onSelect={onSelect}
            onResume={onResume}
          />
        ))}
      </ol>
    </div>
  );
}

function TimelineMonthGraph({
  meta,
  branchId,
  selectedAnchorId,
  showAllMonths,
  onSelectAnchor,
}: {
  meta: RebirthMetaState;
  branchId: string;
  selectedAnchorId: string | null;
  showAllMonths: boolean;
  onSelectAnchor: (anchorId: string) => void;
}) {
  const months = timelineMonthViews(meta, branchId);
  const visibleMonths = showAllMonths
    ? months
    : months.filter((month) => month.keyMonth || month.status === "current");
  return (
    <ol className="timeline-month-graph">
      {visibleMonths.map((month) => (
        <li className={`${month.status} ${month.keyMonth ? "key-month" : ""}`} key={month.monthKey}>
          <button
            className={month.anchorId === selectedAnchorId ? "selected" : ""}
            disabled={!month.anchorId}
            type="button"
            onClick={() => month.anchorId && onSelectAnchor(month.anchorId)}
          >
            <span>{month.label}</span>
            <strong>{month.title}</strong>
            {month.anchorId ? <b>回溯锚点</b> : null}
            {month.decisionLabel ? <p>{month.decisionLabel}</p> : null}
            {month.investigationProgress ? <small>{month.investigationProgress}</small> : null}
            {month.grade ? <i>评级 {month.grade}</i> : null}
            {month.eventCount > 0 ? <em>{month.eventCount} 项行动</em> : null}
          </button>
        </li>
      ))}
    </ol>
  );
}

function ProjectionGrid({
  projection,
}: {
  projection: {
    researchCredibility: number;
    committeeAdoption: number;
    teamTrust: number;
    fatigue: number;
    lifeBalance: number;
  };
}) {
  return (
    <dl className="timeline-projection-grid">
      <div><dt>研究可信度</dt><dd>{projection.researchCredibility}</dd></div>
      <div><dt>投委会采纳</dt><dd>{projection.committeeAdoption}</dd></div>
      <div><dt>团队信任</dt><dd>{projection.teamTrust}</dd></div>
      <div><dt>疲劳</dt><dd>{projection.fatigue}</dd></div>
      <div><dt>生活平衡</dt><dd>{projection.lifeBalance}</dd></div>
    </dl>
  );
}

function AnchorInspector({
  meta,
  state,
  anchorId,
  onFork,
  onSimulate,
}: {
  meta: RebirthMetaState;
  state: GameState;
  anchorId: string;
  onFork: (anchorId: string) => void;
  onSimulate: (anchorId: string, profileId: TimelineSimulationProfileId) => void;
}) {
  const detail = timelineAnchorDetail(meta, anchorId);
  if (!detail) return null;
  const forkReason = canForkTimelineAnchor(meta, state, anchorId);
  const profiles = simulationProfileViews(meta);
  const simulations = simulationsForAnchor(meta, anchorId);
  return (
    <section className="timeline-anchor-inspector" aria-label="回溯锚点详情">
      <header>
        <div>
          <span>观看模式 · 第 {detail.anchor.cycle} 周目</span>
          <h4>{detail.anchor.label}</h4>
        </div>
        <b>月初快照</b>
      </header>
      <p className="timeline-relation-summary">当时关系：{detail.relationSummary}</p>
      <div className="timeline-annotation-list">
        {detail.annotations.map((annotation) => (
          <article className={`source-${annotation.source}`} key={annotation.id}>
            <span>{annotation.source === "memory" ? "后来获得的理解" : "原时间线记录"}</span>
            <strong>{annotation.label}</strong>
            <p>{annotation.description}</p>
          </article>
        ))}
      </div>

      <div className="timeline-fork-box">
        <div>
          <span>分叉模式</span>
          <strong>从这个月初建立一条新时间线</strong>
          <p>原路线会永久保留。新路线恢复当时状态，但携带当前已经获得的记忆钥匙。</p>
        </div>
        <button disabled={Boolean(forkReason)} type="button" onClick={() => onFork(anchorId)}>
          {forkReason ?? "从这里创建分支"}
        </button>
      </div>

      <div className="timeline-simulation-box">
        <header>
          <span>推演模式</span>
          <strong>比较反事实，不改写当前进度</strong>
        </header>
        <div className="timeline-simulation-actions">
          {profiles.map((profile) => (
            <button
              disabled={Boolean(profile.lockedReason)}
              key={profile.id}
              title={profile.lockedReason ?? undefined}
              type="button"
              onClick={() => onSimulate(anchorId, profile.id)}
            >
              <strong>{profile.label}</strong>
              <span>{profile.lockedReason ?? profile.summary}</span>
            </button>
          ))}
        </div>
        {simulations.length > 0 ? (
          <div className="timeline-simulation-results">
            {simulations.map((simulation) => (
              <article key={simulation.id}>
                <strong>{simulation.label}</strong>
                <p>{simulation.explanation}</p>
                <ProjectionGrid projection={simulation.projection} />
                <small>{simulation.caveat}</small>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function RebirthTimelinePanel({
  meta,
  state,
  onFork,
  onResume,
  onSimulate,
}: RebirthTimelinePanelProps) {
  const branches = timelineBranchViews(meta);
  const defaultBranchId = meta.timeline.activeBranchId ?? branches[0]?.id ?? "";
  const [selectedBranchId, setSelectedBranchId] = useState(defaultBranchId);
  const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);
  const [showAllMonths, setShowAllMonths] = useState(false);

  const resolvedBranchId = branches.some((branch) => branch.id === selectedBranchId)
    ? selectedBranchId
    : defaultBranchId;
  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === resolvedBranchId) ?? null,
    [branches, resolvedBranchId],
  );
  const selectedEvents = meta.timeline.branches
    .find((branch) => branch.id === resolvedBranchId)?.events.slice(-8) ?? [];

  if (branches.length === 0) {
    return (
      <section className="archive-section timeline-rewind">
        <h3>因果回溯</h3>
        <p className="archive-empty">进入关键月份后，系统会保存第一枚月初锚点。</p>
      </section>
    );
  }

  return (
    <section className="archive-section timeline-rewind" aria-label="互动影游式因果回溯">
      <header className="rebirth-section-head">
        <div>
          <h3>因果回溯</h3>
          <p>树干保留原路线，枝条显示从关键月产生的回溯实验。错误不会因为界面变漂亮就消失。</p>
        </div>
        <b>{branches.length} 条时间线</b>
      </header>
      <div className="timeline-mode-strip">
        <span><b>观看</b> 回看快照与因果注释</span>
        <span><b>分叉</b> 恢复月初状态继续游玩</span>
        <span><b>推演</b> 比较可能结果但不改存档</span>
      </div>

      <BranchTree
        meta={meta}
        selectedBranchId={resolvedBranchId}
        onSelect={(branchId) => {
          setSelectedBranchId(branchId);
          setSelectedAnchorId(null);
        }}
        onResume={onResume}
      />

      {selectedBranch ? (
        <>
          <div className="timeline-path-head">
            <div>
              <span>当前查看</span>
              <strong>{selectedBranch.label}</strong>
            </div>
            <button type="button" onClick={() => setShowAllMonths((value) => !value)}>
              {showAllMonths ? "只看关键月" : "显示全部月份"}
            </button>
          </div>
          <TimelineMonthGraph
            meta={meta}
            branchId={selectedBranch.id}
            selectedAnchorId={selectedAnchorId}
            showAllMonths={showAllMonths}
            onSelectAnchor={setSelectedAnchorId}
          />
          {selectedEvents.length > 0 ? (
            <div className="timeline-event-log">
              <strong>最近行动</strong>
              <ol>
                {selectedEvents.map((event) => (
                  <li key={event.id}>
                    <span>{event.monthIndex + 1}月</span>
                    <p>{event.label}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </>
      ) : null}

      {selectedAnchorId ? (
        <AnchorInspector
          meta={meta}
          state={state}
          anchorId={selectedAnchorId}
          onFork={onFork}
          onSimulate={onSimulate}
        />
      ) : (
        <p className="timeline-select-hint">选择带有回溯锚点的关键月份，查看当时状态和后来补出的因果连接。</p>
      )}
    </section>
  );
}
