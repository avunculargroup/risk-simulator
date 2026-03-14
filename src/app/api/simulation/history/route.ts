import { auth } from "@/lib/auth";
import { listSimulations } from "@/db/queries/simulations";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 100);

  try {
    const runs = await listSimulations(session.user.id, limit);
    return Response.json({ data: runs });
  } catch (err) {
    console.error("[simulation/history GET]", err);
    return Response.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
