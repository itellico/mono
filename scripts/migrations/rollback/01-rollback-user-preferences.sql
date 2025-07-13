-- Rollback Script: User Preferences Table
-- This script reverses the user_preferences table creation
-- Created: 2025-01-12

-- Step 1: Migrate data back to accounts table (if columns were dropped)
DO $$
BEGIN
    -- Check if columns were already dropped from accounts
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts' AND column_name = 'date_format'
    ) THEN
        -- Re-add columns to accounts table
        ALTER TABLE accounts 
        ADD COLUMN date_format VARCHAR(50),
        ADD COLUMN time_format VARCHAR(50),
        ADD COLUMN number_format VARCHAR(50),
        ADD COLUMN first_day_of_week INTEGER,
        ADD COLUMN language_locale VARCHAR(10),
        ADD COLUMN timezone VARCHAR(100),
        ADD COLUMN currency_code VARCHAR(3),
        ADD COLUMN currency_position VARCHAR(10),
        ADD COLUMN currency_space BOOLEAN,
        ADD COLUMN decimal_separator VARCHAR(1),
        ADD COLUMN thousands_separator VARCHAR(1),
        ADD COLUMN theme_preference VARCHAR(50),
        ADD COLUMN compact_mode BOOLEAN,
        ADD COLUMN show_seconds BOOLEAN,
        ADD COLUMN show_timezone BOOLEAN,
        ADD COLUMN use_relative_time BOOLEAN,
        ADD COLUMN relative_time_threshold INTEGER,
        ADD COLUMN relative_time_style VARCHAR(20),
        ADD COLUMN notification_time_format VARCHAR(10),
        ADD COLUMN email_notifications BOOLEAN,
        ADD COLUMN sms_notifications BOOLEAN;
    END IF;
END $$;

-- Step 2: Copy data back from user_preferences to accounts
UPDATE accounts a
SET 
    date_format = up.date_format,
    time_format = up.time_format,
    number_format = up.number_format,
    first_day_of_week = up.first_day_of_week,
    language_locale = up.language_locale,
    timezone = up.timezone,
    currency_code = up.currency_code,
    currency_position = up.currency_position,
    currency_space = up.currency_space,
    decimal_separator = up.decimal_separator,
    thousands_separator = up.thousands_separator,
    theme_preference = up.theme_preference,
    compact_mode = up.compact_mode,
    show_seconds = up.show_seconds,
    show_timezone = up.show_timezone,
    use_relative_time = up.use_relative_time,
    relative_time_threshold = up.relative_time_threshold,
    relative_time_style = up.relative_time_style,
    notification_time_format = up.notification_time_format,
    email_notifications = up.email_notifications,
    sms_notifications = up.sms_notifications
FROM user_preferences up
JOIN users u ON up.user_id = u.id
WHERE u.account_id = a.id;

-- Step 3: Drop the transition view
DROP VIEW IF EXISTS v_user_preferences_legacy;

-- Step 4: Drop the trigger
DROP TRIGGER IF EXISTS user_preferences_updated_at_trigger ON user_preferences;
DROP FUNCTION IF EXISTS update_user_preferences_updated_at();

-- Step 5: Drop indexes
DROP INDEX IF EXISTS idx_user_preferences_user_id;
DROP INDEX IF EXISTS idx_user_preferences_language_locale;
DROP INDEX IF EXISTS idx_user_preferences_timezone;

-- Step 6: Drop the user_preferences table
DROP TABLE IF EXISTS user_preferences;

-- Step 7: Log rollback completion
DO $$
DECLARE
    accounts_with_prefs INTEGER;
BEGIN
    SELECT COUNT(*) INTO accounts_with_prefs 
    FROM accounts 
    WHERE date_format IS NOT NULL 
    OR timezone IS NOT NULL
    OR theme_preference IS NOT NULL;
    
    RAISE NOTICE 'User preferences rollback completed.';
    RAISE NOTICE 'Accounts with preferences restored: %', accounts_with_prefs;
END $$;