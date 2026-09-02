-- Push Notifications Cron Job
-- Run this in Supabase SQL Editor to set up scheduled notifications

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule push notifications to run daily at 8 PM (20:00) and 9 PM (21:00)
-- Timezone: America/Mexico_City (UTC-6)
SELECT cron.schedule(
  'send-evening-notifications',
  '0 20,21 * * *', -- 8 PM and 9 PM daily
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-push-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule weekly summary (every Sunday at 10 AM)
SELECT cron.schedule(
  'weekly-retention-summary',
  '0 10 * * 0', -- Every Sunday at 10 AM
  $$
  INSERT INTO circle_activity (user_id, activity_type, metadata)
  SELECT 
    user_id,
    'weekly_summary',
    jsonb_build_object(
      'checkins_this_week', (
        SELECT COUNT(*) 
        FROM retention_checkins 
        WHERE user_id = circle_activity.user_id 
        AND logged_at > NOW() - INTERVAL '7 days'
      ),
      'xp_gained', (
        SELECT COALESCE(SUM(xp_earned), 0)
        FROM retention_checkins 
        WHERE user_id = circle_activity.user_id 
        AND logged_at > NOW() - INTERVAL '7 days'
      )
    )
  FROM user_profiles
  WHERE last_active > NOW() - INTERVAL '30 days';
  $$
);
