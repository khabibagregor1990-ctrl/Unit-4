import { createFileRoute } from "@tanstack/react-router";
import { useLessons, useMyAttempts } from "@/lib/course";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Your progress — Lingua English" },
      {
        name: "description",
        content: "See every task you have finished and how you scored.",
      },
      { property: "og:title", content: "Your progress — Lingua English" },
      {
        property: "og:description",
        content: "Scores from your lessons, games and vocabulary practice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgressPage,
});

const activityLabel: Record<string, string> = {
  "lesson-quiz": "Lesson tasks",
  hangman: "Hangman",
  matching: "Matching pairs",
};

function ProgressPage() {
  const attempts = useMyAttempts();
  const lessons = useLessons();
  const rows = attempts.data ?? [];
  const lessonMap = new Map((lessons.data ?? []).map((l) => [l.id, l.title]));

  return (
    <>
      <section className="pb-6 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Progress</p>
        <h1 className="mt-2 font-display text-4xl">Everything you've done</h1>
      </section>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-inksoft">
              <th className="px-5 py-3 font-medium">Activity</th>
              <th className="px-5 py-3 font-medium">Lesson</th>
              <th className="px-5 py-3 font-medium">Score</th>
              <th className="px-5 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-inksoft">
                  Nothing yet — finish a lesson to see your scores here.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">
                    {activityLabel[row.activity] ?? row.activity}
                  </td>
                  <td className="px-5 py-3 text-inksoft">
                    {row.lesson_id ? (lessonMap.get(row.lesson_id) ?? "—") : "Vocabulary"}
                  </td>
                  <td className="px-5 py-3 font-semibold text-brand">
                    {row.score}/{row.total}
                  </td>
                  <td className="px-5 py-3 text-inksoft">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
