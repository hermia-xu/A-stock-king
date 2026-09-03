import { FundFlowDashboard } from "@/components/fund-flow-dashboard";

export default function Home() {
  return <FundFlowDashboard initialPeriod="3d" initialData={null} />;
}
