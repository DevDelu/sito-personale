"use client";

import { useIsDark } from "@/lib/use-is-dark";

export function ThemeToggle() {
  const isDark = useIsDark();

  return (
    <button
      type="button"
      onClick={() => {
        const next = isDark ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("theme", next);
      }}
      aria-label={isDark ? "Attiva tema chiaro" : "Attiva tema scuro"}
      className="group flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-hover hover:shadow-sm active:scale-90"
    >
      {isDark ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4 animate-pop-in transition-transform duration-300 group-hover:rotate-45"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4 animate-pop-in transition-transform duration-300 group-hover:-rotate-12"
        >
          <path d="M20.354 15.354A9 9 0 1 1 8.646 3.646 9.003 9.003 0 0 0 20.354 15.354Z" />
        </svg>
      )}
    </button>
  );
}
