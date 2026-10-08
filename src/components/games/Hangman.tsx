import { useMemo, useState } from "react";
import type { VocabItem } from "@/lib/course";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
const MAX_LIVES = 6;

export function Hangman({
  items,
  onFinish,
}: {
  items: VocabItem[];
  onFinish: (score: number, total: number) => void;
}) {
  const [round, setRound] = useState(0);
  const [guessed, setGuessed] = useState<string[]>([]);

  const item = useMemo(() => {
    if (items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)] ?? null;
  }, [items, round]);

  if (!item) return <p className="text-sm text-inksoft">No words yet.</p>;

  const word = item.word.toLowerCase();
  const letters = word.split("");
  const wrongGuesses = guessed.filter((g) => !letters.includes(g) && /[a-z]/.test(g));
  const lives = MAX_LIVES - wrongGuesses.length;
  const solved = letters.every((l) => !/[a-z]/.test(l) || guessed.includes(l));
  const lost = lives <= 0;

  function guess(letter: string) {
    if (solved || lost || guessed.includes(letter)) return;
    const next = [...guessed, letter];
    setGuessed(next);
    const wrongCount = next.filter((g) => !letters.includes(g) && /[a-z]/.test(g)).length;
    const nowSolved = letters.every((l) => !/[a-z]/.test(l) || next.includes(l));
    if (nowSolved) onFinish(1, 1);
    else if (wrongCount >= MAX_LIVES) onFinish(0, 1);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Hangman</h3>
        <span className="text-xs font-semibold text-rosy">
          {lives} {lives === 1 ? "life" : "lives"} left
        </span>
      </div>

      <p className="mt-3 text-sm text-inksoft">{item.meaning}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {letters.map((letter, i) => (
          <span
            key={`${letter}-${i}`}
            className={`grid size-9 place-items-center rounded-md text-sm font-semibold ${
              letter === " "
                ? "w-3"
                : guessed.includes(letter) || solved || lost
                  ? "bg-sage text-branddeep"
                  : "bg-sand text-transparent"
            }`}
          >
            {letter === " " ? "" : letter.toUpperCase()}
          </span>
        ))}
      </div>

      {solved || lost ? (
        <div className="mt-4 rounded-lg bg-sand p-3 text-sm">
          <p className="font-semibold">{solved ? "Well done!" : `The word was “${item.word}”.`}</p>
          <button
            onClick={() => {
              setGuessed([]);
              setRound((r) => r + 1);
            }}
            className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            New word
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {ALPHABET.map((letter) => {
            const used = guessed.includes(letter);
            const hit = used && letters.includes(letter);
            return (
              <button
                key={letter}
                disabled={used}
                onClick={() => guess(letter)}
                className={`grid size-9 place-items-center rounded-md text-sm font-medium ${
                  hit
                    ? "bg-sage text-branddeep"
                    : used
                      ? "bg-background text-inksoft/40"
                      : "bg-sand hover:bg-sage"
                }`}
              >
                {letter.toUpperCase()}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
