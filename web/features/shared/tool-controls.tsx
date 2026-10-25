import type { ReactNode } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export function readFiniteNumber(value: string, label: string): number {
  if (value.trim() === "") throw new Error(`${label} is required.`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a finite number.`);
  return parsed;
}

export function SelectField({ id, label, value, options, onChange, hint }: {
  id: string;
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="tool-field" htmlFor={id}>
      <span>{label}{hint ? <small>{hint}</small> : null}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export function NumberField({ id, label, value, onChange, min, max, step = "any", hint, disabled }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className="tool-field" htmlFor={id}>
      <span>{label}{hint ? <small>{hint}</small> : null}</span>
      <input id={id} type="number" inputMode="decimal" value={value} min={min} max={max} step={step} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function TextField({ id, label, value, onChange, hint, maxLength }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  maxLength?: number;
}) {
  return (
    <label className="tool-field" htmlFor={id}>
      <span>{label}{hint ? <small>{hint}</small> : null}</span>
      <input id={id} type="text" autoComplete="off" value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="tool-actions">{children}</div>;
}

export function SubmitButton({ children, variant = "primary" }: { children: ReactNode; variant?: "primary" | "quiet" }) {
  return <button className={`tool-button tool-button--${variant}`} type="submit">{children}</button>;
}
