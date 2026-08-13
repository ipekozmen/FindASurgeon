"use client";

import { useCallback, useRef, useState } from "react";

export type RecorderState = "idle" | "recording" | "stopping";

export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamsRef = useRef<MediaStream[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolveStopRef = useRef<((blob: Blob) => void) | null>(null);

  const cleanupStreams = () => {
    streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    streamsRef.current = [];
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = useCallback(async () => {
    setError(null);
    chunksRef.current = [];
    setElapsed(0);

    try {
      // Sistem sesi: kullanıcı bir sekme/pencere/ekran seçip "sekme/sistem sesini paylaş"ı işaretlemeli.
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        // Mikrofon reddedilirse sadece sistem sesiyle devam et.
        micStream = null;
      }

      streamsRef.current = [displayStream, ...(micStream ? [micStream] : [])];

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const destination = audioContext.createMediaStreamDestination();

      if (displayStream.getAudioTracks().length > 0) {
        const displaySource = audioContext.createMediaStreamSource(
          new MediaStream(displayStream.getAudioTracks())
        );
        displaySource.connect(destination);
      }
      if (micStream) {
        const micSource = audioContext.createMediaStreamSource(micStream);
        micSource.connect(destination);
      }

      // Video track'e ihtiyacımız yok, sadece izin/paylaşım için kullanıldı.
      displayStream.getVideoTracks().forEach((t) => t.stop());

      const mixedStream = destination.stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(mixedStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanupStreams();
        setState("idle");
        resolveStopRef.current?.(blob);
        resolveStopRef.current = null;
      };

      recorder.start(1000);
      setState("recording");

      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

      // Kullanıcı paylaşımı tarayıcı UI'ından durdurursa kaydı da durdur.
      displayStream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (mediaRecorderRef.current?.state === "recording") {
          setState("stopping");
          mediaRecorderRef.current.stop();
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başlatılamadı");
      cleanupStreams();
      setState("idle");
    }
  }, []);

  const stop = useCallback((): Promise<Blob | null> => {
    setState("stopping");
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      setState("idle");
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      resolveStopRef.current = (blob) => {
        setState("idle");
        resolve(blob);
      };
      mediaRecorderRef.current?.stop();
    });
  }, []);

  return { state, error, elapsed, start, stop };
}
