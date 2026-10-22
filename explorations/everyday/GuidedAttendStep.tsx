import React, { useState } from "react";
import type { PAnswer, PStep } from "../../lib/innerRep/pilots/types";

/** Presentation draft only. No answer reaches the unchanged session until Continue. */
export function GuidedAttendStep({
  step,
  send,
  onBack,
  pullLabel,
}: {
  step: PStep;
  send: (answer: PAnswer) => void;
  onBack: () => void;
  pullLabel?: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [choice, setChoice] = useState<string | null>(null);
  const [mode, setMode] = useState<"options" | "none" | "unknown">("options");
  if (step.type === "words")
    return <p role="alert">This step is not supported in this preview.</p>;
  if (step.type === "hold")
    return (
      <div className="guided-step" data-kind="hold" data-step={step.id}>
        <p className="guided-hint">
          No timer. End the pause whenever you choose.
        </p>
        <div className="guided-actions">
          <button
            className="choice solid guided-commit"
            type="button"
            onClick={() => send({ stepId: step.id, kind: "hold_end" })}
          >
            {step.endLabel}
          </button>
        </div>
      </div>
    );
  const multi = step.type === "multi";
  const ready = multi
    ? mode !== "options" || selected.length > 0
    : choice !== null;
  const picked =
    choice === "__unknown__"
      ? "I don’t know"
      : step.options.find((o) => o.id === choice)?.label;
  const submit = () => {
    if (!ready) return;
    if (multi)
      send(
        mode === "unknown"
          ? { stepId: step.id, kind: "unknown" }
          : {
              stepId: step.id,
              kind: "options",
              optionIds: mode === "none" ? [] : selected,
            },
      );
    else
      send(
        choice === "__unknown__"
          ? { stepId: step.id, kind: "unknown" }
          : { stepId: step.id, kind: "option", optionId: choice! },
      );
  };
  return (
    <div
      className="guided-step"
      data-kind={step.type}
      data-step={step.id}
      data-answer-mode={mode}
    >
      <fieldset className="guided-options">
        <legend>{multi ? "Choose any that fit." : "Choose one."}</legend>
        {step.options.map((o) => {
          const pressed = multi
            ? mode === "options" && selected.includes(o.id)
            : choice === o.id;
          const disabled =
            !!o.disabled ||
            (multi &&
              mode === "options" &&
              selected.length >= step.max &&
              !selected.includes(o.id));
          return (
            <div key={o.id}>
              <button
                className="choice guided-option"
                type="button"
                disabled={disabled}
                aria-pressed={pressed}
                aria-describedby={
                  o.disabled ? `guided-reason-${o.id}` : undefined
                }
                onClick={() => {
                  if (multi) {
                    setMode("options");
                    setSelected((a) =>
                      a.includes(o.id)
                        ? a.filter((id) => id !== o.id)
                        : [...a, o.id],
                    );
                  } else setChoice(o.id);
                }}
              >
                <span
                  className={multi ? "selection-check" : "selection-dot"}
                  aria-hidden="true"
                >
                  {pressed ? "✓" : ""}
                </span>
                <span>{o.label}</span>
              </button>
              {o.disabled && (
                <p
                  className="caption guided-reason"
                  id={`guided-reason-${o.id}`}
                >
                  {o.disabled}
                </p>
              )}
            </div>
          );
        })}
        {multi && (
          <button
            className="choice guided-option"
            type="button"
            aria-pressed={mode === "none"}
            onClick={() => {
              setMode("none");
              setSelected([]);
            }}
          >
            <span className="selection-check" aria-hidden="true">
              {mode === "none" ? "✓" : ""}
            </span>
            <span>{step.noneLabel}</span>
          </button>
        )}
        {step.allowUnknown && (
          <button
            className="choice guided-option"
            type="button"
            aria-pressed={multi ? mode === "unknown" : choice === "__unknown__"}
            onClick={() => {
              if (multi) {
                setMode("unknown");
                setSelected([]);
              } else setChoice("__unknown__");
            }}
          >
            <span
              className={multi ? "selection-check" : "selection-dot"}
              aria-hidden="true"
            >
              {(multi ? mode === "unknown" : choice === "__unknown__")
                ? "✓"
                : ""}
            </span>
            <span>I don’t know</span>
          </button>
        )}
      </fieldset>
      {step.id.startsWith("place:") && picked && (
        <p className="placement-preview" aria-live="polite">
          <span>{pullLabel}</span>
          <span aria-hidden="true">→</span>
          <strong>{picked}</strong>
        </p>
      )}
      {(ready || step.allowBack) && (
        <div className="guided-actions">
          {ready && (
            <>
              <p className="guided-selection" role="status">
                {multi
                  ? mode === "options"
                    ? `${selected.length} chosen · up to ${step.max}`
                    : mode === "none"
                      ? step.noneLabel
                      : "I don’t know"
                  : picked}
              </p>
              <button
                className="choice solid guided-commit"
                type="button"
                onClick={submit}
              >
                Continue
              </button>
            </>
          )}
          {step.allowBack && (
            <button
              className="choice text-button guided-back"
              type="button"
              onClick={onBack}
            >
              Back
            </button>
          )}
        </div>
      )}
    </div>
  );
}
