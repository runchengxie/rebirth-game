import {
  continueGameUrl,
  hasStoredGame,
  newGameUrl,
  platformModeUrl,
} from "../game/platformModes";
import keyArt from "../../assets/key-art.webp";

interface MenuCardProps {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  tone?: "primary" | "romance" | "career";
}

function MenuCard({
  eyebrow,
  title,
  description,
  href,
  tone,
}: MenuCardProps) {
  return (
    <a className={`start-menu-card${tone ? ` is-${tone}` : ""}`} href={href}>
      <span>{eyebrow}</span>
      <strong>{title}</strong>
      <p>{description}</p>
      <b aria-hidden="true">进入 →</b>
    </a>
  );
}

function startMenuContinueUrl(): string | null {
  try {
    return hasStoredGame(window.localStorage)
      ? continueGameUrl(window.localStorage)
      : null;
  } catch {
    return null;
  }
}

export function StartMenu() {
  const continueHref = startMenuContinueUrl();

  return (
    <main className="start-menu" aria-labelledby="start-menu-title">
      <header className="start-menu-hero">
        <div className="start-menu-hero-copy">
          <div className="start-menu-kicker">
            <span>重生投研部</span>
            <small>RESEARCH · ROMANCE · REBIRTH</small>
          </div>
          <h1 id="start-menu-title">心动 K 线</h1>
          <p>
            十二个月，一次重来。选择你想体验的故事浓度，或直接走进会议室接受市场拷问。
          </p>
          {continueHref ? (
            <a className="start-menu-continue" href={continueHref}>
              <span>
                <small>读取浏览器中的最新进度</small>
                <strong>继续游戏</strong>
              </span>
              <b aria-hidden="true">继续 →</b>
            </a>
          ) : (
            <div className="start-menu-continue is-empty" role="status">
              <span>
                <small>当前浏览器还没有本地进度</small>
                <strong>请在下方选择新游戏模式</strong>
              </span>
              <b aria-hidden="true">NEW</b>
            </div>
          )}
        </div>
        <div className="start-menu-hero-art" aria-hidden="true">
          <img
            alt=""
            decoding="async"
            draggable={false}
            fetchPriority="high"
            height="810"
            loading="eager"
            src={keyArt}
            width="1440"
          />
        </div>
      </header>

      <section className="start-menu-section" aria-labelledby="new-game-heading">
        <div className="start-menu-section-heading">
          <span>NEW GAME</span>
          <h2 id="new-game-heading">开始新游戏</h2>
        </div>
        <div className="start-menu-grid start-menu-experiences">
          <MenuCard
            description="更轻的研究流程，把选择留给关系、对白和心动时刻。"
            eyebrow="我就想谈恋爱"
            href={newGameUrl("romance")}
            title="剧情模式"
            tone="romance"
          />
          <MenuCard
            description="保留调查、研究承诺、证据校验与职业结局的完整压力。"
            eyebrow="女人只会影响我拔剑速度"
            href={newGameUrl("career")}
            title="职业模式"
            tone="career"
          />
        </div>
      </section>

      <section className="start-menu-section" aria-labelledby="challenge-heading">
        <div className="start-menu-section-heading">
          <span>CHALLENGE HUB</span>
          <h2 id="challenge-heading">挑战中心</h2>
        </div>
        <div className="start-menu-grid start-menu-secondary-grid">
          <MenuCard
            description="脱离年度剧情，用有限证据完成一次独立答辩。"
            eyebrow="独立案例"
            href={platformModeUrl("committee")}
            title="投委会"
          />
          <MenuCard
            description="每天一题，在相同信息条件下检验你的判断。"
            eyebrow="全员同题"
            href={platformModeUrl("daily")}
            title="每日挑战"
          />
        </div>
      </section>

      <section className="start-menu-section" aria-labelledby="create-heading">
        <div className="start-menu-section-heading">
          <span>CREATE &amp; EXTEND</span>
          <h2 id="create-heading">创作与扩展</h2>
        </div>
        <div className="start-menu-grid start-menu-utility-grid">
          <MenuCard
            description="编写、校验并预览可以分享的投委会案例。"
            eyebrow="案例编辑器"
            href={platformModeUrl("studio")}
            title="内容工坊"
          />
          <div className="start-menu-settings" role="note">
            <span>LOCAL FIRST</span>
            <strong>设置与存档</strong>
            <p>主题、音效、存档导入导出与云同步入口位于剧情内的设置菜单。</p>
            <small>游戏进度默认保存在当前浏览器。</small>
          </div>
        </div>
      </section>

      <footer className="start-menu-footer">
        <span>选择一种节奏，不必一次弄懂全部系统。</span>
        <small>重生投研部 · 本地优先</small>
      </footer>
    </main>
  );
}
