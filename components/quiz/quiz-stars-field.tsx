// Stelline decorative sullo sfondo della sezione quiz: invisibili di
// default, compaiono (e ticchettano una diversa dall'altra) solo quando il
// cursore passa sopra la sezione — l'effetto "wow" in più oltre al pop-in
// della card al primo scroll. Puramente CSS (group-hover + keyframe
// twinkle), nessun JS/mousemove: posizioni e ritardi sono fissi così il
// markup resta identico server/client, niente hydration mismatch.
const STARS = [
  { left: "8%", top: "20%", size: 3, delay: "0s" },
  { left: "18%", top: "62%", size: 2, delay: "0.3s" },
  { left: "27%", top: "12%", size: 2, delay: "0.9s" },
  { left: "34%", top: "80%", size: 3, delay: "0.15s" },
  { left: "42%", top: "35%", size: 2, delay: "1.1s" },
  { left: "51%", top: "70%", size: 2, delay: "0.5s" },
  { left: "58%", top: "18%", size: 3, delay: "0.8s" },
  { left: "65%", top: "48%", size: 2, delay: "0.2s" },
  { left: "72%", top: "85%", size: 2, delay: "1.3s" },
  { left: "79%", top: "28%", size: 3, delay: "0.6s" },
  { left: "86%", top: "60%", size: 2, delay: "1s" },
  { left: "92%", top: "15%", size: 2, delay: "0.4s" },
  { left: "14%", top: "90%", size: 2, delay: "0.7s" },
  { left: "60%", top: "5%", size: 2, delay: "1.2s" },
];

export function QuizStarsField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {STARS.map((star, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-accent opacity-0 shadow-[0_0_6px_1px] shadow-accent/70 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
          }}
        />
      ))}
    </div>
  );
}
