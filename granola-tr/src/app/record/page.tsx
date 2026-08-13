"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, MicrophoneIcon, StopIcon } from "@heroicons/react/24/solid";
import { useRecorder } from "@/lib/useRecorder";

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const WAVE_DELAYS = [0, 120, 60, 180, 30, 150, 90];

export default function RecordPage() {
  const router = useRouter();
  const { state, error, elapsed, start, stop } = useRecorder();
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleStop = async () => {
    const blob = await stop();
    if (!blob) return;

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "meeting.webm");
      formData.append("title", title || "Adsız Toplantı");
      formData.append("duration", String(elapsed));

      const res = await fetch("/api/meetings", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Yükleme başarısız oldu");
      const data = await res.json();
      router.push(`/meetings/${data.id}`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Bir hata oluştu");
      setUploading(false);
    }
  };

  const isLive = state === "recording" || state === "stopping";

  return (
    <div className="mx-auto max-w-xl w-full flex-1 flex flex-col px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition mb-10 w-fit"
      >
        <ArrowLeftIcon className="size-3.5" />
        Toplantılara dön
      </Link>

      {!isLive && !uploading && (
        <div className="animate-fade-up">
          <h1 className="font-serif text-3xl mb-2">Yeni toplantı kaydı</h1>
          <p className="text-muted text-[0.95rem] leading-relaxed mb-9 max-w-md">
            Google Meet ya da Zoom sekmenizi paylaşın ve{" "}
            <span className="text-foreground font-medium">
              &quot;sekme sesini de paylaş&quot;
            </span>{" "}
            kutusunu işaretleyin. Mikrofonunuz otomatik olarak karışıma eklenir.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium tracking-wide text-muted uppercase mb-2">
                Toplantı başlığı
              </label>
              <input
                type="text"
                placeholder="örn. Ürün Sync — 13 Ağustos"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3.5 text-sm outline-none transition focus:border-accent"
              />
            </div>
            <button
              onClick={start}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-white py-4 font-medium shadow-[0_1px_2px_hsl(var(--shadow-color)/0.15),0_8px_20px_hsl(var(--shadow-color)/0.12)] transition hover:bg-accent-strong active:scale-[0.99]"
            >
              <MicrophoneIcon className="size-5" />
              Kaydı başlat
            </button>
          </div>
        </div>
      )}

      {isLive && !uploading && (
        <div className="flex flex-col items-center gap-8 py-16 animate-fade-up">
          <div className="relative flex items-center justify-center size-28">
            <span className="absolute inset-0 rounded-full bg-accent-soft animate-rec-glow" />
            <span className="relative flex items-center justify-center size-16 rounded-full bg-accent text-white">
              <MicrophoneIcon className="size-6" />
            </span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <span className="font-mono text-2xl tabular-nums tracking-tight">
              {formatElapsed(elapsed)}
            </span>
            <div className="flex items-end gap-1 h-5">
              {WAVE_DELAYS.map((delay, i) => (
                <span
                  key={i}
                  className="w-1 h-full rounded-full bg-accent/70 animate-wave-bar"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
            <p className="text-sm text-muted">Kayıt devam ediyor</p>
          </div>

          <button
            onClick={handleStop}
            disabled={state === "stopping"}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium transition hover:border-accent disabled:opacity-50"
          >
            <StopIcon className="size-4 text-accent" />
            Kaydı bitir ve işle
          </button>
        </div>
      )}

      {uploading && (
        <div className="flex flex-col items-center gap-4 py-20 text-center animate-fade-up">
          <span className="size-9 rounded-full border-2 border-accent/30 border-t-accent animate-spin-soft" />
          <p className="text-sm text-muted leading-relaxed max-w-xs">
            Ses yükleniyor, transkript ve notlar çıkarılıyor…
            <br />
            Bu birkaç dakika sürebilir.
          </p>
        </div>
      )}

      {(error || uploadError) && (
        <p className="mt-6 text-sm text-red-600 animate-fade-up">{error ?? uploadError}</p>
      )}
    </div>
  );
}
