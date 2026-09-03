"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertCircle, RefreshCw, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PERIOD_CHANGE_LABEL,
  PERIOD_LABEL,
  PERIODS,
  type FundFlowResponse,
  type FundFlowRow,
  type Period,
} from "@/lib/fund-flow";
import {
  formatPct,
  formatPrice,
  formatUpdatedAt,
  formatYi,
  formatYiPlain,
  signedClass,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  initialPeriod: Period;
  initialData: FundFlowResponse | null;
  initialError?: string | null;
};

export function FundFlowDashboard({
  initialPeriod,
  initialData,
  initialError,
}: Props) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [cache, setCache] = useState<Partial<Record<Period, FundFlowResponse>>>(
    () => (initialData ? { [initialPeriod]: initialData } : {}),
  );
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(false);
  const data = cache[period] ?? null;

  const load = useCallback(async (nextPeriod: Period) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/fund-flow?period=${nextPeriod}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | FundFlowResponse
        | { error?: string };
      if (!response.ok || !("rows" in payload)) {
        const message =
          "error" in payload && payload.error
            ? payload.error
            : "刷新排行失败";
        throw new Error(message);
      }
      setCache((prev) => ({ ...prev, [nextPeriod]: payload }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "刷新排行失败");
    } finally {
      setLoading(false);
    }
  }, []);

  function selectPeriod(next: Period) {
    setPeriod(next);
    if (next !== period) {
      void load(next);
    }
  }

  const maxAbs = useMemo(() => {
    if (!data?.rows.length) return 1;
    return Math.max(...data.rows.map((row) => Math.abs(row.mainNet)), 1);
  }, [data]);

  const totalMain = useMemo(
    () => data?.rows.reduce((sum, row) => sum + row.mainNet, 0) ?? 0,
    [data],
  );

  const leader = data?.rows[0] ?? null;
  const showSkeleton = loading && !data;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            A 股 · 主力资金
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {PERIOD_LABEL[period]}资金净流入前十
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            按东方财富主力净流入（超大单 + 大单）排序，覆盖沪深主板、创业板与科创板。金额单位为人民币亿元。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void load(period)}
            disabled={loading}
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            刷新
          </Button>
        </div>
      </header>

      <Tabs
        value={period}
        onValueChange={(value) => selectPeriod(value as Period)}
      >
        <TabsList className="h-auto flex-wrap">
          {PERIODS.map((item) => (
            <TabsTrigger key={item} value={item}>
              {PERIOD_LABEL[item]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error && !data ? (
        <ErrorPanel message={error} onRetry={() => void load(period)} />
      ) : null}

      {error && data ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>最新刷新失败：{error}。下方仍显示上次成功数据。</span>
        </div>
      ) : null}

      {showSkeleton ? (
        <LoadingState />
      ) : data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              label="净流入第一"
              value={leader ? leader.name : "--"}
              hint={
                leader
                  ? `${leader.market}${leader.code} · ${formatYi(leader.mainNet)}`
                  : "暂无数据"
              }
            />
            <SummaryCard
              label="前十合计主力净流入"
              value={formatYiPlain(totalMain)}
              hint={`样本 ${data.totalUniverse.toLocaleString("zh-CN")} 只沪深 A 股`}
              valueClass={signedClass(totalMain)}
            />
            <SummaryCard
              label="行情时间"
              value={data.quoteTime ?? "收盘后或非交易时段"}
              hint={`${data.source} · 拉取于 ${formatUpdatedAt(data.updatedAt)}`}
            />
          </section>

          {data.rows.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="size-4" />
                    主力净流入对比
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {data.rows.map((row) => (
                    <BarRow key={row.code} row={row} maxAbs={maxAbs} />
                  ))}
                </CardContent>
              </Card>

              <div className="grid gap-3 md:hidden">
                {data.rows.map((row) => (
                  <MobileCard
                    key={row.code}
                    row={row}
                    period={period}
                  />
                ))}
              </div>

              <Card className="hidden overflow-hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">排名</TableHead>
                      <TableHead>股票</TableHead>
                      <TableHead>行业</TableHead>
                      <TableHead className="text-right">最新价</TableHead>
                      <TableHead className="text-right">今日涨跌</TableHead>
                      <TableHead className="text-right">
                        {PERIOD_CHANGE_LABEL[period]}
                      </TableHead>
                      <TableHead className="text-right">主力净流入</TableHead>
                      <TableHead className="text-right">净占比</TableHead>
                      <TableHead className="text-right">超大单</TableHead>
                      <TableHead className="text-right">大单</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((row) => (
                      <TableRow key={row.code}>
                        <TableCell className="font-mono tabular-nums">
                          {row.rank}
                        </TableCell>
                        <TableCell>
                          <a
                            href={row.quoteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-primary"
                          >
                            <div className="font-medium">{row.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">
                              {row.code}.{row.market}
                            </div>
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{row.sector}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatPrice(row.price)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono tabular-nums",
                            signedClass(row.todayChangePct),
                          )}
                        >
                          {formatPct(row.todayChangePct)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono tabular-nums",
                            signedClass(row.periodChangePct),
                          )}
                        >
                          {formatPct(row.periodChangePct)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono font-medium tabular-nums",
                            signedClass(row.mainNet),
                          )}
                        >
                          {formatYi(row.mainNet)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono tabular-nums",
                            signedClass(row.mainPct),
                          )}
                        >
                          {formatPct(row.mainPct)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono tabular-nums",
                            signedClass(row.superNet),
                          )}
                        >
                          {formatYi(row.superNet)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono tabular-nums",
                            signedClass(row.largeNet),
                          )}
                        >
                          {formatYi(row.largeNet)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}

          <p className="text-xs leading-5 text-muted-foreground">
            数据来自东方财富公开行情接口，非投资建议。主力净流入为超大单与大单净额之和；三日、五日、十日为对应交易日累计。盘中为实时估算，收盘后以东财数据中心为准。
          </p>
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  valueClass,
}: {
  label: string;
  value: string;
  hint: string;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-2xl font-semibold tracking-tight", valueClass)}>
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function BarRow({ row, maxAbs }: { row: FundFlowRow; maxAbs: number }) {
  const width = Math.max(6, (Math.abs(row.mainNet) / maxAbs) * 100);
  return (
    <div className="grid grid-cols-[7rem_1fr_6.5rem] items-center gap-3 sm:grid-cols-[9rem_1fr_7.5rem]">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{row.name}</div>
        <div className="font-mono text-[11px] text-muted-foreground">
          {row.code}
        </div>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            row.mainNet >= 0 ? "bg-up" : "bg-down",
          )}
          style={{ width: `${width}%` }}
        />
      </div>
      <div
        className={cn(
          "text-right font-mono text-sm tabular-nums",
          signedClass(row.mainNet),
        )}
      >
        {formatYi(row.mainNet)}
      </div>
    </div>
  );
}

