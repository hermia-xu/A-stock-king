"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FundFlowDashboard } from "@/components/fund-flow-dashboard";
import { ScreenerDashboard } from "@/components/screener-dashboard";

type View = "fund-flow" | "screener";

export function AppShell() {
  const [view, setView] = useState<View>("screener");

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="text-sm font-semibold tracking-tight">A股看板</div>
          <Tabs
            value={view}
            onValueChange={(value) => setView(value as View)}
          >
            <TabsList>
              <TabsTrigger value="screener">换手量比选股</TabsTrigger>
              <TabsTrigger value="fund-flow">资金净流入</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {view === "screener" ? (
        <ScreenerDashboard />
      ) : (
        <FundFlowDashboard initialPeriod="3d" initialData={null} />
      )}
    </div>
  );
}
