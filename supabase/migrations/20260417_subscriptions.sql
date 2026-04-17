-- Add Stripe subscription fields to gwc_user_progress
alter table gwc_user_progress
  add column if not exists stripe_customer_id    text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status   text not null default 'free';
-- subscription_status values: 'free' | 'active' | 'canceled' | 'past_due'

create index if not exists gwc_user_progress_stripe_customer_id on gwc_user_progress (stripe_customer_id);
