"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export function Toast({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);
  const [uscendo, setUscendo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setUscendo(true), 2700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!uscendo) return;
    const timer = setTimeout(() => setVisible(false), 300);
    return () => clearTimeout(timer);
  }, [uscendo]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        className={`flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg transition-all duration-300 ease-out ${
          uscendo ? "-translate-y-3 opacity-0" : "animate-slide-up opacity-100"
        }`}
      >
        <CheckCircle2 className="h-4 w-4 text-entrata" />
        {message}
      </div>
    </div>
  );
}
