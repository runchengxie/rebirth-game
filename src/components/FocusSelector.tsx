import { FOCUS_ACTIONS } from "../game/content";
import { focusPresentation } from "../game/focusContext";
import type { GameState, MarketTheme } from "../types";

export function FocusSelector({
  state,
  theme,
  monthIndex,
  onSelect,
}: {
  state: GameState;
  theme: MarketTheme;
  monthIndex: number;
  onSelect: (focusId: string) => void;
}) {
  return (
    <div className="focus-grid" aria-label="本话日程">
      {FOCUS_ACTIONS.map((focus) => {
        const presentation = focusPresentation(focus, theme, monthIndex);
        return (
          <button
            key={focus.id}
            className={`focus-card ${state.focusId === focus.id ? "active" : ""}`}
            aria-pressed={state.focusId === focus.id}
            disabled={state.locked}
            type="button"
            onClick={() => onSelect(focus.id)}
          >
            <span className="focus-icon">{focus.icon}</span>
            <strong>{presentation.label}</strong>
            <small>{presentation.short}</small>
            <p>{presentation.detail}</p>
          </button>
        );
      })}
    </div>
  );
}
