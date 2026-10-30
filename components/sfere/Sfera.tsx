"use client";

import { useSfere } from "./use-sfere";

// Sfera del drago nascosta: 24px visibili, area di tocco da 44px invisibile.
// Decorativa per i lettori di schermo (l'accessibile è il contatore).
export function Sfera({ n, className = "" }: { n: number; className?: string }) {
  const { raccolte, prendi } = useSfere();
  if (raccolte.includes(n)) return null;
  return (
    <button
      type="button"
      aria-hidden="true"
      tabIndex={-1}
      onClick={() => prendi(n)}
      className={`sfera-drago absolute z-20 flex h-11 w-11 items-center justify-center ${className}`}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" className="opacity-60">
        <defs>
          <radialGradient id={`sfera-${n}`} cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor="#ffd37a" />
            <stop offset="1" stopColor="#e07b00" />
          </radialGradient>
        </defs>
        <circle cx="12" cy="12" r="11" fill={`url(#sfera-${n})`} />
        <g fill="#b3261e">
          {stelle(n).map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.5" />
          ))}
        </g>
      </svg>
    </button>
  );
}

// Disposizione delle stelle (n da 1 a 7) attorno al centro.
function stelle(n: number): Array<[number, number]> {
  const centro: [number, number] = [12, 12];
  const anello: Array<[number, number]> = [0, 1, 2, 3, 4, 5].map((i) => {
    const a = (i * Math.PI) / 3 - Math.PI / 2;
    return [12 + 5 * Math.cos(a), 12 + 5 * Math.sin(a)];
  });
  if (n === 1) return [centro];
  if (n === 7) return [centro, ...anello];
  return anello.slice(0, n);
}
