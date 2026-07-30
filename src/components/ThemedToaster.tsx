"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

/**
 * Sonner defaults to the light skin and otherwise follows the OS, which
 * disagrees with a manual theme choice. Feed it the resolved theme instead.
 */
export default function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      richColors
      position="top-center"
      offset={72}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
    />
  );
}
