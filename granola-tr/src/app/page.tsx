"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import type { Meeting } from "@/lib/db";

export default function HomePage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/meetings");
    const data = await res.json();
    setMeetings(data.meetings ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const interval = setInterval(load, 5000);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() awaits before setState
    load();
    return () => clearInterval(interval);
  }, []);

  const ask = async () => {
    if (!question.trim() || asking) return;
    setAsking(true);
    setAnswer(null);
    setAskError(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (data.answer) setAnswer(data.answer);
      else setAskError(data.error ?? "Cevap alınamadı, tekrar dene.");
    } catch {
      setAskError("Bağlantı hatası — tekrar dene.");
    } finally {
      setAsking(false);
    }
  };

  const doneCount = meetings.filter((m) => m.status === "done").length;

  return (
    <div className="mx-auto max-w-3xl w-full flex-1 px-6 py-12 sm:py-16">
      <header className="flex items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted uppercase mb-1.5">
            {doneCount > 0
              ? `${doneCount} toplantı işlendi`
              : "Türkçe toplantı notları"}
          </p>
          <h1 className="font-serif text-4xl sm:text-[2.75rem] leading-[1.05] tracking-tight">
            Granola&nbsp;TR
          </h1>
        </div>
        <Link
          href="/record"
          className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-accent text-white pl-4 pr-5 py-3 text-sm font-medium shadow-[0_1px_2px_hsl(var(--shadow-color)/0.15),0_8px_20px_hsl(var(--shadow-color)/0.12)] transition hover:bg-accent-strong hover:shadow-[0_1px_2px_hsl(var(--shadow-color)/0.2),0_10px_24px_hsl(var(--shadow-color)/0.18)] active:scale-[0.97]"
        >
          <PlusIcon className="size-4" strokeWidth={2.5} />
          Yeni kayıt
        </Link>
      </header>

      <div className="rounded-2xl border border-border bg-card p-5 mb-12 shadow-[0_1px_2px_hsl(var(--shadow-color)/0.06)]">
        <div className="flex items-center gap-2.5 mb-1">
          <SparklesIcon className="size-4 text-accent shrink-0" />
          <span className="text-xs font-medium tracking-wide text-muted uppercase">
            Tüm notlarında ara
          </span>
        </div>
        <div className="flex items-center gap-2.5 mt-2.5">
          <MagnifyingGlassIcon className="size-5 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Geçen hafta bütçe hakkında ne konuşulmuştu?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            className="flex-1 bg-transparent outline-none text-[0.95rem] placeholder:text-muted/70"
          />
          <button
            onClick={ask}
            disabled={asking || !question.trim()}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-strong disabled:opacity-40 disabled:hover:text-accent transition shrink-0"
          >
            {asking ? "Aranıyor…" : "Sor"}
            {!asking && <ArrowRightIcon className="size-3.5" />}
          </button>
        </div>
        {(answer || askError) && (
          <div className="mt-4 pt-4 border-t border-border-soft text-sm leading-relaxed whitespace-pre-wrap animate-fade-up">
            {answer ?? <span className="text-red-600">{askError}</span>}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-serif text-lg">Toplantılar</h2>
        {loading && <span className="text-xs text-muted">Yükleniyor…</span>}
      </div>

      {!loading && meetings.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="font-serif text-lg mb-1.5">Henüz sessiz.</p>
          <p className="text-sm text-muted max-w-sm mx-auto mb-6">
            İlk toplantını kaydet — transkript, özet ve yapılacaklar listesi birkaç dakika
            içinde hazır olur.
          </p>
          <Link
            href="/record"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-strong"
          >
            <PlusIcon className="size-4" />
            Kayda başla
          </Link>
        </div>
      )}

      <ul className="space-y-2.5">
        {meetings.map((m, i) => (
          <li key={m.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
            <Link
              href={`/meetings/${m.id}`}
              className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 transition hover:border-accent/40 hover:shadow-[0_1px_2px_hsl(var(--shadow-color)/0.06),0_6px_16px_hsl(var(--shadow-color)/0.08)]"
            >
              <div className="min-w-0">
                <p className="font-medium truncate group-hover:text-accent-strong transition-colors">
                  {m.title}
                </p>
                <p className="text-xs text-muted mt-1 tabular-nums">
                  {new Date(m.created_at).toLocaleString("tr-TR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {m.duration_seconds ? ` · ${Math.round(m.duration_seconds / 60)} dk` : ""}
                </p>
              </div>

              {m.status === "done" && (
                <CheckCircleIcon className="size-5 text-accent shrink-0" />
              )}
              {m.status === "processing" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted shrink-0">
                  <span className="size-3.5 rounded-full border-2 border-accent/40 border-t-accent animate-spin-soft" />
                  İşleniyor
                </span>
              )}
              {m.status === "error" && (
                <span className="text-xs font-medium text-red-600 shrink-0">Hata</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
