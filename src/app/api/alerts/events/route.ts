import { auth } from "@/lib/auth";
import { getAlertEvents, acknowledgeAlert } from "@/db/queries/alerts";
import { z } from "zod";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);

  try {
    const events = await getAlertEvents(session.user.id, limit);
    return Response.json({ data: events });
  } catch (err) {
    console.error("[alerts/events GET]", err);
    return Response.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

const ackSchema = z.object({ eventId: z.string().uuid() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = ackSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    await acknowledgeAlert(parsed.data.eventId);
    return Response.json({ data: { acknowledged: true } });
  } catch (err) {
    console.error("[alerts/events POST]", err);
    return Response.json({ error: "Failed to acknowledge alert" }, { status: 500 });
  }
}
