"use client";

import { useEffect, useRef } from "react";

type ThemePreference = "system" | "light" | "dark";
const storageKey = "chromaforge-theme";

function readPreference(): ThemePreference {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

function applyPreference(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.dataset.theme = preference;
  }
}

export function ThemeControl() {
  const selectRef = useRef<HTMLSelectElement>(null);
  const userChangedPreference = useRef(false);

  useEffect(() => {
    if (userChangedPreference.current) return;
    const savedPreference = readPreference();
    if (selectRef.current) selectRef.current.value = savedPreference;
    applyPreference(savedPreference);
  }, []);

  function updatePreference(value: string): void {
    if (value !== "system" && value !== "light" && value !== "dark") return;
    userChangedPreference.current = true;
    applyPreference(value);
    try {
      if (value === "system") {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, value);
      }
    } catch {
      // The theme still applies for this session when storage is unavailable.
    }
  }

  return (
    <div className="theme-control">
      <label htmlFor="theme-preference">Theme</label>
      <select
        ref={selectRef}
        id="theme-preference"
        defaultValue="system"
        onChange={(event) => updatePreference(event.currentTarget.value)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
