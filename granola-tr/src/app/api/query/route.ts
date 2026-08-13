import { NextRequest, NextResponse } from "next/server";
import { listMeetings } from "@/lib/db";
import { answerQuery } from "@/lib/notes";

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "Soru gerekli" }, { status: 400 });
  }

  const meetings = listMeetings().filter((m) => m.status === "done");

  if (meetings.length === 0) {
    return NextResponse.json({
      answer: "Henüz işlenmiş bir toplantı yok, önce bir toplantı kaydedin.",
    });
  }

  const context = meetings
    .map((m) => {
      const notes = m.notes_json ? JSON.parse(m.notes_json) : { key_points: [], decisions: [] };
      const todos = m.todos_json ? JSON.parse(m.todos_json) : [];
      return `### ${m.title} (${new Date(m.created_at).toLocaleString("tr-TR")})
Özet: ${m.summary ?? ""}
Önemli noktalar: ${notes.key_points?.join("; ") ?? ""}
Kararlar: ${notes.decisions?.join("; ") ?? ""}
Yapılacaklar: ${todos.map((t: { task: string; owner: string | null }) => `${t.task}${t.owner ? ` (${t.owner})` : ""}`).join("; ")}
Transkript: ${m.transcript ?? ""}`;
    })
    .join("\n\n");

  const answer = await answerQuery(question, context);
  return NextResponse.json({ answer });
}
