"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useHydrated } from "@/lib/use-client-state";

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

/**
 * Three states, not a toggle. The old header button flipped between light and
 * dark, which meant "system" was reachable only until the first click and never
 * again — even though it is the default in ThemeProvider.
 */
export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="grid grid-cols-3 gap-1.5 rounded-xl border border-line bg-surface-muted p-1.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        // Before mount there is no resolved choice to highlight; rendering none
        // avoids flashing the wrong one.
        const active = hydrated && theme === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={`flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg text-[13px] font-semibold transition-[background-color,color] duration-200 ${
              active
                ? "bg-surface text-foreground shadow-card"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
