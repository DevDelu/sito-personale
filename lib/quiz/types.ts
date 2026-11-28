export type QuizQuestionPublic = {
  id: number;
  category: string;
  question: string;
  options: string[];
};

export type QuizAnswerInput = {
  questionId: number;
  selectedIndex: number | null;
};

export type QuizAnswerResult = {
  questionId: number;
  correctIndex: number;
  selectedIndex: number | null;
  correct: boolean;
  explain: string;
};

export type QuizSubmitResponse = {
  score: number;
  total: number;
  timeMs: number;
  saved: boolean;
  rank: number | null;
  results: QuizAnswerResult[];
};

export type LeaderboardRow = {
  rank: number;
  nickname: string;
  score: number;
  time_taken_ms: number;
};

// Domande di una partita: ne escono tante e il punteggio si calcola solo su altrettante risposte.
export const DOMANDE_PER_PARTITA = 5;
