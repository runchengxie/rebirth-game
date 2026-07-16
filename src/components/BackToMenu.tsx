import { appDestinationUrl } from "../game/platformModes";

export function BackToMenu() {
  return (
    <nav className="back-to-menu-bar" aria-label="主菜单导航">
      <a className="back-to-menu" href={appDestinationUrl("menu")}>
        <span aria-hidden="true">←</span>
        <span>主菜单</span>
      </a>
    </nav>
  );
}
