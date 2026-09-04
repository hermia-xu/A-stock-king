"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, RefreshCw, Activity } from "lucide-react";
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
import {
  DEFAULT_SCREENER_FILTERS,
  screenTurnoverVolRatio,
  type ScreenerFilters,
  type ScreenerResponse,
} from "@/lib/screener";
import {
  formatPct,
  formatPrice,
  formatUpdatedAt,
  signedClass,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const AUTO_REFRESH_MS = 60_000;

type Props = {
  initialData?: ScreenerResponse | null;
  initialError?: string | null;
};

export function ScreenerDashboard({
  initialData = null,
  initialError = null,
}: Props) {
  const [filters] = useState<ScreenerFilters>(DEFAULT_SCREENER_FILTERS);
  const [data, setData] = useState<ScreenerResponse | null>(initialData);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(!initialData && !initialError);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      const params = new URLSearchParams({
        turnoverMin: String(filters.turnoverMin),
        turnoverMax: String(filters.turnoverMax),
        volRatioMin: String(filters.volRatioMin),
        volRatioMax: String(filters.volRatioMax),
        excludeST: String(filters.excludeST),
      });

      let payload: ScreenerResponse | null = null;
      try {
        const response = await fetch(`${basePath}/api/screener?${params}`, {
          cache: "no-store",
        });
        if (response.ok) {
          const body = (await response.json()) as
            | ScreenerResponse
            | { error?: string };
          if ("rows" in body) {
            payload = body;
          }
        }
      } catch {
        // Fall through to direct East Money fetch.
      }

      if (!payload) {
        payload = await screenTurnoverVolRatio(filters);
      }

      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "选股刷新失败");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (initialData || initialError) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bootstrap remote screener
    void load();
  }, [initialData, initialError, load]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void load();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const showSkeleton = loading && !data;
  const leader = data?.rows[0] ?? null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            A 股 · 实时选股
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            换手量比选股
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            条件：换手率 {filters.turnoverMin}% ≤ x &lt; {filters.turnoverMax}%
            ，量比 {filters.volRatioMin}–{filters.volRatioMax}
            {filters.excludeST ? "，已排除 ST" : ""}
            。约每分钟自动刷新。
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          刷新
        </Button>
      </header>

      {error && !data ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-8">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              <p className="font-medium">选股暂时拉不到</p>
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => void load()}>
              再试一次
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {error && data ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>最新刷新失败：{error}。下方仍显示上次成功数据。</span>
        </div>
      ) : null}

      {showSkeleton ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : null}

      {data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground">
                  命中数量
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-tight">
                  {data.rows.length} 只
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  扫描 {data.scanned.toLocaleString("zh-CN")} 只沪深 A 股
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground">
                  换手最高
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-tight">
                  {leader ? leader.name : "--"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {leader
                    ? `${leader.code}.${leader.market} · 换手 ${leader.turnover.toFixed(2)}% · 量比 ${leader.volRatio.toFixed(2)}`
                    : "暂无命中"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground">
                  更新时间
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-tight">
                  {formatUpdatedAt(data.updatedAt)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{data.source}</p>
              </CardContent>
            </Card>
          </section>

          {data.rows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-base font-medium">当前无命中股票</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  盘中行情变化较快，可稍后再刷新。
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {data.rows.map((row) => (
                  <Card key={row.code}>
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
                        <div className="text-right font-mono text-lg font-semibold tabular-nums">
                          {row.turnover.toFixed(2)}%
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-md bg-muted/60 px-2 py-1.5">
                          <div className="text-muted-foreground">最新价</div>
                          <div className="mt-0.5 font-mono tabular-nums">
                            {formatPrice(row.price)}
                          </div>
                        </div>
                        <div className="rounded-md bg-muted/60 px-2 py-1.5">
                          <div className="text-muted-foreground">涨跌</div>
                          <div
                            className={cn(
                              "mt-0.5 font-mono tabular-nums",
                              signedClass(row.changePct),
                            )}
                          >
                            {formatPct(row.changePct)}
                          </div>
                        </div>
                        <div className="rounded-md bg-muted/60 px-2 py-1.5">
                          <div className="text-muted-foreground">量比</div>
                          <div className="mt-0.5 font-mono tabular-nums">
                            {row.volRatio.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="hidden overflow-hidden md:block">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="size-4" />
                    实时命中列表
                  </CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">排名</TableHead>
                      <TableHead>股票</TableHead>
                      <TableHead>行业</TableHead>
                      <TableHead className="text-right">最新价</TableHead>
                      <TableHead className="text-right">涨跌幅</TableHead>
                      <TableHead className="text-right">换手率</TableHead>
                      <TableHead className="text-right">量比</TableHead>
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
                            signedClass(row.changePct),
                          )}
                        >
                          {formatPct(row.changePct)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium tabular-nums">
                          {row.turnover.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {row.volRatio.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}

          <p className="text-xs leading-5 text-muted-foreground">
            数据来自东方财富公开行情接口，盘中实时变化。换手率为当日成交量/流通股本，量比为当日量相对近几日均量。仅供浏览，非投资建议。
          </p>
        </>
      ) : null}
    </div>
  );
}
