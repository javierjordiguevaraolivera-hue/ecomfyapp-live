create schema if not exists push_notificaciones_ecomfyapp;

create table if not exists push_notificaciones_ecomfyapp.push_subscriptions (
  endpoint text primary key,
  subscription jsonb not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists push_notificaciones_ecomfyapp.push_notification_deliveries (
  lead_id text primary key,
  sent_at timestamptz not null default now()
);

create table if not exists push_notificaciones_ecomfyapp.push_cron_state (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
