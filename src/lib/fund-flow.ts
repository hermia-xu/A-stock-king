export const PERIODS = ["1d", "3d", "5d", "10d"] as const;
export type Period = (typeof PERIODS)[number];

export const PERIOD_LABEL: Record<Period, string> = {
  "1d": "今日",
  "3d": "近三日",
  "5d": "近五日",
  "10d": "近十日",
};

export const PERIOD_CHANGE_LABEL: Record<Period, string> = {
  "1d": "今日涨跌",
  "3d": "三日涨跌",
  "5d": "五日涨跌",
  "10d": "十日涨跌",
};

type PeriodFields = {
  fid: string;
  change: string;
  main: string;
  mainPct: string;
  super: string;
  superPct: string;
  large: string;
  largePct: string;
  mid: string;
  midPct: string;
  small: string;
  smallPct: string;
};

const PERIOD_FIELDS: Record<Period, PeriodFields> = {
  "1d": {
    fid: "f62",
    change: "f3",
    main: "f62",
    mainPct: "f184",
    super: "f66",
    superPct: "f69",
    large: "f72",
    largePct: "f75",
    mid: "f78",
    midPct: "f81",
    small: "f84",
    smallPct: "f87",
  },
  "3d": {
    fid: "f267",
    change: "f127",
    main: "f267",
    mainPct: "f268",
    super: "f269",
    superPct: "f270",
    large: "f271",
    largePct: "f272",
    mid: "f273",
    midPct: "f274",
    small: "f275",
    smallPct: "f276",
  },
  "5d": {
    fid: "f164",
    change: "f109",
    main: "f164",
    mainPct: "f165",
    super: "f166",
    superPct: "f167",
    large: "f168",
    largePct: "f169",
    mid: "f170",
    midPct: "f171",
    small: "f172",
    smallPct: "f173",
  },
  "10d": {
    fid: "f174",
    change: "f160",
    main: "f174",
    mainPct: "f175",
    super: "f176",
    superPct: "f177",
    large: "f178",
    largePct: "f179",
    mid: "f180",
    midPct: "f181",
    small: "f182",
    smallPct: "f183",
  },
};

export type FundFlowRow = {
  rank: number;
  code: string;
  name: string;
  market: "SH" | "SZ";
  sector: string;
  price: number | null;
  todayChangePct: number | null;
  periodChangePct: number | null;
  mainNet: number;
  mainPct: number | null;
  superNet: number;
  superPct: number | null;
  largeNet: number;
  largePct: number | null;
  midNet: number;
  midPct: number | null;
  smallNet: number;
  smallPct: number | null;
  quoteUrl: string;
};

export type FundFlowResponse = {
  period: Period;
  periodLabel: string;
  updatedAt: string;
  quoteTime: string | null;
  source: string;
  totalUniverse: number;
  rows: FundFlowRow[];
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

const HOSTS = [
  "https://82.push2.eastmoney.com",
  "https://push2delay.eastmoney.com",
  "https://88.push2.eastmoney.com",
  "https://push2.eastmoney.com",
];

const COMMON_FIELDS =
  "f12,f13,f14,f2,f3,f62,f100,f124,f127,f109,f160,f184,f66,f69,f72,f75,f78,f81,f84,f87,f267,f268,f269,f270,f271,f272,f273,f274,f275,f276,f164,f165,f166,f167,f168,f169,f170,f171,f172,f173,f174,f175,f176,f177,f178,f179,f180,f181,f182,f183";

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value !== "-" && value !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function requiredNum(value: unknown): number {
  return num(value) ?? 0;
}

function marketOf(f13: unknown): "SH" | "SZ" {
  return Number(f13) === 1 ? "SH" : "SZ";
}

function quoteUrl(code: string, market: "SH" | "SZ"): string {
  return `https://quote.eastmoney.com/${market.toLowerCase()}${code}.html`;
}

function formatQuoteTime(unixSeconds: number | null): string | null {
  if (!unixSeconds) return null;
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

async function fetchFromHost(
  host: string,
  period: Period,
  limit: number,
): Promise<EastMoneyPayload> {
  const fields = PERIOD_FIELDS[period];
  const url = new URL("/api/qt/clist/get", host);
  url.searchParams.set("fid", fields.fid);
  url.searchParams.set("po", "1");
  url.searchParams.set("pz", String(limit));
  url.searchParams.set("pn", "1");
  url.searchParams.set("np", "1");
  url.searchParams.set("fltt", "2");
  url.searchParams.set("invt", "2");
  url.searchParams.set("ut", "fa5fd1943c7b386f172d6893dbfba10b");
  url.searchParams.set("fs", ASHARE_FS);
  url.searchParams.set("fields", COMMON_FIELDS);
  url.searchParams.set("_", String(Date.now()));

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Referer: "https://data.eastmoney.com/zjlx/detail.html",
      Accept: "application/json, text/plain, */*",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`${host} 返回 ${response.status}`);
  }

  return (await response.json()) as EastMoneyPayload;
}

export function isPeriod(value: string | null | undefined): value is Period {
  return PERIODS.includes(value as Period);
}

export async function getFundFlowRank(
  period: Period,
  limit = 10,
): Promise<FundFlowResponse> {
  const fields = PERIOD_FIELDS[period];
  let lastError: unknown;

  for (const host of HOSTS) {
    try {
      const payload = await fetchFromHost(host, period, limit);
      const diff = payload.data?.diff;
      const list = Array.isArray(diff)
        ? diff
        : diff
          ? Object.values(diff)
          : [];

      if (!list.length) {
        throw new Error("接口未返回排行数据");
      }

      const rows: FundFlowRow[] = list.slice(0, limit).map((item, index) => {
        const code = String(item.f12 ?? "");
        const market = marketOf(item.f13);
        return {
          rank: index + 1,
          code,
          name: String(item.f14 ?? "--"),
          market,
          sector: String(item.f100 ?? "--"),
          price: num(item.f2),
          todayChangePct: num(item.f3),
          periodChangePct: num(item[fields.change]),
          mainNet: requiredNum(item[fields.main]),
          mainPct: num(item[fields.mainPct]),
          superNet: requiredNum(item[fields.super]),
          superPct: num(item[fields.superPct]),
          largeNet: requiredNum(item[fields.large]),
          largePct: num(item[fields.largePct]),
          midNet: requiredNum(item[fields.mid]),
          midPct: num(item[fields.midPct]),
          smallNet: requiredNum(item[fields.small]),
          smallPct: num(item[fields.smallPct]),
          quoteUrl: quoteUrl(code, market),
        };
      });

      const quoteUnix = num(list[0]?.f124);

      return {
        period,
        periodLabel: PERIOD_LABEL[period],
        updatedAt: new Date().toISOString(),
        quoteTime: formatQuoteTime(quoteUnix),
        source: "东方财富 · 个股资金流向",
        totalUniverse: payload.data?.total ?? rows.length,
        rows,
      };
    } catch (error) {
      lastError = error;
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : "未知错误";
  throw new Error(`无法获取东方财富资金流向数据：${message}`);
}
