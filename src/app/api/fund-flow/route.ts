import { NextResponse } from "next/server";
import { getFundFlowRank, isPeriod } from "@/lib/fund-flow";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period") ?? "3d";

  if (!isPeriod(periodParam)) {
    return NextResponse.json(
      { error: "period 仅支持 1d / 3d / 5d / 10d" },
      { status: 400 },
    );
  }

  try {
    const data = await getFundFlowRank(periodParam, 10);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "获取资金流向失败";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
