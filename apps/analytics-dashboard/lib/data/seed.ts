import { Channel, Plan } from "../../prisma/generated/client";
import { faker } from "@faker-js/faker";

// Deterministic seed so the dataset is identical across runs. Important for
// the prediction engine's regression tests and for repeatable demo screenshots.
export const FAKER_SEED = 42;

const DAYS = 365;
const PLAN_PRICES: Record<Plan, number> = { basic: 19, pro: 49, enterprise: 199 };
const PLAN_WEIGHTS: Record<Plan, number> = { basic: 0.6, pro: 0.3, enterprise: 0.1 };
const CHANNEL_WEIGHTS: Record<Channel, number> = {
  organic: 0.45,
  ads: 0.25,
  referral: 0.2,
  email: 0.1,
};

export type DailyMetricRow = {
  date: Date;
  activeUsers: number;
  newUsers: number;
  churnRate: number;
  revenue: number;
  conversions: number;
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  channel: Channel;
  plan: Plan;
};

export type RevenueEventRow = {
  id: string;
  userId: string;
  amount: number;
  plan: Plan;
  timestamp: Date;
};

// Deterministic PRNG for the parts that shouldn't depend on faker. Keeps the
// trend/spike math reproducible even if faker's internal sequence shifts.
function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng: () => number) {
  const u = 1 - rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function pickWeighted<T extends string>(
  rng: () => number,
  weights: Record<T, number>,
): T {
  const r = rng();
  let acc = 0;
  for (const key of Object.keys(weights) as T[]) {
    acc += weights[key];
    if (r <= acc) return key;
  }
  return Object.keys(weights)[0] as T;
}

function startOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function buildDailyMetrics(now = new Date()): DailyMetricRow[] {
  const rng = mulberry32(FAKER_SEED);
  const today = startOfDayUTC(now);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - (DAYS - 1));

  // Marketing spike events (day index, intensity multiplier) and a churn dip.
  const spikes = [
    { day: 60, magnitude: 1.45 },
    { day: 180, magnitude: 1.7 },
    { day: 310, magnitude: 1.55 },
  ];
  const churnDip = { start: 220, end: 250, magnitude: 1.9 };

  const rows: DailyMetricRow[] = [];
  for (let i = 0; i < DAYS; i++) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);

    // Baseline + slight linear growth + weekly seasonality + spikes + noise.
    const baseline = 1200;
    const growth = i * 4.8;
    const weekly = 90 * Math.sin((i / 7) * 2 * Math.PI);
    const spikeBoost = spikes
      .filter((s) => Math.abs(i - s.day) <= 4)
      .reduce(
        (acc, s) => acc + (baseline + growth) * (s.magnitude - 1) * Math.exp(-Math.pow(i - s.day, 2) / 6),
        0,
      );
    const noise = gauss(rng) * 70;
    const activeUsers = Math.max(0, Math.round(baseline + growth + weekly + spikeBoost + noise));

    const newUsers = Math.max(
      0,
      Math.round(activeUsers * 0.022 + spikeBoost * 0.15 + gauss(rng) * 6),
    );

    const inDip = i >= churnDip.start && i <= churnDip.end;
    const churnRate = Math.max(
      0.005,
      0.028 + (inDip ? 0.022 * churnDip.magnitude : 0) + gauss(rng) * 0.004,
    );

    const arpu = 19 * 0.6 + 49 * 0.3 + 199 * 0.1;
    const revenue = +(activeUsers * (arpu / 30) + gauss(rng) * 60).toFixed(2);

    const conversions = Math.max(0, Math.round(newUsers * 0.12 + gauss(rng) * 2));

    rows.push({ date, activeUsers, newUsers, churnRate: +churnRate.toFixed(4), revenue, conversions });
  }
  return rows;
}

export function buildUsersAndRevenue(metrics: DailyMetricRow[]): {
  users: UserRow[];
  events: RevenueEventRow[];
} {
  faker.seed(FAKER_SEED);
  const rng = mulberry32(FAKER_SEED + 1);

  const users: UserRow[] = [];
  for (const m of metrics) {
    for (let i = 0; i < m.newUsers; i++) {
      const channel = pickWeighted(rng, CHANNEL_WEIGHTS);
      const plan = pickWeighted(rng, PLAN_WEIGHTS);
      users.push({
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        createdAt: m.date,
        channel,
        plan,
      });
    }
  }

  // Dedupe emails (faker can collide on large counts).
  const seen = new Set<string>();
  const uniqueUsers: UserRow[] = [];
  for (const u of users) {
    if (seen.has(u.email)) continue;
    seen.add(u.email);
    uniqueUsers.push(u);
  }

  // Revenue events: monthly recurring per user from createdAt → today, with
  // ~12% one-off bursts and ~8% per-month churn drop-off.
  const today = startOfDayUTC(new Date());
  const events: RevenueEventRow[] = [];
  for (const u of uniqueUsers) {
    const cursor = new Date(u.createdAt);
    let alive = true;
    while (alive && cursor <= today) {
      const jitter = 1 + (rng() - 0.5) * 0.1;
      events.push({
        id: faker.string.uuid(),
        userId: u.id,
        amount: +(PLAN_PRICES[u.plan] * jitter).toFixed(2),
        plan: u.plan,
        timestamp: new Date(cursor),
      });
      if (rng() < 0.12) {
        events.push({
          id: faker.string.uuid(),
          userId: u.id,
          amount: +(PLAN_PRICES[u.plan] * (0.5 + rng())).toFixed(2),
          plan: u.plan,
          timestamp: new Date(cursor.getTime() + rng() * 30 * 24 * 3600 * 1000),
        });
      }
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      if (rng() < 0.08) alive = false;
    }
  }

  return { users: uniqueUsers, events };
}
