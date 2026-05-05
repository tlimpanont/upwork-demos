import { createSchema } from "graphql-yoga";
import { resolvers } from "./resolvers";

export const typeDefs = /* GraphQL */ `
  enum TrendDirection {
    up
    down
    flat
  }

  enum Metric {
    revenue
    activeUsers
    newUsers
    churnRate
    conversions
  }

  type Trend {
    direction: TrendDirection!
    growthRate: Float!
  }

  type ForecastPoint {
    date: String!
    value: Float!
  }

  type Anomaly {
    date: String!
    value: Float!
    zScore: Float!
  }

  type Prediction {
    metric: Metric!
    predictedValue: Float!
    trend: Trend!
    confidence: Float!
    forecast: [ForecastPoint!]!
    horizonDays: Int!
  }

  type Insight {
    metric: Metric!
    summary: String!
    anomalyNotes: [String!]!
    recommendations: [String!]!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: String!
    channel: String!
  }

  type Revenue {
    id: ID!
    userId: ID!
    amount: Float!
    plan: String!
    timestamp: String!
  }

  type DailyMetric {
    date: String!
    revenue: Float!
    activeUsers: Int!
    newUsers: Int!
    churnRate: Float!
    conversions: Int!
  }

  type Query {
    users(limit: Int = 50): [User!]!
    revenue(limit: Int = 100): [Revenue!]!
    metrics(from: String, to: String): [DailyMetric!]!
    predictions(metric: Metric!, horizon: Int = 14): Prediction!
    anomalies(metric: Metric!): [Anomaly!]!
    insights(metric: Metric!): Insight!
  }
`;

export const schema = createSchema({ typeDefs, resolvers });
