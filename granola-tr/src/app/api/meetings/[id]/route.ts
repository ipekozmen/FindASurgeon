import { NextResponse } from "next/server";
import { getMeeting } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: RouteContext<"/api/meetings/[id]">
) {
  const { id } = await params;
  const meeting = getMeeting(id);
  if (!meeting) {
    return NextResponse.json({ error: "Toplantı bulunamadı" }, { status: 404 });
  }
  return NextResponse.json({ meeting });
}
