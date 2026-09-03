import { FundFlowDashboard } from "@/components/fund-flow-dashboard";
import { getFundFlowRank } from "@/lib/fund-flow";

export const dynamic = "force-dynamic";

export default async function Home() {
  let initialData = null;
  let initialError: string | null = null;

  try {
    initialData = await getFundFlowRank("3d", 10);
  } catch (error) {
    initialError =
      error instanceof Error ? error.message : "无法获取近三日资金流向";
  }

  return (
    <FundFlowDashboard
      initialPeriod="3d"
      initialData={initialData}
      initialError={initialError}
    />
  );
}
