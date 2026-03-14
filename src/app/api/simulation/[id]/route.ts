import { auth } from "@/lib/auth";
import { getSimulationRun, getSimulationPaths } from "@/db/queries/simulations";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const run = await getSimulationRun(params.id);
    if (!run) return Response.json({ error: "Not found" }, { status: 404 });
    if (run.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let bands = null;
    if (run.status === "completed") {
      bands = await getSimulationPaths(params.id);
    }

    return Response.json({ data: { run, bands } });
  } catch (err) {
    console.error("[simulation/id GET]", err);
    return Response.json({ error: "Failed to fetch simulation" }, { status: 500 });
  }
}
