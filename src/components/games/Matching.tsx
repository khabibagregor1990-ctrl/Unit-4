import { useMemo, useState } from "react";
import type { VocabItem } from "@/lib/course";

function shuffle<T>(list: T[]): T[] {
  return [...list].sort(() => Math.random() - 0.5);
}

export function Matching({
  items,
  onFinish,
}: {
  items: VocabItem[];
  onFinish: (score: number, total: number) => void;
}) {
  const round = useMemo(() => shuffle(items).slice(0, 6), [items]);
  const meanings = useMemo(() => shuffle(round), [round]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);

  function pickMeaning(id: string) {
    if (!selectedWord) return;
    if (selectedWord === id) {
      const next = [...matched, id];
      setMatched(next);
      setSelectedWord(null);
      if (next.length === round.length) {
        onFinish(Math.max(round.length - mistakes, 0), round.length);
      }
    } else {
      setMistakes((m) => m + 1);
      setWrong(id);
      setTimeout(() => setWrong(null), 350);
      setSelectedWord(null);
    }
  }

  if (round.length === 0) return <p className="text-sm text-inksoft">No words yet.</p>;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Matching pairs</h3>
        <span className="text-xs text-inksoft">
          {matched.length}/{round.length} matched · {mistakes} mistakes
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          {round.map((item) => {
            const isMatched = matched.includes(item.id);
            return (
              <button
                key={item.id}
                disabled={isMatched}
                onClick={() => setSelectedWord(item.id)}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                  isMatched
                    ? "bg-sage text-branddeep"
                    : selectedWord === item.id
                      ? "bg-brand text-primary-foreground"
                      : "bg-sand hover:bg-sage"
                }`}
              >
                {item.word}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {meanings.map((item) => {
            const isMatched = matched.includes(item.id);
            return (
              <button
                key={item.id}
                disabled={isMatched}
                onClick={() => pickMeaning(item.id)}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-colors ${
                  isMatched
                    ? "bg-sage text-branddeep"
                    : wrong === item.id
                      ? "animate-nudge bg-rosy/15 text-rosy"
                      : "bg-background ring-1 ring-border hover:bg-sand"
                }`}
              >
                {item.meaning}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
