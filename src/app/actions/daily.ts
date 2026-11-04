"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DailyTasksState = {
  indexes: number[];
  date: string;
  migrationMissing: boolean;
  error?: string;
};

function tashkentDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function getDailyTasksState(): Promise<DailyTasksState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const date = tashkentDate();
  if (!user) return { indexes: [], date, migrationMissing: false, error: "Avtorizatsiya talab qilinadi." };

  const { data, error } = await supabase
    .from("daily_task_completions")
    .select("task_index")
    .eq("user_id", user.id)
    .eq("task_date", date)
    .order("task_index", { ascending: true });

  if (error) {
    const missing = error.code === "42P01" || error.code === "PGRST205" || /daily_task_completions/i.test(error.message);
    return { indexes: [], date, migrationMissing: missing, error: missing ? undefined : "Kunlik vazifalar holatini yuklab bo‘lmadi." };
  }

  return { indexes: (data ?? []).map((row) => row.task_index), date, migrationMissing: false };
}

export async function completeDailyTaskAction(input: {
  index: number;
  correct: number;
  total: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };
  if (!Number.isInteger(input.index) || input.index < 0 || input.index > 4
    || !Number.isInteger(input.total) || input.total !== 3
    || !Number.isInteger(input.correct) || input.correct < 0 || input.correct > input.total
    || input.correct * 100 < input.total * 60) {
    return { error: "Vazifa natijasi noto‘g‘ri yoki o‘tish bali yetarli emas." };
  }

  const { data, error } = await supabase.rpc("complete_daily_task", {
    p_index: input.index,
    p_correct: input.correct,
    p_total: input.total,
  });
  if (error) {
    const sequence = error.message.includes("finish previous");
    return { error: sequence ? "Avval oldingi kunlik vazifani tugating." : "Natijani saqlab bo‘lmadi. Migratsiya bajarilganini tekshiring." };
  }

  revalidatePath("/lessons");
  return { result: data as { xp: number; already: boolean; day_completed: boolean } };
}
