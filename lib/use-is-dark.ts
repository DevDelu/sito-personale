"use client";

import { useEffect, useState } from "react";

export function useIsDark() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.getAttribute("data-theme") === "dark";
  });

  useEffect(() => {
    const target = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(target.getAttribute("data-theme") === "dark");
    });
    observer.observe(target, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
