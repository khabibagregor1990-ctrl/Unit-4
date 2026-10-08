import { useState } from "react";
import type { VocabItem } from "@/lib/course";

export function Flashcards({ items }: { items: VocabItem[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown] = useState(0);

  const item = items[index];
  if (!item) return <p className="text-sm text-inksoft">No words yet.</p>;

  function advance(gotIt: boolean) {
    if (gotIt) setKnown((k) => k + 1);
    setRevealed(false);
    setIndex((i) => (i + 1) % items.length);
  }

  return (
    <div className="rounded-2xl bg-branddeep p-5 text-cream">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Flashcards</h3>
        <span className="text-xs text-cream/70">
          Card {index + 1} of {items.length} · {known} known
        </span>
      </div>
      <button
        onClick={() => setRevealed((r) => !r)}
        className="mt-4 w-full rounded-xl bg-cream p-6 text-center text-ink"
      >
        <p className="font-display text-2xl font-semibold">{item.word}</p>
        {revealed ? (
          <div className="animate-pop">
            <p className="mt-2 text-sm text-inksoft">{item.part_of_speech}</p>
            <p className="mt-2 text-sm">{item.meaning}</p>
            {item.example ? (
              <p className="mt-2 text-sm italic text-inksoft">“{item.example}”</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-xs text-inksoft">tap to reveal</p>
        )}
      </button>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => advance(false)}
          className="flex-1 rounded-lg border border-cream/30 py-2 text-sm font-medium"
        >
          Practise again
        </button>
        <button
          onClick={() => advance(true)}
          className="flex-1 rounded-lg bg-amber py-2 text-sm font-semibold text-ink"
        >
          I knew it
        </button>
      </div>
    </div>
  );
}
