import { completeBedrock } from "@/lib/providers/bedrock";

export type MeetingNotes = {
  summary: string;
  key_points: string[];
  decisions: string[];
  todos: { task: string; owner: string | null }[];
};

const NOTES_SYSTEM_PROMPT = `Sen Türkçe konuşulan iş toplantılarının transkriptlerinden not çıkaran bir asistansın.
SADECE aşağıdaki JSON şemasına birebir uyan bir JSON çıktısı üret, başka hiçbir açıklama, markdown ya da kod bloğu ekleme:
{"summary": "toplantının 2-4 cümlelik özeti", "key_points": ["önemli nokta 1", ...], "decisions": ["alınan karar 1", ...], "todos": [{"task": "yapılacak iş", "owner": "kişi adı ya da null"}, ...]}
Tüm metinler Türkçe olmalı. Transkriptte yoksa ilgili alanı boş dizi bırak.`;

function parseJsonLoose<T>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const jsonSlice = start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(jsonSlice) as T;
}

export async function extractNotes(transcript: string): Promise<MeetingNotes> {
  const raw = await completeBedrock(NOTES_SYSTEM_PROMPT, transcript);
  const parsed = parseJsonLoose<Partial<MeetingNotes>>(raw);
  return {
    summary: parsed.summary ?? "",
    key_points: parsed.key_points ?? [],
    decisions: parsed.decisions ?? [],
    todos: parsed.todos ?? [],
  };
}

export async function answerQuery(question: string, context: string): Promise<string> {
  const systemPrompt =
    "Sen kullanıcının geçmiş toplantı notlarını ve transkriptlerini bilen bir asistansın. Sadece verilen bağlamdaki bilgilere dayanarak Türkçe cevap ver. Bağlamda cevap yoksa bunu açıkça belirt.";
  const userPrompt = `Bağlam (toplantı notları ve transkriptler):\n\n${context}\n\nSoru: ${question}`;
  return completeBedrock(systemPrompt, userPrompt);
}
