const shanghaiFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function yuanToYi(yuan: number): number {
  return yuan / 1e8;
}

export function formatYi(yuan: number, digits = 2): string {
  const yi = yuanToYi(yuan);
  const abs = Math.abs(yi).toFixed(digits);
  if (yi > 0) return `+${abs} 亿`;
  if (yi < 0) return `-${abs} 亿`;
  return `${abs} 亿`;
}

export function formatYiPlain(yuan: number, digits = 2): string {
  return `${yuanToYi(yuan).toFixed(digits)} 亿`;
}

export function formatPct(value: number | null): string {
  if (value === null) return "--";
  const abs = Math.abs(value).toFixed(2);
  if (value > 0) return `+${abs}%`;
  if (value < 0) return `-${abs}%`;
  return `${abs}%`;
}

export function formatPrice(value: number | null): string {
  if (value === null) return "--";
  return value.toFixed(2);
}

export function signedClass(value: number | null | undefined): string {
  if (value == null || value === 0) return "text-muted-foreground";
  return value > 0 ? "text-up" : "text-down";
}

export function formatUpdatedAt(iso: string): string {
  return shanghaiFormatter.format(new Date(iso));
}
