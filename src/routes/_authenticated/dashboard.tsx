import { createFileRoute, Link } from "@tanstack/react-router";
import { useLessons, useMyAttempts, useUnits, useVocab } from "@/lib/course";
import { lessonScene } from "@/lib/lesson-scenes";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your units — Lingua English" },
      {
        name: "description",
        content: "Your English units, lessons and progress in one place.",
      },
      { property: "og:title", content: "Your units — Lingua English" },
      {
        property: "og:description",
        content: "Continue your English lessons and tasks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const kindLabel: Record<string, string> = {
  video: "Video lesson",
  audio: "Audio lesson",
  reading: "Reading",
};

function Dashboard() {
  const units = useUnits();
  const lessons = useLessons();
  const attempts = useMyAttempts();
  const vocab = useVocab();

  const done = new Set((attempts.data ?? []).filter((a) => a.lesson_id).map((a) => a.lesson_id!));
  const allLessons = lessons.data ?? [];
  const percent = allLessons.length > 0 ? Math.round((done.size / allLessons.length) * 100) : 0;
  const scored = (attempts.data ?? []).filter((a) => a.total > 0);
  const accuracy =
    scored.length > 0
      ? Math.round((scored.reduce((sum, a) => sum + a.score / a.total, 0) / scored.length) * 100)
      : 0;

  return (
    <>
      <section className="pb-6 pt-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              {units.data?.[0]
                ? `Unit ${units.data[0].number} · ${units.data[0].title}`
                : "Your course"}
            </p>
            <h1 className="mt-2 font-display text-4xl leading-[1.05] md:text-5xl">
              Pick up where you left off
            </h1>
            <p className="mt-3 max-w-md text-inksoft">
              {units.data?.[0]?.subtitle ?? "Watch, listen, read and practise the words."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
              <p className="font-display text-2xl font-semibold text-brand">{percent}%</p>
              <p className="text-[11px] uppercase tracking-wider text-inksoft">Lessons done</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
              <p className="font-display text-2xl font-semibold text-amber">{accuracy}%</p>
              <p className="text-[11px] uppercase tracking-wider text-inksoft">Accuracy</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
              <p className="font-display text-2xl font-semibold text-rosy">
                {vocab.data?.length ?? 0}
              </p>
              <p className="text-[11px] uppercase tracking-wider text-inksoft">Words</p>
            </div>
          </div>
        </div>
      </section>

      {(units.data ?? []).map((unit) => {
        const unitLessons = allLessons.filter((l) => l.unit_id === unit.id);
        return (
          <section key={unit.id} className="py-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">
                Unit {unit.number} · {unit.title}
              </h2>
              <Link to="/vocabulary" className="text-sm font-semibold text-brand">
                Vocabulary
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {unitLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  to="/lesson/$lessonId"
                  params={{ lessonId: lesson.id }}
                  className="overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-brand"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <img
                      src={lessonScene(lesson.title, lesson.kind).image}
                      alt={lessonScene(lesson.title, lesson.kind).alt}
                      loading="lazy"
                      width={1408}
                      height={896}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <span className="absolute bottom-3 left-3 rounded bg-branddeep px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                      {kindLabel[lesson.kind] ?? lesson.kind} ·{" "}
                      {lessonScene(lesson.title, lesson.kind).quest}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-inksoft">
                      Lesson {lesson.sort_order}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-semibold">{lesson.title}</h3>
                    <div className="mt-3 flex items-center justify-between text-xs text-inksoft">
                      <span>{lesson.duration_label}</span>
                      <span
                        className={
                          done.has(lesson.id)
                            ? "font-semibold text-brand"
                            : "font-semibold text-rosy"
                        }
                      >
                        {done.has(lesson.id) ? "Completed" : "Not started"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
