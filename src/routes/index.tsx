import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lingua — Interactive English lessons for your class" },
      {
        name: "description",
        content:
          "Watch the video, read the text, then practise with multiple choice, true/false, gap-fill, flashcards, matching and hangman.",
      },
      {
        property: "og:title",
        content: "Lingua — Interactive English lessons for your class",
      },
      {
        property: "og:description",
        content:
          "Video, listening, reading and vocabulary practice with instant feedback and teacher progress tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const highlights = [
  {
    title: "Watch & listen",
    body: "Real class videos and audio, with tasks right beside the player.",
  },
  {
    title: "Read & answer",
    body: "Reading texts with multiple choice, true/false and gap-fill questions.",
  },
  {
    title: "Learn the words",
    body: "Flashcards, matching pairs and hangman to consolidate vocabulary.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-brand font-display text-lg font-semibold text-primary-foreground">
              L
            </div>
            <div className="leading-tight">
              <p className="font-display text-lg font-semibold">Lingua</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-inksoft">
                English File · Pre-Intermediate
              </p>
            </div>
          </div>
          <Link
            to="/auth"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid gap-10 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              Unit 4 · Shops &amp; the Weekend
            </p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] md:text-5xl">
              Your lessons, turned into practice students actually finish.
            </h1>
            <p className="mt-4 max-w-md text-inksoft">
              Videos, listening and reading from your coursebook, each with instant-feedback tasks
              and vocabulary games. Scores are saved so you can see how the class is doing.
            </p>
            <div className="mt-7 flex items-center gap-3">
              <Link
                to="/auth"
                className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-primary-foreground"
              >
                Start learning
              </Link>
              <span className="text-sm text-inksoft">
                Students and teachers use the same sign-in.
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-display text-lg font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm text-inksoft">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
