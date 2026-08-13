"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import type { Meeting } from "@/lib/db";

type Notes = { key_points: string[]; decisions: string[] };
type Todo = { task: string; owner: string | null };

export default function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const statusRef = useRef<Meeting["status"] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch(`/api/meetings/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!cancelled) {
        setMeeting(data.meeting);
        statusRef.current = data.meeting.status;
      }
    };
    load();
    const interval = setInterval(() => {
      if (statusRef.current === "processing" || !statusRef.current) load();
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  if (!meeting) {
    return (
      <div className="mx-auto max-w-2xl w-full flex-1 px-6 py-16">
        <span className="inline-block size-6 rounded-full border-2 border-accent/30 border-t-accent animate-spin-soft" />
      </div>
    );
  }

  const notes: Notes = meeting.notes_json
    ? JSON.parse(meeting.notes_json)
    : { key_points: [], decisions: [] };
  const todos: Todo[] = meeting.todos_json ? JSON.parse(meeting.todos_json) : [];
  const doneTodos = Object.values(checked).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-2xl w-full flex-1 px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition mb-8 w-fit"
      >
        <ArrowLeftIcon className="size-3.5" />
        Toplantılara dön
      </Link>

      <div className="animate-fade-up">
        <h1 className="font-serif text-3xl leading-tight mb-2">{meeting.title}</h1>
        <p className="text-sm text-muted">
          {new Date(meeting.created_at).toLocaleString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {meeting.duration_seconds
            ? ` · ${Math.round(meeting.duration_seconds / 60)} dk`
            : ""}
        </p>
      </div>

      {meeting.status === "processing" && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 text-sm text-muted mt-9 animate-fade-up">
          <span className="size-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin-soft shrink-0" />
          Transkript ve notlar hazırlanıyor…
        </div>
      )}

      {meeting.status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 mt-9">
          İşleme sırasında hata oluştu: {meeting.error}
        </div>
      )}

      {meeting.status === "done" && (
        <div className="mt-10 space-y-10">
          <section className="animate-fade-up">
            <h2 className="text-xs font-medium tracking-wide text-muted uppercase mb-3">
              Özet
            </h2>
            <p className="text-[0.95rem] leading-relaxed">{meeting.summary}</p>
          </section>

          {notes.key_points?.length > 0 && (
            <section className="animate-fade-up">
              <h2 className="text-xs font-medium tracking-wide text-muted uppercase mb-3">
                Önemli noktalar
              </h2>
              <ul className="space-y-2.5">
                {notes.key_points.map((p, i) => (
                  <li key={i} className="flex gap-3 text-[0.95rem] leading-relaxed">
                    <span className="text-accent mt-[0.5em] size-1 rounded-full bg-accent shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {notes.decisions?.length > 0 && (
            <section className="animate-fade-up">
              <h2 className="text-xs font-medium tracking-wide text-muted uppercase mb-3">
                Kararlar
              </h2>
              <ul className="space-y-2.5">
                {notes.decisions.map((d, i) => (
                  <li key={i} className="flex gap-3 text-[0.95rem] leading-relaxed">
                    <span className="text-accent mt-[0.5em] size-1 rounded-full bg-accent shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {todos.length > 0 && (
            <section className="animate-fade-up">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-xs font-medium tracking-wide text-muted uppercase">
                  Yapılacaklar
                </h2>
                <span className="text-xs text-muted tabular-nums">
                  {doneTodos}/{todos.length}
                </span>
              </div>
              <ul className="space-y-2">
                {todos.map((t, i) => (
                  <li key={i}>
                    <label className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm cursor-pointer transition hover:border-accent/40">
                      <input
                        type="checkbox"
                        checked={!!checked[i]}
                        onChange={(e) =>
                          setChecked((c) => ({ ...c, [i]: e.target.checked }))
                        }
                        className="mt-0.5 size-4 accent-accent shrink-0"
                      />
                      <span
                        className={
                          checked[i]
                            ? "line-through text-muted transition-colors"
                            : "transition-colors"
                        }
                      >
                        {t.task}
                        {t.owner && <span className="text-muted"> — {t.owner}</span>}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="animate-fade-up pt-2">
            <button
              onClick={() => setShowTranscript((s) => !s)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-strong transition"
            >
              Tam transkript
              <ChevronDownIcon
                className={`size-3.5 transition-transform ${showTranscript ? "rotate-180" : ""}`}
              />
            </button>
            {showTranscript && (
              <p className="mt-4 text-sm leading-relaxed text-muted whitespace-pre-wrap animate-fade-up">
                {meeting.transcript}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
