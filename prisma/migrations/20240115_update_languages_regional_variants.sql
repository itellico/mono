-- Migration: Update languages table to support full regional variants
-- Following best practices from major SaaS platforms

-- First, let's backup existing data
CREATE TEMP TABLE languages_backup AS SELECT * FROM languages;

-- Clear existing data to avoid conflicts
TRUNCATE TABLE languages CASCADE;

-- Insert all regional variants matching the frontend locale system
INSERT INTO languages (
    code, 
    iso639_1, 
    iso639_2, 
    name, 
    native_name, 
    direction, 
    family, 
    speakers, 
    is_active, 
    display_order
) VALUES
-- English variants (most important for global SaaS)
('en-US', 'en', 'eng', 'English (United States)', 'English (United States)', 'ltr', 'Germanic', 330000000, true, 1),
('en-GB', 'en', 'eng', 'English (United Kingdom)', 'English (United Kingdom)', 'ltr', 'Germanic', 67000000, true, 2),
('en-CA', 'en', 'eng', 'English (Canada)', 'English (Canada)', 'ltr', 'Germanic', 20000000, true, 3),
('en-AU', 'en', 'eng', 'English (Australia)', 'English (Australia)', 'ltr', 'Germanic', 25000000, true, 4),

-- German variants (strong European market)
('de-DE', 'de', 'deu', 'German (Germany)', 'Deutsch (Deutschland)', 'ltr', 'Germanic', 83000000, true, 10),
('de-AT', 'de', 'deu', 'German (Austria)', 'Deutsch (Österreich)', 'ltr', 'Germanic', 9000000, true, 11),
('de-CH', 'de', 'deu', 'German (Switzerland)', 'Deutsch (Schweiz)', 'ltr', 'Germanic', 5000000, true, 12),

-- French variants (global francophone market)
('fr-FR', 'fr', 'fra', 'French (France)', 'Français (France)', 'ltr', 'Romance', 67000000, true, 20),
('fr-CA', 'fr', 'fra', 'French (Canada)', 'Français (Canada)', 'ltr', 'Romance', 10000000, true, 21),
('fr-CH', 'fr', 'fra', 'French (Switzerland)', 'Français (Suisse)', 'ltr', 'Romance', 2000000, true, 22),

-- Spanish variants (huge global market)
('es-ES', 'es', 'spa', 'Spanish (Spain)', 'Español (España)', 'ltr', 'Romance', 47000000, true, 30),
('es-MX', 'es', 'spa', 'Spanish (Mexico)', 'Español (México)', 'ltr', 'Romance', 130000000, true, 31),
('es-AR', 'es', 'spa', 'Spanish (Argentina)', 'Español (Argentina)', 'ltr', 'Romance', 45000000, true, 32),

-- Portuguese variants (Brazil is huge market)
('pt-BR', 'pt', 'por', 'Portuguese (Brazil)', 'Português (Brasil)', 'ltr', 'Romance', 215000000, true, 40),
('pt-PT', 'pt', 'por', 'Portuguese (Portugal)', 'Português (Portugal)', 'ltr', 'Romance', 10000000, true, 41),

-- Italian (single variant for now)
('it-IT', 'it', 'ita', 'Italian (Italy)', 'Italiano (Italia)', 'ltr', 'Romance', 65000000, true, 50),

-- Dutch/Netherlands (tech-savvy market)
('nl-NL', 'nl', 'nld', 'Dutch (Netherlands)', 'Nederlands (Nederland)', 'ltr', 'Germanic', 24000000, true, 60),

-- Nordic languages (high purchasing power)
('sv-SE', 'sv', 'swe', 'Swedish (Sweden)', 'Svenska (Sverige)', 'ltr', 'Germanic', 10000000, true, 70),
('da-DK', 'da', 'dan', 'Danish (Denmark)', 'Dansk (Danmark)', 'ltr', 'Germanic', 6000000, true, 71),
('no-NO', 'no', 'nor', 'Norwegian (Norway)', 'Norsk (Norge)', 'ltr', 'Germanic', 5000000, true, 72),
('fi-FI', 'fi', 'fin', 'Finnish (Finland)', 'Suomi (Suomi)', 'ltr', 'Uralic', 5500000, true, 73),

-- Polish (large EU market)
('pl-PL', 'pl', 'pol', 'Polish (Poland)', 'Polski (Polska)', 'ltr', 'Slavic', 40000000, true, 80),

-- Additional languages for future expansion (inactive by default)
('zh-CN', 'zh', 'zho', 'Chinese (Simplified)', '简体中文', 'ltr', 'Sino-Tibetan', 1100000000, false, 90),
('zh-TW', 'zh', 'zho', 'Chinese (Traditional)', '繁體中文', 'ltr', 'Sino-Tibetan', 23000000, false, 91),
('ja-JP', 'ja', 'jpn', 'Japanese (Japan)', '日本語', 'ltr', 'Japonic', 125000000, false, 92),
('ko-KR', 'ko', 'kor', 'Korean (South Korea)', '한국어', 'ltr', 'Koreanic', 77000000, false, 93),
('ar-SA', 'ar', 'ara', 'Arabic (Saudi Arabia)', 'العربية', 'rtl', 'Semitic', 34000000, false, 94),
('he-IL', 'he', 'heb', 'Hebrew (Israel)', 'עברית', 'rtl', 'Semitic', 9000000, false, 95),
('ru-RU', 'ru', 'rus', 'Russian (Russia)', 'Русский', 'ltr', 'Slavic', 146000000, false, 96),
('tr-TR', 'tr', 'tur', 'Turkish (Turkey)', 'Türkçe', 'ltr', 'Turkic', 88000000, false, 97),
('hi-IN', 'hi', 'hin', 'Hindi (India)', 'हिन्दी', 'ltr', 'Indo-European', 600000000, false, 98),
('th-TH', 'th', 'tha', 'Thai (Thailand)', 'ไทย', 'ltr', 'Kra-Dai', 60000000, false, 99);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_languages_iso639_1 ON languages(iso639_1);
CREATE INDEX IF NOT EXISTS idx_languages_is_active ON languages(is_active);
CREATE INDEX IF NOT EXISTS idx_languages_display_order ON languages(display_order);

-- Add a comment to the table explaining the approach
COMMENT ON TABLE languages IS 'Language table using full locale codes (e.g., en-US) for regional variant support, matching frontend i18n system';

-- Update any foreign key references if needed
-- This will depend on your specific schema relationships