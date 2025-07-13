-- CreateTable: International Reference Data Tables
-- This migration adds normalized tables for Countries, Languages, Timezones, and Currencies
-- Following NestJS best practices with integer primary keys (no UUID for reference data)

-- Countries table - ISO 3166-1 standard
CREATE TABLE "countries" (
    "id" SERIAL PRIMARY KEY,
    "code" VARCHAR(2) NOT NULL UNIQUE, -- ISO 3166-1 alpha-2 code (US, DE, etc.)
    "alpha3" VARCHAR(3) NOT NULL UNIQUE, -- ISO 3166-1 alpha-3 code (USA, DEU, etc.)
    "name" VARCHAR(100) NOT NULL,
    "native_name" VARCHAR(100),
    "phone_code" VARCHAR(10), -- International dialing code (+1, +49, etc.)
    "flag_emoji" VARCHAR(10), -- Unicode flag emoji
    "region" VARCHAR(50), -- Europe, Asia, Americas, etc.
    "subregion" VARCHAR(50), -- Western Europe, Southeast Asia, etc.
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Languages table - ISO 639 standard  
CREATE TABLE "languages" (
    "id" SERIAL PRIMARY KEY,
    "code" VARCHAR(10) NOT NULL UNIQUE, -- ISO 639-1 code (en, de, es, etc.) or locale (en-US, de-DE)
    "iso639_1" VARCHAR(2), -- ISO 639-1 two-letter code
    "iso639_2" VARCHAR(3), -- ISO 639-2 three-letter code
    "name" VARCHAR(100) NOT NULL, -- English name
    "native_name" VARCHAR(100), -- Native language name
    "direction" VARCHAR(3) NOT NULL DEFAULT 'ltr', -- 'ltr' or 'rtl'
    "family" VARCHAR(50), -- Language family (Germanic, Romance, etc.)
    "speakers" INTEGER, -- Number of native speakers
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Timezones table - IANA Time Zone Database
CREATE TABLE "timezones" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL UNIQUE, -- IANA name (Europe/Vienna, America/New_York, etc.)
    "label" VARCHAR(150) NOT NULL, -- Human readable label
    "region" VARCHAR(50), -- Continent/Region
    "city" VARCHAR(100), -- Primary city
    "utc_offset" INTEGER NOT NULL, -- UTC offset in minutes
    "dst_offset" INTEGER, -- DST offset in minutes (if applicable)
    "has_dst" BOOLEAN NOT NULL DEFAULT false, -- Does this timezone observe DST?
    "abbreviation" VARCHAR(10), -- Current abbreviation (CET, EST, etc.)
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Currencies table - ISO 4217 standard
CREATE TABLE "currencies" (
    "id" SERIAL PRIMARY KEY,
    "code" VARCHAR(3) NOT NULL UNIQUE, -- ISO 4217 code (USD, EUR, GBP, etc.)
    "numeric_code" VARCHAR(3), -- ISO 4217 numeric code (840, 978, 826, etc.)
    "name" VARCHAR(100) NOT NULL, -- Full name (US Dollar, Euro, etc.)
    "symbol" VARCHAR(10), -- Currency symbol ($, €, £, etc.)
    "symbol_position" VARCHAR(10) DEFAULT 'before', -- 'before' or 'after' amount
    "decimal_places" INTEGER NOT NULL DEFAULT 2, -- Number of decimal places
    "decimal_separator" VARCHAR(1) DEFAULT '.', -- Decimal separator
    "thousands_separator" VARCHAR(1) DEFAULT ',', -- Thousands separator
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes for efficient lookups
CREATE INDEX "idx_countries_code" ON "countries"("code");
CREATE INDEX "idx_countries_alpha3" ON "countries"("alpha3"); 
CREATE INDEX "idx_countries_active" ON "countries"("is_active") WHERE "is_active" = true;
CREATE INDEX "idx_countries_region" ON "countries"("region");

CREATE INDEX "idx_languages_code" ON "languages"("code");
CREATE INDEX "idx_languages_iso639_1" ON "languages"("iso639_1");
CREATE INDEX "idx_languages_active" ON "languages"("is_active") WHERE "is_active" = true;
CREATE INDEX "idx_languages_direction" ON "languages"("direction");

CREATE INDEX "idx_timezones_name" ON "timezones"("name");
CREATE INDEX "idx_timezones_region" ON "timezones"("region");
CREATE INDEX "idx_timezones_active" ON "timezones"("is_active") WHERE "is_active" = true;
CREATE INDEX "idx_timezones_utc_offset" ON "timezones"("utc_offset");

CREATE INDEX "idx_currencies_code" ON "currencies"("code");
CREATE INDEX "idx_currencies_active" ON "currencies"("is_active") WHERE "is_active" = true;

-- Add comments for documentation
COMMENT ON TABLE "countries" IS 'ISO 3166-1 country reference data with metadata';
COMMENT ON TABLE "languages" IS 'ISO 639 language reference data with locale support';  
COMMENT ON TABLE "timezones" IS 'IANA timezone reference data with DST support';
COMMENT ON TABLE "currencies" IS 'ISO 4217 currency reference data with formatting info';

-- Insert some essential data to get started
INSERT INTO "countries" ("code", "alpha3", "name", "native_name", "phone_code", "flag_emoji", "region", "subregion") VALUES
('US', 'USA', 'United States', 'United States', '+1', '🇺🇸', 'Americas', 'Northern America'),
('DE', 'DEU', 'Germany', 'Deutschland', '+49', '🇩🇪', 'Europe', 'Western Europe'),
('GB', 'GBR', 'United Kingdom', 'United Kingdom', '+44', '🇬🇧', 'Europe', 'Northern Europe'),
('FR', 'FRA', 'France', 'France', '+33', '🇫🇷', 'Europe', 'Western Europe'),
('AT', 'AUT', 'Austria', 'Österreich', '+43', '🇦🇹', 'Europe', 'Western Europe');

INSERT INTO "languages" ("code", "iso639_1", "iso639_2", "name", "native_name", "direction") VALUES
('en', 'en', 'eng', 'English', 'English', 'ltr'),
('de', 'de', 'deu', 'German', 'Deutsch', 'ltr'),
('fr', 'fr', 'fra', 'French', 'Français', 'ltr'),
('es', 'es', 'spa', 'Spanish', 'Español', 'ltr'),
('it', 'it', 'ita', 'Italian', 'Italiano', 'ltr');

INSERT INTO "currencies" ("code", "numeric_code", "name", "symbol", "decimal_places") VALUES
('USD', '840', 'US Dollar', '$', 2),
('EUR', '978', 'Euro', '€', 2),
('GBP', '826', 'British Pound', '£', 2),
('CHF', '756', 'Swiss Franc', 'CHF', 2),
('JPY', '392', 'Japanese Yen', '¥', 0);

INSERT INTO "timezones" ("name", "label", "region", "city", "utc_offset", "has_dst") VALUES
('UTC', '(UTC+00:00) Coordinated Universal Time', 'UTC', 'UTC', 0, false),
('Europe/Vienna', '(UTC+01:00) Vienna', 'Europe', 'Vienna', 60, true),
('Europe/London', '(UTC+00:00) London', 'Europe', 'London', 0, true),
('America/New_York', '(UTC-05:00) New York', 'America', 'New York', -300, true),
('America/Los_Angeles', '(UTC-08:00) Los Angeles', 'America', 'Los Angeles', -480, true);