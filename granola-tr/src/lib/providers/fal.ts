import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY,
});

/** fal.ai `fal-ai/whisper` ile ses dosyasından Türkçe transkript çıkarır. */
export async function transcribeFal(audio: File): Promise<string> {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY tanımlı değil. .env.local dosyasına ekleyin.");
  }

  const url = await fal.storage.upload(audio);

  const result = await fal.subscribe("fal-ai/whisper", {
    input: {
      audio_url: url,
      language: "tr",
      task: "transcribe",
    },
  });

  const text = (result.data as { text?: string })?.text;
  if (!text) {
    throw new Error("fal.ai whisper yanıtı boş döndü.");
  }
  return text;
}
