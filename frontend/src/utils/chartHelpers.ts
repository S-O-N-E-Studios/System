interface SeriesPoint {
  month: string;
  amount: number;
}

export function buildChartData(forecastData: SeriesPoint[], actualData: SeriesPoint[]) {
  const byMonth = new Map<string, { month: string; expected?: number; actual?: number }>();

  forecastData.forEach((p) => {
    const existing = byMonth.get(p.month) ?? { month: p.month };
    existing.expected = p.amount;
    byMonth.set(p.month, existing);
  });

  actualData.forEach((p) => {
    const existing = byMonth.get(p.month) ?? { month: p.month };
    existing.actual = p.amount;
    byMonth.set(p.month, existing);
  });

  return Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function formatAxis(value: number): string {
  if (value >= 1_000_000) return `R ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R ${(value / 1_000).toFixed(0)}k`;
  return `R ${value}`;
}
