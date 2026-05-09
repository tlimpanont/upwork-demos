import { prisma } from "./prisma";

export type KPIs = {
  total: number;
  qualified: number;
  conversionRate: number; // 0..1
  avgScore: number | null;
  trend: {
    totalDelta: number;
    qualifiedDelta: number;
    conversionDelta: number;
    avgScoreDelta: number;
  };
};

export async function loadKPIs(): Promise<KPIs> {
  const [total, qualified, scoreAgg, since30, since60to30, qualifiedSince30, qualifiedSince60to30] =
    await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({
        where: { qualification: { in: ["Hot", "Warm"] } },
      }),
      prisma.lead.aggregate({ _avg: { aiScore: true } }),
      prisma.lead.count({ where: { createdAt: { gte: daysAgo(30) } } }),
      prisma.lead.count({
        where: {
          createdAt: { gte: daysAgo(60), lt: daysAgo(30) },
        },
      }),
      prisma.lead.count({
        where: {
          createdAt: { gte: daysAgo(30) },
          qualification: { in: ["Hot", "Warm"] },
        },
      }),
      prisma.lead.count({
        where: {
          createdAt: { gte: daysAgo(60), lt: daysAgo(30) },
          qualification: { in: ["Hot", "Warm"] },
        },
      }),
    ]);

  const conversionRate = total === 0 ? 0 : qualified / total;
  const conversion30 = since30 === 0 ? 0 : qualifiedSince30 / since30;
  const conversion60to30 =
    since60to30 === 0 ? 0 : qualifiedSince60to30 / since60to30;

  return {
    total,
    qualified,
    conversionRate,
    avgScore:
      scoreAgg._avg.aiScore == null
        ? null
        : Math.round(scoreAgg._avg.aiScore),
    trend: {
      totalDelta: pctChange(since60to30, since30),
      qualifiedDelta: pctChange(qualifiedSince60to30, qualifiedSince30),
      conversionDelta: conversion30 - conversion60to30,
      avgScoreDelta: 0, // computed below
    },
  };
}

export type ScoreBucket = { label: string; count: number };

export async function loadScoreDistribution(): Promise<ScoreBucket[]> {
  const leads = await prisma.lead.findMany({
    where: { aiScore: { not: null } },
    select: { aiScore: true },
  });
  const buckets: ScoreBucket[] = [
    { label: "0–19", count: 0 },
    { label: "20–39", count: 0 },
    { label: "40–59", count: 0 },
    { label: "60–79", count: 0 },
    { label: "80–100", count: 0 },
  ];
  for (const l of leads) {
    const s = l.aiScore!;
    if (s < 20) buckets[0]!.count++;
    else if (s < 40) buckets[1]!.count++;
    else if (s < 60) buckets[2]!.count++;
    else if (s < 80) buckets[3]!.count++;
    else buckets[4]!.count++;
  }
  return buckets;
}

export type DailyPoint = { date: string; total: number; qualified: number };

export async function loadLeadsOverTime(days = 30): Promise<DailyPoint[]> {
  const start = daysAgo(days);
  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: start } },
    select: { createdAt: true, qualification: true },
  });
  const byDay = new Map<string, { total: number; qualified: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    byDay.set(d.toISOString().slice(0, 10), { total: 0, qualified: 0 });
  }
  for (const l of leads) {
    const key = l.createdAt.toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (!bucket) continue;
    bucket.total += 1;
    if (l.qualification === "Hot" || l.qualification === "Warm") {
      bucket.qualified += 1;
    }
  }
  return Array.from(byDay.entries()).map(([date, v]) => ({ date, ...v }));
}

export type QualificationSlice = {
  label: "Hot" | "Warm" | "Cold" | "Pending";
  count: number;
};

export async function loadQualificationBreakdown(): Promise<QualificationSlice[]> {
  const grouped = await prisma.lead.groupBy({
    by: ["qualification"],
    _count: { _all: true },
  });
  const out: Record<QualificationSlice["label"], number> = {
    Hot: 0,
    Warm: 0,
    Cold: 0,
    Pending: 0,
  };
  for (const row of grouped) {
    if (row.qualification === "Hot") out.Hot = row._count._all;
    else if (row.qualification === "Warm") out.Warm = row._count._all;
    else if (row.qualification === "Cold") out.Cold = row._count._all;
    else out.Pending += row._count._all;
  }
  return [
    { label: "Hot", count: out.Hot },
    { label: "Warm", count: out.Warm },
    { label: "Cold", count: out.Cold },
    { label: "Pending", count: out.Pending },
  ];
}

function daysAgo(d: number): Date {
  const dt = new Date();
  dt.setUTCDate(dt.getUTCDate() - d);
  return dt;
}

function pctChange(prev: number, curr: number): number {
  if (prev === 0) return curr === 0 ? 0 : 1;
  return (curr - prev) / prev;
}