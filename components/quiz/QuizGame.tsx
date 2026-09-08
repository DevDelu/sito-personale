"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NicknameForm } from "./NicknameForm";
import { Leaderboard } from "./Leaderboard";
import type { LeaderboardRow, QuizAnswerInput, QuizQuestionPublic, QuizSubmitResponse } from "@/lib/quiz/types";

const DURATA_DOMANDA_MS = 15000;
const PENDING_SUBMIT_KEY = "quiz-pending-submit";

type Feedback = { correct: boolean; correctIndex: number; explain: string };
type Phase = "checking" | "nickname" | "loading" | "playing" | "submitting" | "result" | "leaderboard";
type PendingSubmit = { answers: QuizAnswerInput[]; timeMs: number };

function formatTempo(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function avviaLoginGoogle(redirectSearch: string) {
  const supabase = createClient();
  const gameUrl = `${window.location.origin}${window.location.pathname}${redirectSearch}#quiz`;
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(gameUrl)}`,
    },
  });
}

export function QuizGame({ mode, onClose }: { mode: "guest" | "google"; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>(mode === "google" ? "checking" : "nickname");
  const [nickname, setNickname] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionPublic[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswerInput[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [remainingMs, setRemainingMs] = useState(DURATA_DOMANDA_MS);
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const answeringRef = useRef(false);

  // Setup per mode="google": riprende un punteggio lasciato in sospeso
  // (partita fatta da ospite, poi login per salvarla) oppure verifica se il
  // profilo ha già un nickname prima di iniziare una nuova partita.
  useEffect(() => {
    if (mode !== "google") return;
    let cancelled = false;

    async function setup() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setError("Accesso con Google non riuscito. Riprova.");
        return;
      }

      const pendingRaw = sessionStorage.getItem(PENDING_SUBMIT_KEY);
      if (pendingRaw) {
        sessionStorage.removeItem(PENDING_SUBMIT_KEY);
        try {
          const pending: PendingSubmit = JSON.parse(pendingRaw);
          const res = await fetch("/api/quiz/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pending),
          });
          if (!res.ok) throw new Error();
          const data: QuizSubmitResponse = await res.json();
          if (!cancelled) {
            setAnswers(pending.answers);
            setResult(data);
            setPhase("result");
          }
          return;
        } catch {
          // Payload corrotto o richiesta fallita: si passa a una nuova partita.
        }
      }

      const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle();
      if (cancelled) return;
      if (profile?.nickname) {
        setNickname(profile.nickname);
        setPhase("loading");
      } else {
        setPhase("nickname");
      }
    }

    setup();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Carica le 5 domande quando si entra in fase "loading" (nickname pronto).
  useEffect(() => {
    if (phase !== "loading") return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/quiz/questions");
        if (!res.ok) throw new Error();
        const data: { questions: QuizQuestionPublic[] } = await res.json();
        if (cancelled) return;
        setQuestions(data.questions);
        setAnswers([]);
        setIndex(0);
        setSelected(null);
        setFeedback(null);
        setRemainingMs(DURATA_DOMANDA_MS);
        startedAtRef.current = Date.now();
        answeringRef.current = false;
        setPhase("playing");
      } catch {
        if (!cancelled) setError("Impossibile caricare le domande. Riprova tra poco.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [phase]);

  // Countdown 15s a domanda: si ferma appena arriva una risposta (selezione
  // o timeout, che conta come risposta nulla).
  useEffect(() => {
    if (phase !== "playing" || feedback) return;
    if (remainingMs <= 0) {
      handleAnswer(null);
      return;
    }
    const id = setTimeout(() => setRemainingMs((v) => Math.max(0, v - 100)), 100);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, feedback, remainingMs]);

  async function handleAnswer(selectedIndex: number | null) {
    if (answeringRef.current) return;
    answeringRef.current = true;
    setSelected(selectedIndex);

    const question = questions[index];
    const nextAnswers = [...answers, { questionId: question.id, selectedIndex }];
    setAnswers(nextAnswers);

    try {
      const res = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, selectedIndex }),
      });
      const data: Feedback = await res.json();
      setFeedback(data);
      if (data.correct) {
        setTimeout(() => advance(nextAnswers), 900);
      }
    } catch {
      setFeedback({ correct: false, correctIndex: -1, explain: "Impossibile verificare la risposta." });
    }
  }

  function advance(currentAnswers: QuizAnswerInput[]) {
    answeringRef.current = false;
    if (index + 1 >= questions.length) {
      finish(currentAnswers);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setFeedback(null);
    setRemainingMs(DURATA_DOMANDA_MS);
  }

  async function finish(finalAnswers: QuizAnswerInput[]) {
    setPhase("submitting");
    const timeMs = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers, timeMs }),
      });
      if (!res.ok) throw new Error();
      const data: QuizSubmitResponse = await res.json();
      setResult(data);
    } catch {
      setError("Impossibile calcolare il punteggio finale.");
    }
    setPhase("result");
  }

  async function handleGuestNickname(value: string): Promise<string | null> {
    setNickname(value);
    setPhase("loading");
    return null;
  }

  async function handleGoogleNickname(value: string): Promise<string | null> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "Sessione scaduta, ricarica la pagina.";

    const { error: insertError } = await supabase.from("profiles").insert({ id: user.id, nickname: value });
    if (insertError) {
      if (insertError.code === "23505") return "Nickname già in uso, scegline un altro.";
      return "Impossibile salvare il nickname, riprova.";
    }
    setNickname(value);
    setPhase("loading");
    return null;
  }

  async function handleSaveAfterGuest() {
    const timeMs = startedAtRef.current ? Date.now() - startedAtRef.current : (result?.timeMs ?? 0);
    sessionStorage.setItem(PENDING_SUBMIT_KEY, JSON.stringify({ answers, timeMs } satisfies PendingSubmit));
    await avviaLoginGoogle("?quiz=google");
  }

  function handleReplay() {
    setResult(null);
    setLeaderboard(null);
    setError(null);
    setPhase("loading");
  }

  async function handleShowLeaderboard() {
    setPhase("leaderboard");
    if (leaderboard) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("quiz_leaderboard")
      .select("rank, nickname, score, time_taken_ms")
      .order("rank", { ascending: true })
      .limit(50);
    setLeaderboard(data ?? []);
  }

  const question = questions[index];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Quiz AI">
      <div className="modal-panel flex w-full max-w-md flex-col gap-5 p-6">
        <button type="button" onClick={onClose} className="btn-icon self-end" aria-label="Chiudi">
          <X className="h-4 w-4" />
        </button>

        {error && (
          <p className="text-sm text-spesa" role="alert">
            {error}
          </p>
        )}

        {!error && (phase === "checking" || phase === "loading" || phase === "submitting") && (
          <div className="flex flex-col items-center gap-3 py-10 text-sm text-muted">
            <span className="h-8 w-8 animate-pulse rounded-full bg-accent/30" aria-hidden="true" />
            {phase === "submitting" ? "Calcolo il punteggio..." : "Un attimo..."}
          </div>
        )}

        {!error && phase === "nickname" && (
          <NicknameForm
            title={mode === "google" ? "Come vuoi essere chiamato in classifica?" : "Come ti chiami?"}
            helper={
              mode === "google"
                ? "Solo la prima volta: da qui in poi comparirà così in classifica."
                : "Vale solo per questa partita, non viene salvato."
            }
            onSubmit={mode === "google" ? handleGoogleNickname : handleGuestNickname}
          />
        )}

        {!error && phase === "playing" && question && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-mono uppercase tracking-wide">{question.category}</span>
              <span className="font-figures">
                {index + 1}/{questions.length}
              </span>
            </div>

            <TimerBar remainingMs={remainingMs} />

            <p className="font-display text-lg font-semibold leading-snug">{question.question}</p>

            <div className="flex flex-col gap-2">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={!!feedback}
                  onClick={() => handleAnswer(i)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-150 ${optionClass(
                    i,
                    selected,
                    feedback
                  )}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {feedback && !feedback.correct && (
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-hover p-4">
                <p className="text-sm text-muted">{feedback.explain}</p>
                <button type="button" onClick={() => advance(answers)} className="btn-primary self-end">
                  Avanti
                </button>
              </div>
            )}
          </div>
        )}

        {!error && phase === "result" && result && (
          <ResultView
            result={result}
            mode={mode}
            onReplay={handleReplay}
            onShowLeaderboard={handleShowLeaderboard}
            onSaveAfterGuest={handleSaveAfterGuest}
            onClose={onClose}
          />
        )}

        {!error && phase === "leaderboard" && (
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-lg font-semibold">Classifica</h3>
            {leaderboard ? (
              <Leaderboard rows={leaderboard} ownNickname={nickname} />
            ) : (
              <p className="text-sm text-muted">Caricamento...</p>
            )}
            <button type="button" onClick={onClose} className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
              ← Torna al sito
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function optionClass(i: number, selected: number | null, feedback: Feedback | null): string {
  if (feedback) {
    if (i === feedback.correctIndex) return "border-entrata bg-entrata/10 text-entrata";
    if (i === selected) return "border-spesa bg-spesa/10 text-spesa";
    return "border-border opacity-60";
  }
  if (selected === i) return "border-accent bg-accent/10";
  return "border-border hover:border-accent/40 hover:bg-surface-hover";
}

// Barra "energia" che si scarica in 15s, colore che vira verso un tono più
// caldo quando il tempo sta per scadere (sotto il 40% resta la stessa
// famiglia di colore, sfumata verso un rosso di allerta).
function TimerBar({ remainingMs }: { remainingMs: number }) {
  const fraction = Math.max(0, remainingMs / DURATA_DOMANDA_MS);
  const color =
    fraction > 0.4 ? "var(--accent)" : `color-mix(in srgb, var(--accent) ${20 + fraction * 150}%, #dc2626)`;

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
      <div
        className="h-full rounded-full"
        style={{ width: `${fraction * 100}%`, backgroundColor: color, transition: "width 100ms linear, background-color 300ms ease" }}
      />
    </div>
  );
}

