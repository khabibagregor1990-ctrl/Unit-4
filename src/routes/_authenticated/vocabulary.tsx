import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Flashcards } from "@/components/games/Flashcards";
import { Hangman } from "@/components/games/Hangman";
import { Matching } from "@/components/games/Matching";
import { saveAttempt, useUnits, useVocab } from "@/lib/course";
import shopsScene from "@/assets/quest-shops.jpg";

export const Route = createFileRoute("/_authenticated/vocabulary")({
  head: () => ({
    meta: [
      { title: "Vocabulary practice — Lingua English" },
      {
        name: "description",
        content:
          "Learn and consolidate unit vocabulary with flashcards, matching pairs and hangman.",
      },
      {
        property: "og:title",
        content: "Vocabulary practice — Lingua English",
      },
      {
        property: "og:description",
        content: "Flashcards, matching pairs and hangman for your unit words.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VocabularyPage,
});

function VocabularyPage() {
  const units = useUnits();
  const vocab = useVocab();
  const queryClient = useQueryClient();
  const unitId = units.data?.[0]?.id ?? null;
  const items = vocab.data ?? [];

  async function record(activity: string, score: number, total: number) {
    await saveAttempt({ unitId, activity, score, total });
    toast.success(`${score}/${total} saved`);
    queryClient.invalidateQueries({ queryKey: ["attempts", "mine"] });
  }

  return (
    <>
      <section className="pb-6 pt-8">
        <div className="relative isolate overflow-hidden rounded-lg bg-branddeep">
          <img
            src={shopsScene}
            alt="Shoppers exploring a British high street"
            width={1408}
            height={896}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div className="bg-branddeep/75 px-6 py-8 text-primary-foreground sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber">
              Vocabulary trail
            </p>
            <h1 className="mt-2 font-display text-4xl">Learn the words</h1>
            <p className="mt-3 max-w-md">
              {items.length} words from this unit. Flip the cards, match the meanings, then test
              yourself with hangman.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Flashcards items={items} />
        <Hangman items={items} onFinish={(score, total) => record("hangman", score, total)} />
        <div className="lg:col-span-2">
          <Matching items={items} onFinish={(score, total) => record("matching", score, total)} />
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl font-semibold">Word list</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl bg-sand p-4">
              <p className="font-display text-lg font-semibold">{item.word}</p>
              <p className="text-xs uppercase tracking-wider text-inksoft">{item.part_of_speech}</p>
              <p className="mt-1 text-sm">{item.meaning}</p>
              {item.example ? (
                <p className="mt-1 text-sm italic text-inksoft">“{item.example}”</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
