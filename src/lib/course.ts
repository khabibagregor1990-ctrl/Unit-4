import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Unit = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  sort_order: number;
};

export type Lesson = {
  id: string;
  unit_id: string;
  kind: string;
  title: string;
  subtitle: string;
  media_url: string | null;
  body: string | null;
  transcript: string | null;
  duration_label: string;
  sort_order: number;
};

export type Task = {
  id: string;
  lesson_id: string;
  type: string;
  prompt: string;
  options: unknown;
  answer: string;
  explanation: string;
  sort_order: number;
};

export type VocabItem = {
  id: string;
  unit_id: string;
  word: string;
  part_of_speech: string;
  meaning: string;
  example: string;
  sort_order: number;
};

export type Attempt = {
  id: string;
  user_id: string;
  unit_id: string | null;
  lesson_id: string | null;
  activity: string;
  score: number;
  total: number;
  created_at: string;
};

export function taskOptions(task: Task): string[] {
  if (Array.isArray(task.options)) return task.options as string[];
  return [];
}

export function useUnits() {
  return useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await supabase.from("units").select("*").order("sort_order");
      if (error) throw error;
      return data as Unit[];
    },
  });
}

export function useLessons() {
  return useQuery({
    queryKey: ["lessons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("*").order("sort_order");
      if (error) throw error;
      return data as Lesson[];
    },
  });
}

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lessonId)
        .maybeSingle();
      if (error) throw error;
      return data as Lesson | null;
    },
  });
}

export function useTasks(lessonId: string) {
  return useQuery({
    queryKey: ["tasks", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("sort_order");
      if (error) throw error;
      return data as Task[];
    },
  });
}

export function useVocab(unitId?: string) {
  return useQuery({
    queryKey: ["vocab", unitId ?? "all"],
    queryFn: async () => {
      let query = supabase.from("vocab_items").select("*").order("sort_order");
      if (unitId) query = query.eq("unit_id", unitId);
      const { data, error } = await query;
      if (error) throw error;
      return data as VocabItem[];
    },
  });
}

export function useMyAttempts() {
  return useQuery({
    queryKey: ["attempts", "mine"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attempts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Attempt[];
    },
  });
}

export async function saveAttempt(input: {
  unitId?: string | null;
  lessonId?: string | null;
  activity: string;
  score: number;
  total: number;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;
  await supabase.from("attempts").insert({
    user_id: userId,
    unit_id: input.unitId ?? null,
    lesson_id: input.lessonId ?? null,
    activity: input.activity,
    score: input.score,
    total: input.total,
  });
}

export function useIsTeacher() {
  return useQuery({
    queryKey: ["is-teacher"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? []).some((r) => r.role === "teacher");
    },
  });
}