function ResultView({
  result,
  mode,
  onReplay,
  onShowLeaderboard,
  onSaveAfterGuest,
  onClose,
}: {
  result: QuizSubmitResponse;
  mode: "guest" | "google";
  onReplay: () => void;
  onShowLeaderboard: () => void;
  onSaveAfterGuest: () => void;
  onClose: () => void;
}) {
  const percent = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  const messaggio =
    percent === 100
      ? "Perfetto! Conosci l'AI a menadito."
      : percent >= 60
        ? "Bel risultato, ci sei quasi."
        : "Non male per iniziare, riprova per migliorare.";

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-figures text-2xl font-bold">
            {result.score}/{result.total}
          </span>
          <span className="text-xs text-muted">{percent}%</span>
        </div>
      </div>

      <p className="font-display text-lg font-semibold">{messaggio}</p>
      <p className="font-figures text-sm text-muted">Tempo: {formatTempo(result.timeMs)}</p>

      {mode === "guest" ? (
        <button type="button" onClick={onSaveAfterGuest} className="btn-primary w-full">
          Accedi con Google per salvare questo punteggio
        </button>
      ) : (
        <p className="text-sm text-entrata">
          {result.saved ? "Punteggio salvato, sei in classifica." : "Il punteggio precedente resta migliore, non è stato sostituito."}
          {result.rank != null ? ` (posizione #${result.rank})` : ""}
        </p>
      )}

      <div className="flex w-full gap-2">
        <button type="button" onClick={onReplay} className="btn-secondary flex-1">
          Rigioca
        </button>
        <button type="button" onClick={onShowLeaderboard} className="btn-secondary flex-1">
          Vedi classifica
        </button>
      </div>
      <button type="button" onClick={onClose} className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
        ← Torna al sito
      </button>
    </div>
  );
}
