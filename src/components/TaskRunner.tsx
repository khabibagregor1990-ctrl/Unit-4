import { useMemo, useState } from "react";
import { taskOptions, type Task } from "@/lib/course";
import type { LessonScene } from "@/lib/lesson-scenes";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Flag, RotateCcw, Search, Sparkles } from "lucide-react";

type Result = { correct: boolean; given: string };

function normalise(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,!?'"]/g, "");
}

export function TaskRunner({
  tasks,
  onFinish,
  scene,
}: {
  tasks: Task[];
  onFinish: (score: number, total: number) => void;
  scene: LessonScene;
}) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [results, setResults] = useState<Record<string, Result>>({});
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState<Record<string, boolean>>({});

  const task = tasks[index];
  const score = useMemo(() => Object.values(results).filter((r) => r.correct).length, [results]);

  if (!task) {
    return <p className="text-sm text-inksoft">No clues in this lesson yet.</p>;
  }

  const current = results[task.id];
  const options = taskOptions(task);

  function submit(given: string) {
    if (!task || results[task.id] || !given.trim()) return;
    const correct = normalise(given) === normalise(task.answer);
    if (!correct && !missed[task.id]) {
      setMissed((prev) => ({ ...prev, [task.id]: true }));
      setTyped("");
      return;
    }
    setResults((prev) => ({ ...prev, [task.id]: { correct, given } }));
  }

  function next() {
    setTyped("");
    if (index + 1 < tasks.length) {
      setIndex(index + 1);
      return;
    }
    const finalScore = Object.values({ ...results }).filter((r) => r.correct).length;
    setDone(true);
    onFinish(finalScore, tasks.length);
  }

  if (done) {
    const percent = Math.round((score / tasks.length) * 100);
    return (
      <div className="animate-pop overflow-hidden rounded-lg border border-border bg-card">
        <img
          src={scene.image}
          alt={scene.alt}
          width={1408}
          height={896}
          className="h-40 w-full object-cover"
        />
        <div className="p-6 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-amber text-accent-foreground">
            <Flag aria-hidden="true" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-brand">
            Quest complete
          </p>
          <h2 className="mt-2 font-display text-2xl">{scene.quest}</h2>
          <p className="mt-3 font-display text-5xl font-semibold text-brand">{percent}%</p>
          <p className="mt-2 text-sm text-inksoft">
            {score} of {tasks.length} clues solved. Your score is saved for your teacher.
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              setResults({});
              setMissed({});
              setIndex(0);
              setDone(false);
            }}
          >
            <RotateCcw aria-hidden="true" /> Replay quest
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative h-36 overflow-hidden">
        <img
          src={scene.image}
          alt={scene.alt}
          width={1408}
          height={896}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-branddeep/90 px-5 py-3 text-primary-foreground">
          <p className="text-xs font-semibold uppercase tracking-widest">Lesson quest</p>
          <h2 className="font-display text-xl">{scene.quest}</h2>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-sm text-inksoft">{scene.mission}</p>
        <div
          className="mt-5 flex items-center gap-1.5"
          role="progressbar"
          aria-label="Quest progress"
          aria-valuemin={0}
          aria-valuemax={tasks.length}
          aria-valuenow={index + (current ? 1 : 0)}
        >
          {tasks.map((step, i) => (
            <span
              key={step.id}
              className={`h-2 min-w-0 flex-1 rounded-full transition-colors ${i < index || (i === index && current) ? "bg-brand" : i === index ? "bg-amber" : "bg-muted"}`}
            />
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-brand">
          <span>
            Clue {index + 1} / {tasks.length}
          </span>
          <span className="flex items-center gap-1">
            <Sparkles aria-hidden="true" className="size-4 text-amber" /> {score} found
          </span>
        </div>
        {index > 0 && tasks[index - 1]?.explanation ? (
          <p className="mt-3 flex gap-2 rounded-md bg-sage px-3 py-2 text-xs text-branddeep">
            <Search className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>{tasks[index - 1]?.explanation}</span>
          </p>
        ) : null}
        <h3 className="mt-3 font-display text-xl leading-snug">{task.prompt}</h3>

        {task.type === "gap" ? (
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              aria-label="Your answer"
              value={current ? current.given : typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit(typed);
              }}
              disabled={Boolean(current)}
              placeholder="Type your answer"
              className="min-w-0 flex-1 rounded-md border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
            {!current ? <Button onClick={() => submit(typed)}>Check clue</Button> : null}
          </div>
        ) : (
          <div
            className={`mt-5 grid gap-2 ${task.type === "tf" ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}
          >
            {options.map((option) => {
              const picked = current?.given === option;
              const isAnswer = Boolean(current) && normalise(option) === normalise(task.answer);
              const base =
                "rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors";
              const state = isAnswer
                ? "border-brand bg-sage text-branddeep animate-pop"
                : picked
                  ? "border-rosy bg-rosy/10 text-rosy animate-nudge"
                  : current
                    ? "border-border text-inksoft"
                    : "border-border hover:border-brand";
              return (
                <Button
                  key={option}
                  variant="outline"
                  disabled={Boolean(current)}
                  onClick={() => submit(option)}
                  className={`${base} ${state} h-auto min-h-12 justify-start whitespace-normal disabled:opacity-100`}
                >
                  {option}
                </Button>
              );
            })}
          </div>
        )}

        {!current && missed[task.id] ? (
          <p
            className="mt-4 rounded-md border border-amber bg-amber/10 p-3 text-sm animate-nudge"
            role="status"
          >
            Wrong path, detective! Re-read the clue and the lead — you have one more try.
          </p>
        ) : null}

        {current ? (
          <div
            className={`mt-4 rounded-md border p-4 text-sm ${current.correct ? "border-brand bg-sage text-branddeep" : "border-rosy bg-rosy/10"}`}
            role="status"
          >
            <p className="flex items-center gap-2 font-semibold">
              {current.correct ? (
                <>
                  <Check className="size-4" aria-hidden="true" /> Clue solved! +1 point
                </>
              ) : (
                `Not quite — the answer is ${task.answer}`
              )}
            </p>
            {task.explanation ? (
              <p className="mt-2 flex gap-2 text-ink">
                <Search className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                <span>{task.explanation}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end">
          <Button disabled={!current} onClick={next}>
            {index + 1 === tasks.length ? "Finish quest" : "Next clue"}{" "}
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
