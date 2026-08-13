import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createMeeting, listMeetings, updateMeeting } from "@/lib/db";
import { extractNotes } from "@/lib/notes";
import { transcribeFal } from "@/lib/providers/fal";

export async function GET() {
  return NextResponse.json({ meetings: listMeetings() });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get("audio");
  const title = (formData.get("title") as string) || "Adsız Toplantı";
  const durationSeconds = Number(formData.get("duration") ?? 0);

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "Ses dosyası bulunamadı" }, { status: 400 });
  }

  const id = uuidv4();
  createMeeting(id, title);
  updateMeeting(id, { duration_seconds: durationSeconds || null });

  processMeeting(id, audio).catch((err) => {
    console.error("Meeting processing failed", err);
    updateMeeting(id, { status: "error", error: String(err?.message ?? err) });
  });

  return NextResponse.json({ id });
}

async function processMeeting(id: string, audio: File) {
  const transcript = await transcribeFal(audio);
  updateMeeting(id, { transcript });

  const notes = await extractNotes(transcript);

  updateMeeting(id, {
    status: "done",
    summary: notes.summary,
    notes_json: JSON.stringify({ key_points: notes.key_points, decisions: notes.decisions }),
    todos_json: JSON.stringify(notes.todos),
  });
}
