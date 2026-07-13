import { FOCUS_ACTIONS } from "../game/content";
import type { GameState } from "../types";

export function FocusSelector({
  state,
  onSelect,
}: {
  state: GameState;
  onSelect: (focusId: string) => void;
}) {
  return (
    <div className="focus-grid" aria-label="本话日程">
      {FOCUS_ACTIONS.map((focus) => (
        <button
          key={focus.id}
          className={`focus-card ${state.focusId === focus.id ? "active" : ""}`}
          aria-pressed={state.focusId === focus.id}
          disabled={state.locked}
          type="button"
          onClick={() => onSelect(focus.id)}
        >
          <span className="focus-icon">{focus.icon}</span>
          <strong>{focus.label}</strong>
          <small>{focus.short}</small>
          <p>{focus.detail}</p>
        </button>
      ))}
    </div>
  );
}
