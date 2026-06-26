"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-9 overflow-hidden text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
      aria-label="Change theme"
    >
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${isDark ? "translate-y-0 opacity-100" : "translate-y-full opacity-100"}`}
      >
        <Sun className="h-5 w-5 text-amber-500" />
      </div>
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${isDark ? "-translate-y-full opacity-100" : "translate-y-0 opacity-100"}`}
      >
        <Moon className="h-5 w-5 text-indigo-500" />
      </div>
    </button>
  );
}
