-- Multi-tenant SaaS schema. Idempotent: safe to re-run.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- Phase 2: users
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         citext not null unique,
  password_hash text not null,
  name          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Phase 3: organizations + memberships
create table if not exists organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        citext not null unique,
  created_by  uuid not null references users(id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

do $$ begin
  create type membership_role as enum ('admin', 'member');
exception when duplicate_object then null;
end $$;

create table if not exists memberships (
  user_id         uuid not null references users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role            membership_role not null default 'member',
  created_at      timestamptz not null default now(),
  primary key (user_id, organization_id)
);

create index if not exists memberships_org_idx on memberships(organization_id);
create index if not exists memberships_user_idx on memberships(user_id);

create table if not exists invitations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email           citext not null,
  role            membership_role not null default 'member',
  invited_by      uuid not null references users(id) on delete restrict,
  token           text not null unique,
  expires_at      timestamptz not null,
  accepted_at     timestamptz,
  created_at      timestamptz not null default now(),
  unique (organization_id, email)
);

create index if not exists invitations_org_idx on invitations(organization_id);

-- Phase 5: Stripe subscriptions, one per org.
do $$ begin
  create type subscription_status as enum (
    'trialing','active','past_due','canceled','incomplete','incomplete_expired','unpaid','paused'
  );
exception when duplicate_object then null;
end $$;

create table if not exists subscriptions (
  organization_id        uuid primary key references organizations(id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  stripe_price_id        text,
  status                 subscription_status,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  updated_at             timestamptz not null default now()
);
