import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { TaskRunner } from "@/components/TaskRunner";
import { saveAttempt, useLesson, useTasks } from "@/lib/course";
import { lessonScene } from "@/lib/lesson-scenes";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/lesson/$lessonId")({
  head: () => ({
    meta: [
      { title: "Lesson — Lingua English" },
      {
        name: "description",
        content: "Watch or read the lesson, then answer the comprehension tasks.",
      },
      { property: "og:title", content: "Lesson — Lingua English" },
      {
        property: "og:description",
        content: "Lesson media with instant-feedback tasks.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const lesson = useLesson(lessonId);
  const tasks = useTasks(lessonId);
  const queryClient = useQueryClient();
  const [showTranscript, setShowTranscript] = useState(false);

  if (lesson.isLoading) {
    return <p className="py-10 text-sm text-inksoft">Loading lesson…</p>;
  }
  if (!lesson.data) {
    return <p className="py-10 text-sm text-inksoft">Lesson not found.</p>;
  }

  const item = lesson.data;
  const scene = lessonScene(item.title, item.kind);

  async function handleFinish(score: number, total: number) {
    await saveAttempt({
      unitId: item.unit_id,
      lessonId: item.id,
      activity: "lesson-quiz",
      score,
      total,
    });
    toast.success(`Saved: ${score}/${total}`);
    queryClient.invalidateQueries({ queryKey: ["attempts", "mine"] });
  }

  return (
    <>
      <div className="flex items-center gap-3 pb-4 pt-8 text-sm">
        <Link to="/dashboard" className="font-semibold text-brand">
          ← Units
        </Link>
        <span className="text-inksoft">{item.duration_label}</span>
      </div>

      <div className="relative isolate overflow-hidden rounded-lg bg-branddeep">
        <img
          src={scene.image}
          alt={scene.alt}
          width={1408}
          height={896}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="bg-branddeep/75 px-6 py-8 text-primary-foreground sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber">
            {scene.quest}
          </p>
          <h1 className="mt-2 max-w-xl font-display text-3xl md:text-4xl">{item.title}</h1>
          <p className="mt-3 max-w-xl text-sm sm:text-base">{item.subtitle}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {item.kind === "video" && item.media_url ? (
            <video
              key={item.media_url}
              controls
              className="w-full overflow-hidden rounded-2xl border border-border bg-ink"
              src={item.media_url}
            />
          ) : null}

          {item.kind === "audio" && item.media_url ? (
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-inksoft">
                Listening
              </p>
              <audio key={item.media_url} controls className="mt-4 w-full" src={item.media_url} />
            </div>
          ) : null}

          {item.kind === "reading" && item.body ? (
            <article className="rounded-2xl border border-border bg-card p-7">
              {item.body.split("\n\n").map((para, i) => (
                <p key={i} className="mb-4 leading-relaxed last:mb-0">
                  {para}
                </p>
              ))}
            </article>
          ) : null}

          {item.transcript ? (
            <div className="mt-4 rounded-2xl border border-border bg-card p-5">
              <Button
                variant="ghost"
                onClick={() => setShowTranscript((s) => !s)}
                className="px-0 text-brand hover:bg-transparent"
              >
                {showTranscript ? "Hide" : "Show"} key points
              </Button>
              {showTranscript ? (
                <p className="mt-3 text-sm leading-relaxed text-inksoft">{item.transcript}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6">
            {tasks.isLoading ? (
              <p className="text-sm text-inksoft">Loading tasks…</p>
            ) : (
              <TaskRunner
                key={item.id}
                tasks={tasks.data ?? []}
                onFinish={handleFinish}
                scene={scene}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
