export type ScreenerFilters = {
  turnoverMin: number;
  turnoverMax: number;
  volRatioMin: number;
  volRatioMax: number;
  excludeST: boolean;
};

export const DEFAULT_SCREENER_FILTERS: ScreenerFilters = {
  turnoverMin: 5,
  turnoverMax: 10,
  volRatioMin: 2,
  volRatioMax: 3,
  excludeST: true,
};

export type ScreenerRow = {
  rank: number;
  code: string;
  name: string;
  market: "SH" | "SZ";
  sector: string;
  price: number | null;
  changePct: number | null;
  turnover: number;
  volRatio: number;
  quoteUrl: string;
};

export type ScreenerResponse = {
  filters: ScreenerFilters;
  updatedAt: string;
  source: string;
  scanned: number;
  rows: ScreenerRow[];
};

type EastMoneyQuote = Record<string, string | number | null | undefined>;

type EastMoneyPayload = {
  rc?: number;
  data?: {
    total?: number;
    diff?: EastMoneyQuote[] | Record<string, EastMoneyQuote>;
  };
};

const ASHARE_FS =
  "m:0+t:6+f:!2,m:0+t:13+f:!2,m:0+t:80+f:!2,m:1+t:2+f:!2,m:1+t:23+f:!2";

const REMOTE_HOSTS = [
  "https://push2delay.eastmoney.com",
  "https://82.push2.eastmoney.com",
  "https://88.push2.eastmoney.com",
  "https://push2.eastmoney.com",
];

const FIELDS = "f12,f13,f14,f2,f3,f8,f10,f100";

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value !== "-" && value !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function marketOf(f13: unknown): "SH" | "SZ" {
  return Number(f13) === 1 ? "SH" : "SZ";
}

function quoteUrl(code: string, market: "SH" | "SZ"): string {
  return `https://quote.eastmoney.com/${market.toLowerCase()}${code}.html`;
}

function isSTName(name: string): boolean {
  const normalized = name.toUpperCase().replace(/＊/g, "*");
  return normalized.includes("ST");
}

function buildPageUrl(host: string, page: number, pageSize: number): string {
  const base = host.replace(/\/$/, "");
  const path = `${base}/api/qt/clist/get`;
  const params = new URLSearchParams({
    pn: String(page),
    pz: String(pageSize),
    po: "1",
    np: "1",
    fltt: "2",
    invt: "2",
    fid: "f8",
    fs: ASHARE_FS,
    fields: FIELDS,
    ut: "fa5fd1943c7b386f172d6893dbfba10b",
    _: String(Date.now()),
  });
  return `${path}?${params.toString()}`;
}

function fetchJsonp(url: string, timeoutMs = 15_000): Promise<EastMoneyPayload> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      reject(new Error("JSONP 仅可在浏览器使用"));
      return;
    }

    const callbackName = `__emScreener_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("JSONP 超时"));
    }, timeoutMs);

    const cleanup = () => {
      window.clearTimeout(timer);
      script.remove();
      try {
        delete (window as unknown as Record<string, unknown>)[callbackName];
      } catch {
        (window as unknown as Record<string, unknown>)[callbackName] = undefined;
      }
    };

    (window as unknown as Record<string, unknown>)[callbackName] = (
      data: EastMoneyPayload,
    ) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("JSONP 加载失败"));
    };

    const joiner = url.includes("?") ? "&" : "?";
    script.src = `${url}${joiner}cb=${callbackName}`;
    document.body.appendChild(script);
  });
}

async function fetchPage(host: string, page: number, pageSize: number): Promise<EastMoneyPayload> {
  const requestUrl = buildPageUrl(host, page, pageSize);
  const isBrowser = typeof window !== "undefined";

  try {
    const response = await fetch(requestUrl, {
      ...(isBrowser
        ? {}
        : {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              Referer: "https://quote.eastmoney.com/center/gridlist.html",
              Accept: "application/json, text/plain, */*",
            },
          }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      throw new Error(`${host} 返回 ${response.status}`);
    }
    return (await response.json()) as EastMoneyPayload;
  } catch (error) {
    if (isBrowser && host.startsWith("http")) {
      return fetchJsonp(requestUrl);
    }
    throw error;
  }
}

function normalizeDiff(
  diff: EastMoneyQuote[] | Record<string, EastMoneyQuote> | undefined,
): EastMoneyQuote[] {
  if (!diff) return [];
  return Array.isArray(diff) ? diff : Object.values(diff);
}

export function parseScreenerFilters(
  input: Partial<ScreenerFilters> | URLSearchParams | null | undefined,
): ScreenerFilters {
  const base = { ...DEFAULT_SCREENER_FILTERS };
  if (!input) return base;

  const read = (key: keyof ScreenerFilters): unknown => {
    if (input instanceof URLSearchParams) {
      return input.get(key);
    }
    return input[key];
  };

  const turnoverMin = num(read("turnoverMin"));
  const turnoverMax = num(read("turnoverMax"));
  const volRatioMin = num(read("volRatioMin"));
  const volRatioMax = num(read("volRatioMax"));
  const excludeRaw = read("excludeST");

  return {
    turnoverMin: turnoverMin ?? base.turnoverMin,
    turnoverMax: turnoverMax ?? base.turnoverMax,
    volRatioMin: volRatioMin ?? base.volRatioMin,
    volRatioMax: volRatioMax ?? base.volRatioMax,
    excludeST:
      typeof excludeRaw === "boolean"
        ? excludeRaw
        : excludeRaw == null
          ? base.excludeST
          : !["0", "false", "no"].includes(String(excludeRaw).toLowerCase()),
  };
}

export async function screenTurnoverVolRatio(
  filters: ScreenerFilters = DEFAULT_SCREENER_FILTERS,
): Promise<ScreenerResponse> {
  const pageSize = 100;
  let lastError: unknown;

  for (const host of REMOTE_HOSTS) {
    try {
      const first = await fetchPage(host, 1, pageSize);
      const total = first.data?.total ?? 0;
      const quotes = [...normalizeDiff(first.data?.diff)];
      const pages = Math.max(1, Math.ceil(total / pageSize));

      for (let page = 2; page <= pages; page += 1) {
        const payload = await fetchPage(host, page, pageSize);
        quotes.push(...normalizeDiff(payload.data?.diff));
      }

      const rows: ScreenerRow[] = [];
      for (const item of quotes) {
        const name = String(item.f14 ?? "");
        if (!name) continue;
        if (filters.excludeST && isSTName(name)) continue;

        const turnover = num(item.f8);
        const volRatio = num(item.f10);
        if (turnover == null || volRatio == null) continue;
        if (turnover < filters.turnoverMin || turnover >= filters.turnoverMax) {
          continue;
        }
        if (volRatio < filters.volRatioMin || volRatio > filters.volRatioMax) {
          continue;
        }

        const code = String(item.f12 ?? "");
        const market = marketOf(item.f13);
        rows.push({
          rank: 0,
          code,
          name,
          market,
          sector: String(item.f100 ?? "--"),
          price: num(item.f2),
          changePct: num(item.f3),
          turnover,
          volRatio,
          quoteUrl: quoteUrl(code, market),
        });
      }

      rows.sort((a, b) => b.turnover - a.turnover || b.volRatio - a.volRatio);
      rows.forEach((row, index) => {
        row.rank = index + 1;
      });

      return {
        filters,
        updatedAt: new Date().toISOString(),
        source: "东方财富 · 沪深A股实时行情",
        scanned: quotes.length || total,
        rows,
      };
    } catch (error) {
      lastError = error;
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : "未知错误";
  throw new Error(`无法获取换手量比选股数据：${message}`);
}