function MobileCard({ row, period }: { row: FundFlowRow; period: Period }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                #{row.rank}
              </span>
              <a
                href={row.quoteUrl}
                target="_blank"
                rel="noreferrer"
                className="text-base font-semibold"
              >
                {row.name}
              </a>
            </div>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {row.code}.{row.market} · {row.sector}
            </p>
          </div>
          <div className={cn("text-right font-mono text-lg font-semibold tabular-nums", signedClass(row.mainNet))}>
            {formatYi(row.mainNet)}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Metric label="最新价" value={formatPrice(row.price)} />
          <Metric
            label="今日涨跌"
            value={formatPct(row.todayChangePct)}
            className={signedClass(row.todayChangePct)}
          />
          <Metric
            label={PERIOD_CHANGE_LABEL[period]}
            value={formatPct(row.periodChangePct)}
            className={signedClass(row.periodChangePct)}
          />
          <Metric
            label="净占比"
            value={formatPct(row.mainPct)}
            className={signedClass(row.mainPct)}
          />
          <Metric
            label="超大单"
            value={formatYi(row.superNet)}
            className={signedClass(row.superNet)}
          />
          <Metric
            label="大单"
            value={formatYi(row.largeNet)}
            className={signedClass(row.largeNet)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-md bg-muted/60 px-2 py-1.5">
      <div className="text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 font-mono tabular-nums", className)}>
        {value}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-base font-medium">暂无排行数据</p>
        <p className="mt-1 text-sm text-muted-foreground">
          非交易日或接口尚未更新时可能为空，请稍后再试。
        </p>
      </CardContent>
    </Card>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 py-8">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="size-5" />
          <p className="font-medium">排行暂时拉不到</p>
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" onClick={onRetry}>
          再试一次
        </Button>
      </CardContent>
    </Card>
  );
}
