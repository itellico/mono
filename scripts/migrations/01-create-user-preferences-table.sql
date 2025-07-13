-- Database Redesign Migration: Create User Preferences Table
-- Part of comprehensive database normalization effort
-- Created: 2025-01-12

-- Create user_preferences table to properly separate user-level settings from account-level
CREATE TABLE IF NOT EXISTS user_preferences (
    -- Primary key
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    
    -- User relation (one-to-one)
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Display preferences
    date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(50) DEFAULT '24h',
    number_format VARCHAR(50) DEFAULT '1,234.56',
    first_day_of_week INTEGER DEFAULT 0 CHECK (first_day_of_week >= 0 AND first_day_of_week <= 6),
    
    -- Localization preferences  
    language_locale VARCHAR(10) DEFAULT 'en-US',
    timezone VARCHAR(100) DEFAULT 'UTC',
    currency_code VARCHAR(3) DEFAULT 'USD',
    currency_position VARCHAR(10) DEFAULT 'before' CHECK (currency_position IN ('before', 'after')),
    currency_space BOOLEAN DEFAULT FALSE,
    decimal_separator VARCHAR(1) DEFAULT '.',
    thousands_separator VARCHAR(1) DEFAULT ',',
    
    -- UI preferences
    theme_preference VARCHAR(50) DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
    compact_mode BOOLEAN DEFAULT FALSE,
    show_seconds BOOLEAN DEFAULT FALSE,
    show_timezone BOOLEAN DEFAULT FALSE,
    
    -- Time display preferences
    use_relative_time BOOLEAN DEFAULT TRUE,
    relative_time_threshold INTEGER DEFAULT 24, -- hours before switching to absolute time
    relative_time_style VARCHAR(20) DEFAULT 'long' CHECK (relative_time_style IN ('long', 'short', 'narrow')),
    
    -- Notification preferences
    notification_time_format VARCHAR(10) DEFAULT '12h' CHECK (notification_time_format IN ('12h', '24h')),
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_language_locale ON user_preferences(language_locale);
CREATE INDEX idx_user_preferences_timezone ON user_preferences(timezone);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_updated_at_trigger
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_user_preferences_updated_at();

-- Add comments for documentation
COMMENT ON TABLE user_preferences IS 'User-specific preferences and settings, properly separated from account-level settings';
COMMENT ON COLUMN user_preferences.user_id IS 'One-to-one relation with users table';
COMMENT ON COLUMN user_preferences.first_day_of_week IS '0=Sunday, 1=Monday, etc.';
COMMENT ON COLUMN user_preferences.theme_preference IS 'User UI theme preference: light, dark, or system';
COMMENT ON COLUMN user_preferences.relative_time_threshold IS 'Hours before relative time (e.g., "2 hours ago") switches to absolute time';