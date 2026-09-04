import { NextResponse } from "next/server";
import {
  parseScreenerFilters,
  screenTurnoverVolRatio,
} from "@/lib/screener";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseScreenerFilters(searchParams);

  try {
    const data = await screenTurnoverVolRatio(filters);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "换手量比选股失败";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
