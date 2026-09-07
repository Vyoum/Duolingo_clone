"use client";
import { useCallback, useEffect, useState } from "react";

export type Goal = { name: string; current: number; target: number };
export type Learner = { user_id: string; name: string; xp: number; streak: number; hearts: number; next_heart_at: string | null; lessons_completed: number; achievements: Goal[]; quests: Goal[]; quest_day: string };
export type LessonNode = { id: string; xp_reward: number; completed: boolean; unlocked: boolean };
export type Course = { name: string; units: { id: string; title: string; skills: { id: string; title: string; icon: string; crowns: number; lessons: LessonNode[] }[] }[] };
export type Payload = { type: "multiple_choice" | "translate" | "match" | "fill_blank" | "type_answer"; prompt: string; options?: string[]; tokens?: string[]; sentence?: string; left?: string[]; right?: string[] };
export type Attempt = { id: string; lesson_id: string; position: number; correct: number; incorrect: number; status: string; lesson: { xp_reward: number; exercises: { id: string; payload: Payload }[] } };
export type Feedback = { correct: boolean; expected: string; position: number; completed: boolean; hearts: number; out_of_hearts: boolean; xp_earned: number };

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function api<T>(path: string, body?: unknown, key?: string): Promise<T> {
  const response = await fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST", cache: "no-store",
    headers: { "Content-Type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new ApiError(typeof data.detail === "string" ? data.detail : "Could not save your answer. Please retry.", response.status);
  return data as T;
}
export function useApi<T>(path: string, poll = false) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion(v => v + 1), []);
  useEffect(() => {
    let active = true;
    const read = () => api<T>(path).then(value => { if (active) { setData(value); setError(""); } }).catch(e => { if (active) setError(e.message); });
    void read();
    const interval = poll ? setInterval(read, 15000) : undefined;
    const refresh = () => { void read(); };
    window.addEventListener("learner-updated", refresh);
    return () => { active = false; clearInterval(interval); window.removeEventListener("learner-updated", refresh); };
  }, [path, poll, version]);
  return { data, error, reload };
}
