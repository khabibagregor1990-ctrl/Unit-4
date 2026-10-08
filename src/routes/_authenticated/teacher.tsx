import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsTeacher, useLessons, useUnits, useVocab, type Attempt } from "@/lib/course";

export const Route = createFileRoute("/_authenticated/teacher")({
  head: () => ({
    meta: [
      { title: "Teacher area — Lingua English" },
      {
        name: "description",
        content: "See how your class is doing and add new units, lessons, tasks and vocabulary.",
      },
      { property: "og:title", content: "Teacher area — Lingua English" },
      {
        property: "og:description",
        content: "Class progress and content management for your English course.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeacherPage,
});

function useClassProgress(enabled: boolean) {
  return useQuery({
    queryKey: ["class-progress"],
    enabled,
    queryFn: async () => {
      const [attemptsRes, profilesRes] = await Promise.all([
        supabase.from("attempts").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, display_name"),
      ]);
      if (attemptsRes.error) throw attemptsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      return {
        attempts: (attemptsRes.data ?? []) as Attempt[],
        profiles: (profilesRes.data ?? []) as {
          id: string;
          display_name: string;
        }[],
      };
    },
  });
}

function TeacherPage() {
  const isTeacher = useIsTeacher();
  const queryClient = useQueryClient();
  const units = useUnits();
  const lessons = useLessons();
  const vocab = useVocab();
  const progress = useClassProgress(Boolean(isTeacher.data));

  async function claim() {
    const { data, error } = await supabase.rpc("claim_teacher_role");
    if (error || !data) {
      toast.error("A teacher account already exists for this class.");
      return;
    }
    toast.success("You are now the teacher for this class.");
    queryClient.invalidateQueries();
  }

  if (isTeacher.isLoading) {
    return <p className="py-10 text-sm text-inksoft">Loading…</p>;
  }

  if (!isTeacher.data) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="font-display text-2xl font-semibold">Teacher area</h1>
        <p className="mt-2 text-sm text-inksoft">
          This area is for the class teacher. If this class is yours and no teacher has been set up
          yet, claim it below.
        </p>
        <button
          onClick={claim}
          className="mt-5 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          I'm the teacher
        </button>
      </div>
    );
  }

  const attempts = progress.data?.attempts ?? [];
  const profiles = progress.data?.profiles ?? [];
  const allLessons = lessons.data ?? [];
  const allUnits = units.data ?? [];
  const unitMap = new Map(allUnits.map((u) => [u.id, u]));

  const students = profiles.map((p) => {
    const rows = attempts.filter((a) => a.user_id === p.id && a.total > 0);
    const quizRows = rows.filter((a) => a.activity === "lesson-quiz");
    const vocabRows = rows.filter((a) => a.activity !== "lesson-quiz");
    const quizAvg =
      quizRows.length > 0
        ? Math.round((quizRows.reduce((s, a) => s + a.score / a.total, 0) / quizRows.length) * 100)
        : null;
    const lessonsDone = new Set(quizRows.filter((a) => a.lesson_id).map((a) => a.lesson_id)).size;
    // Best quiz score per lesson
    const perLesson = new Map<string, { score: number; total: number }>();
    for (const a of quizRows) {
      if (!a.lesson_id) continue;
      const prev = perLesson.get(a.lesson_id);
      if (!prev || a.score / a.total > prev.score / prev.total) {
        perLesson.set(a.lesson_id, { score: a.score, total: a.total });
      }
    }
    const vocabByGame = new Map<string, number>();
    for (const a of vocabRows) {
      vocabByGame.set(a.activity, (vocabByGame.get(a.activity) ?? 0) + 1);
    }
    return {
      ...p,
      quizAvg,
      lessonsDone,
      quizCount: quizRows.length,
      vocabCount: vocabRows.length,
      vocabByGame,
      perLesson,
      lastActive: rows[0]?.created_at ?? null,
    };
  });

  const activeStudents = students.filter((s) => s.quizCount + s.vocabCount > 0);
  const classQuizAvg =
    activeStudents.length > 0
      ? Math.round(
          activeStudents
            .filter((s) => s.quizAvg !== null)
            .reduce((s, st) => s + (st.quizAvg ?? 0), 0) /
            Math.max(1, activeStudents.filter((s) => s.quizAvg !== null).length),
        )
      : 0;

  return (
    <>
      <section className="pb-6 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Teacher</p>
        <h1 className="mt-2 font-display text-4xl">Class dashboard</h1>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-inksoft">Students</p>
          <p className="mt-1 font-display text-3xl">{students.length}</p>
          <p className="mt-1 text-xs text-inksoft">{activeStudents.length} active so far</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-inksoft">
            Average quiz score
          </p>
          <p className="mt-1 font-display text-3xl">{classQuizAvg}%</p>
          <p className="mt-1 text-xs text-inksoft">
            across {attempts.filter((a) => a.activity === "lesson-quiz").length} quiz attempts
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-inksoft">
            Vocabulary practice
          </p>
          <p className="mt-1 font-display text-3xl">
            {attempts.filter((a) => a.activity !== "lesson-quiz").length}
          </p>
          <p className="mt-1 text-xs text-inksoft">game rounds played</p>
        </div>
      </div>

      <h2 className="mt-10 font-display text-2xl font-semibold">Students</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-inksoft">
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-5 py-3 font-medium">Lessons done</th>
              <th className="px-5 py-3 font-medium">Quiz average</th>
              <th className="px-5 py-3 font-medium">Vocab practice</th>
              <th className="px-5 py-3 font-medium">Last active</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-inksoft">
                  No students have signed up yet.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">{s.display_name}</td>
                  <td className="px-5 py-3 text-inksoft">
                    {s.lessonsDone}/{allLessons.length}
                  </td>
                  <td className="px-5 py-3">
                    {s.quizAvg === null ? (
                      <span className="text-inksoft">—</span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-sand">
                          <div
                            className={`h-full rounded-full ${
                              s.quizAvg >= 75
                                ? "bg-brand"
                                : s.quizAvg >= 50
                                  ? "bg-amber"
                                  : "bg-rosy"
                            }`}
                            style={{ width: `${s.quizAvg}%` }}
                          />
                        </div>
                        <span className="font-semibold">{s.quizAvg}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-inksoft">
                    {s.vocabCount === 0
                      ? "—"
                      : [...s.vocabByGame.entries()].map(([game, n]) => `${game} ×${n}`).join(", ")}
                  </td>
                  <td className="px-5 py-3 text-inksoft">
                    {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 font-display text-2xl font-semibold">Lesson-by-lesson progress</h2>
      <p className="mt-1 text-sm text-inksoft">Best quiz score per lesson for each student.</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-inksoft">
              <th className="px-5 py-3 font-medium">Student</th>
              {allLessons.map((l) => (
                <th key={l.id} className="px-4 py-3 font-medium">
                  <span className="block max-w-32 truncate" title={l.title}>
                    {l.title}
                  </span>
                  <span className="block text-[10px] font-normal text-inksoft">
                    {unitMap.get(l.unit_id)?.title ?? ""}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={allLessons.length + 1} className="px-5 py-8 text-center text-inksoft">
                  No students have signed up yet.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">{s.display_name}</td>
                  {allLessons.map((l) => {
                    const best = s.perLesson.get(l.id);
                    if (!best) {
                      return (
                        <td key={l.id} className="px-4 py-3 text-inksoft">
                          ·
                        </td>
                      );
                    }
                    const pct = Math.round((best.score / best.total) * 100);
                    return (
                      <td key={l.id} className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            pct >= 75
                              ? "bg-brand/15 text-brand"
                              : pct >= 50
                                ? "bg-amber/15 text-amber"
                                : "bg-rosy/15 text-rosy"
                          }`}
                        >
                          {best.score}/{best.total}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 font-display text-2xl font-semibold">Add content</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AddUnit />
        <AddLesson units={units.data ?? []} />
        <AddTask lessons={lessons.data ?? []} />
        <AddVocab units={units.data ?? []} />
      </div>

      <p className="mt-6 text-sm text-inksoft">
        {units.data?.length ?? 0} units · {lessons.data?.length ?? 0} lessons ·{" "}
        {vocab.data?.length ?? 0} vocabulary words.
      </p>
    </>
  );
}

const field =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand";
const card = "rounded-2xl border border-border bg-card p-5 space-y-3";
const submit = "rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground";

function AddUnit() {
  const queryClient = useQueryClient();
  const [number, setNumber] = useState("5");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  async function save() {
    if (!title) return;
    const { error } = await supabase.from("units").insert({
      number: Number(number) || 1,
      title,
      subtitle,
      sort_order: Number(number) || 1,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Unit added");
    setTitle("");
    setSubtitle("");
    queryClient.invalidateQueries({ queryKey: ["units"] });
  }

  return (
    <div className={card}>
      <h3 className="font-display text-lg font-semibold">New unit</h3>
      <input
        className={field}
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        placeholder="Unit number"
      />
      <input
        className={field}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Unit title"
      />
      <input
        className={field}
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="Short description"
      />
      <button onClick={save} className={submit}>
        Add unit
      </button>
    </div>
  );
}

function AddLesson({ units }: { units: { id: string; title: string }[] }) {
  const queryClient = useQueryClient();
  const [unitId, setUnitId] = useState("");
  const [kind, setKind] = useState("video");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [body, setBody] = useState("");

  async function save() {
    const unit = unitId || units[0]?.id;
    if (!unit || !title) return;
    const { error } = await supabase.from("lessons").insert({
      unit_id: unit,
      kind,
      title,
      subtitle,
      media_url: mediaUrl || null,
      body: body || null,
      sort_order: 99,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Lesson added");
    setTitle("");
    setSubtitle("");
    setMediaUrl("");
    setBody("");
    queryClient.invalidateQueries({ queryKey: ["lessons"] });
  }

  return (
    <div className={card}>
      <h3 className="font-display text-lg font-semibold">New lesson</h3>
      <select className={field} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.title}
          </option>
        ))}
      </select>
      <select className={field} value={kind} onChange={(e) => setKind(e.target.value)}>
        <option value="video">Video</option>
        <option value="audio">Audio</option>
        <option value="reading">Reading</option>
      </select>
      <input
        className={field}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Lesson title"
      />
      <input
        className={field}
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="Instruction for students"
      />
      <input
        className={field}
        value={mediaUrl}
        onChange={(e) => setMediaUrl(e.target.value)}
        placeholder="Video / audio link (for video and audio lessons)"
      />
      <textarea
        className={`${field} min-h-24`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Reading text (for reading lessons)"
      />
      <button onClick={save} className={submit}>
        Add lesson
      </button>
    </div>
  );
}

function AddTask({ lessons }: { lessons: { id: string; title: string }[] }) {
  const queryClient = useQueryClient();
  const [lessonId, setLessonId] = useState("");
  const [type, setType] = useState("mcq");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState("");
  const [answer, setAnswer] = useState("");
  const [explanation, setExplanation] = useState("");

  async function save() {
    const lesson = lessonId || lessons[0]?.id;
    if (!lesson || !prompt || !answer) return;
    const parsed =
      type === "tf"
        ? ["True", "False"]
        : type === "mcq"
          ? options
              .split("\n")
              .map((o) => o.trim())
              .filter(Boolean)
          : [];
    const { error } = await supabase.from("tasks").insert({
      lesson_id: lesson,
      type,
      prompt,
      options: parsed,
      answer,
      explanation,
      sort_order: 99,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Task added");
    setPrompt("");
    setOptions("");
    setAnswer("");
    setExplanation("");
    queryClient.invalidateQueries({ queryKey: ["tasks", lesson] });
  }

  return (
    <div className={card}>
      <h3 className="font-display text-lg font-semibold">New task</h3>
      <select className={field} value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
        {lessons.map((l) => (
          <option key={l.id} value={l.id}>
            {l.title}
          </option>
        ))}
      </select>
      <select className={field} value={type} onChange={(e) => setType(e.target.value)}>
        <option value="mcq">Multiple choice</option>
        <option value="tf">True or false</option>
        <option value="gap">Gap-fill</option>
      </select>
      <input
        className={field}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Question"
      />
      {type === "mcq" ? (
        <textarea
          className={`${field} min-h-20`}
          value={options}
          onChange={(e) => setOptions(e.target.value)}
          placeholder="One answer choice per line"
        />
      ) : null}
      <input
        className={field}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={type === "tf" ? "True or False" : "Correct answer"}
      />
      <input
        className={field}
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        placeholder="Feedback shown after answering"
      />
      <button onClick={save} className={submit}>
        Add task
      </button>
    </div>
  );
}

function AddVocab({ units }: { units: { id: string; title: string }[] }) {
  const queryClient = useQueryClient();
  const [unitId, setUnitId] = useState("");
  const [word, setWord] = useState("");
  const [pos, setPos] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");

  async function save() {
    const unit = unitId || units[0]?.id;
    if (!unit || !word || !meaning) return;
    const { error } = await supabase.from("vocab_items").insert({
      unit_id: unit,
      word,
      part_of_speech: pos,
      meaning,
      example,
      sort_order: 99,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Word added");
    setWord("");
    setPos("");
    setMeaning("");
    setExample("");
    queryClient.invalidateQueries({ queryKey: ["vocab"] });
  }

  return (
    <div className={card}>
      <h3 className="font-display text-lg font-semibold">New vocabulary word</h3>
      <select className={field} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.title}
          </option>
        ))}
      </select>
      <input
        className={field}
        value={word}
        onChange={(e) => setWord(e.target.value)}
        placeholder="Word"
      />
      <input
        className={field}
        value={pos}
        onChange={(e) => setPos(e.target.value)}
        placeholder="noun / verb / phrase"
      />
      <input
        className={field}
        value={meaning}
        onChange={(e) => setMeaning(e.target.value)}
        placeholder="Meaning"
      />
      <input
        className={field}
        value={example}
        onChange={(e) => setExample(e.target.value)}
        placeholder="Example sentence"
      />
      <button onClick={save} className={submit}>
        Add word
      </button>
    </div>
  );
}
