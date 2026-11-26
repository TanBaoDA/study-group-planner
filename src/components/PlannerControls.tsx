import { useEffect, useState } from "react";
import {
  SLOT_MINUTES,
  durationDescription,
  durationError,
  parseClockTime,
  timeLabel,
} from "../planner";
import { Icon } from "./Icons";

type DurationStepperProps = {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  onValidityChange: (valid: boolean) => void;
};

export function DurationStepper({
  id = "duration",
  value,
  onChange,
  onValidityChange,
}: DurationStepperProps) {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(String(value));
    setError(null);
    onValidityChange(true);
  }, [value, onValidityChange]);

  const commit = () => {
    const message = durationError(draft);
    setError(message);
    onValidityChange(!message);
    if (message) return false;
    onChange(Number(draft));
    setDraft(String(Number(draft)));
    return true;
  };

  const adjust = (change: number) => {
    const message = durationError(draft);
    if (message) {
      setError(message);
      onValidityChange(false);
      return;
    }
    const next = Number(draft) + change;
    if (next < SLOT_MINUTES || next > 1440) return;
    setDraft(String(next));
    setError(null);
    onValidityChange(true);
    onChange(next);
  };

  const validDraft = durationError(draft) === null;
  return (
    <div className={`duration-control ${error ? "has-error" : ""}`}>
      <div className="duration-stepper">
        <button
          type="button"
          className="stepper-button"
          aria-label="Decrease duration by 15 minutes"
          disabled={validDraft && Number(draft) === SLOT_MINUTES}
          onClick={() => adjust(-SLOT_MINUTES)}
        >
          <Icon name="minus" size={21} />
        </button>
        <div className="duration-value">
          <input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            role="spinbutton"
            aria-valuemin={SLOT_MINUTES}
            aria-valuemax={1440}
            aria-valuenow={validDraft ? Number(draft) : undefined}
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
              if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                adjust(e.key === "ArrowUp" ? SLOT_MINUTES : -SLOT_MINUTES);
              }
            }}
          />
          <span>minutes</span>
        </div>
        <button
          type="button"
          className="stepper-button stepper-add"
          aria-label="Increase duration by 15 minutes"
          disabled={validDraft && Number(draft) === 1440}
          onClick={() => adjust(SLOT_MINUTES)}
        >
          <Icon name="plus" size={21} />
        </button>
      </div>
      <p id={`${id}-hint`} className="duration-hint">
        <Icon name="clock" size={16} />
        {validDraft ? durationDescription(Number(draft)) : "15–1440 minutes, in 15-minute steps"}
      </p>
      {error && (
        <p id={`${id}-error`} className="control-error" role="alert">
          <Icon name="alert" size={16} />
          <span>{error} Your previous duration is unchanged.</span>
        </p>
      )}
    </div>
  );
}

export function ClockTimeField({
  id,
  label,
  value,
  onChange,
  onValidityChange,
  disabled = false,
  allowEndOfDay = false,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  onValidityChange: (valid: boolean) => void;
  disabled?: boolean;
  allowEndOfDay?: boolean;
}) {
  const [draft, setDraft] = useState(timeLabel(value));
  const [error, setError] = useState(false);
  useEffect(() => {
    setDraft(timeLabel(value));
    setError(false);
    onValidityChange(true);
  }, [value, disabled, onValidityChange]);

  const commit = () => {
    const minutes = parseClockTime(draft, allowEndOfDay);
    setError(minutes === null);
    onValidityChange(minutes !== null);
    if (minutes !== null) {
      onChange(minutes);
      setDraft(timeLabel(minutes));
    }
  };
  return (
    <div className={`clock-field ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="clock-input">
        <Icon name="clock" size={19} />
        <input
          id={id}
          aria-label={`Survey window ${label.toLowerCase()}`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={draft}
          disabled={disabled}
          aria-invalid={error}
          aria-describedby={error ? `${id}-error` : "survey-time-hint"}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(false);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="control-error" role="alert">
          Use 24-hour time in 15-minute steps{allowEndOfDay ? ", up to 24:00" : ", before 24:00"}.
        </p>
      )}
    </div>
  );
}
