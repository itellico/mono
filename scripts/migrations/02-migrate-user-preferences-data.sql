-- Database Redesign Migration: Migrate User Preferences from Accounts to User Preferences
-- Part of comprehensive database normalization effort
-- Created: 2025-01-12

-- First, insert user preferences for all users based on their account settings
INSERT INTO user_preferences (
    user_id,
    date_format,
    time_format,
    number_format,
    first_day_of_week,
    language_locale,
    timezone,
    currency_code,
    currency_position,
    currency_space,
    decimal_separator,
    thousands_separator,
    theme_preference,
    compact_mode,
    show_seconds,
    show_timezone,
    use_relative_time,
    relative_time_threshold,
    relative_time_style,
    notification_time_format,
    email_notifications,
    sms_notifications
)
SELECT DISTINCT ON (u.id)
    u.id as user_id,
    COALESCE(a.date_format, 'YYYY-MM-DD') as date_format,
    COALESCE(a.time_format, '24h') as time_format,
    COALESCE(a.number_format, '1,234.56') as number_format,
    COALESCE(a.first_day_of_week, 0) as first_day_of_week,
    COALESCE(a.language_locale, 'en-US') as language_locale,
    COALESCE(a.timezone, 'UTC') as timezone,
    COALESCE(a.currency_code, 'USD') as currency_code,
    COALESCE(a.currency_position, 'before') as currency_position,
    COALESCE(a.currency_space, FALSE) as currency_space,
    COALESCE(a.decimal_separator, '.') as decimal_separator,
    COALESCE(a.thousands_separator, ',') as thousands_separator,
    COALESCE(a.theme_preference, 'system') as theme_preference,
    COALESCE(a.compact_mode, FALSE) as compact_mode,
    COALESCE(a.show_seconds, FALSE) as show_seconds,
    COALESCE(a.show_timezone, FALSE) as show_timezone,
    COALESCE(a.use_relative_time, TRUE) as use_relative_time,
    COALESCE(a.relative_time_threshold, 24) as relative_time_threshold,
    COALESCE(a.relative_time_style, 'long') as relative_time_style,
    COALESCE(a.notification_time_format, '12h') as notification_time_format,
    COALESCE(a.email_notifications, TRUE) as email_notifications,
    COALESCE(a.sms_notifications, FALSE) as sms_notifications
FROM users u
JOIN accounts a ON u.account_id = a.id
WHERE NOT EXISTS (
    SELECT 1 FROM user_preferences up WHERE up.user_id = u.id
)
ORDER BY u.id, u.created_at;

-- Log migration stats
DO $$
DECLARE
    migrated_count INTEGER;
    total_users INTEGER;
    r RECORD;
BEGIN
    SELECT COUNT(*) INTO migrated_count FROM user_preferences;
    SELECT COUNT(*) INTO total_users FROM users;
    
    RAISE NOTICE 'Migrated preferences for % out of % users', migrated_count, total_users;
    
    -- Log any users without preferences
    IF migrated_count < total_users THEN
        RAISE WARNING 'Some users do not have preferences migrated. User IDs without preferences:';
        
        FOR r IN 
            SELECT u.id, u.username 
            FROM users u 
            WHERE NOT EXISTS (SELECT 1 FROM user_preferences up WHERE up.user_id = u.id)
        LOOP
            RAISE WARNING 'User ID: %, Username: %', r.id, r.username;
        END LOOP;
    END IF;
END $$;

-- Create a view to help with the transition period
CREATE OR REPLACE VIEW v_user_preferences_legacy AS
SELECT 
    u.id as user_id,
    u.username,
    COALESCE(up.date_format, a.date_format) as date_format,
    COALESCE(up.time_format, a.time_format) as time_format,
    COALESCE(up.language_locale, a.language_locale) as language_locale,
    COALESCE(up.timezone, a.timezone) as timezone,
    COALESCE(up.currency_code, a.currency_code) as currency_code,
    COALESCE(up.theme_preference, a.theme_preference) as theme_preference,
    CASE 
        WHEN up.id IS NOT NULL THEN 'user_preferences'
        ELSE 'accounts'
    END as source_table
FROM users u
LEFT JOIN user_preferences up ON u.id = up.user_id
LEFT JOIN accounts a ON u.account_id = a.id;

COMMENT ON VIEW v_user_preferences_legacy IS 'Transition view to help migrate from account-based to user-based preferences';