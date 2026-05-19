-- =============================================================================
-- HANARAD FARMER-COMPANION — PostgreSQL Database Schema
-- Production-Ready · Normalized · Scalable
-- Version: 1.0.0 | Date: 2026-05-08
-- =============================================================================

-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";         -- Geospatial queries for farm coords

-- =============================================================================
-- SECTION 1: AUTHENTICATION & USERS
-- =============================================================================

CREATE TABLE languages (
    id          SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    code        VARCHAR(10)  NOT NULL UNIQUE,  -- 'en', 'hi', 'gu', 'tl'
    name        VARCHAR(50)  NOT NULL,          -- 'English', 'Hindi', 'Gujarati', 'Tagalog'
    native_name VARCHAR(50)  NOT NULL,          -- 'English', 'हिंदी', 'ગુજરાતી', 'Tagalog'
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order  SMALLINT     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO languages (code, name, native_name, sort_order) VALUES
  ('en', 'English',  'English',   1),
  ('hi', 'Hindi',    'हिंदी',      2),
  ('gu', 'Gujarati', 'ગુજરાતી',   3),
  ('tl', 'Tagalog',  'Tagalog',   4);

-- ---------------------------------------------------------------------------
-- users — Core identity table. Supports both farmer and admin roles.
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(100)  NOT NULL,
    email               VARCHAR(255)  NOT NULL,
    phone               VARCHAR(20),
    password_hash       VARCHAR(255),                      -- NULL for social/OTP-only
    role                VARCHAR(20)   NOT NULL DEFAULT 'farmer'
                            CHECK (role IN ('farmer','admin','super_admin','expert')),
    avatar_emoji        VARCHAR(10)   DEFAULT '👨‍🌾',        -- e.g. '👨‍🌾','👩‍🌾','🧑‍🌾'
    avatar_url          TEXT,                              -- S3/CDN URL if custom photo
    language_code       VARCHAR(10)   NOT NULL DEFAULT 'en'
                            REFERENCES languages(code) ON UPDATE CASCADE,
    is_email_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
    is_phone_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
    is_profile_setup    BOOLEAN       NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ                        -- soft delete
);

CREATE UNIQUE INDEX uix_users_email     ON users(email)       WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uix_users_phone     ON users(phone)        WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX        idx_users_role      ON users(role);
CREATE INDEX        idx_users_language  ON users(language_code);

-- ---------------------------------------------------------------------------
-- user_otps — OTP table for phone/email verification and login
-- ---------------------------------------------------------------------------
CREATE TABLE user_otps (
    id          BIGINT       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id     UUID         REFERENCES users(id) ON DELETE CASCADE,
    contact     VARCHAR(255) NOT NULL,  -- email or phone the OTP was sent to
    otp_hash    VARCHAR(255) NOT NULL,  -- bcrypt hash of the 6-digit code
    purpose     VARCHAR(30)  NOT NULL
                    CHECK (purpose IN ('email_verify','phone_verify','login','password_reset')),
    expires_at  TIMESTAMPTZ  NOT NULL,
    used_at     TIMESTAMPTZ,
    attempts    SMALLINT     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_contact   ON user_otps(contact, purpose);
CREATE INDEX idx_otp_expires   ON user_otps(expires_at);

-- ---------------------------------------------------------------------------
-- refresh_tokens — JWT refresh token store
-- ---------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id          BIGINT       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,   -- SHA-256 of the actual token
    device_info JSONB,                          -- {platform, os, app_version}
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_user    ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_expires ON refresh_tokens(expires_at);

-- =============================================================================
-- SECTION 2: FARMER PROFILES
-- =============================================================================

CREATE TABLE farmer_profiles (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    village         VARCHAR(100),
    taluka          VARCHAR(100),
    district        VARCHAR(100),
    state           VARCHAR(100) NOT NULL DEFAULT 'Gujarat',
    pincode         VARCHAR(10),
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    total_land_acres NUMERIC(10,3),
    primary_crops   TEXT[],               -- e.g. ['cotton','groundnut']
    farming_type    VARCHAR(30)           -- 'irrigated','rainfed','mixed'
                        CHECK (farming_type IN ('irrigated','rainfed','mixed','organic')),
    years_farming   SMALLINT,
    bio             TEXT,
    aadhaar_verified BOOLEAN NOT NULL DEFAULT FALSE,
    kcc_registered  BOOLEAN NOT NULL DEFAULT FALSE,  -- Kisan Credit Card
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fp_user    ON farmer_profiles(user_id);
CREATE INDEX idx_fp_state   ON farmer_profiles(state);
CREATE INDEX idx_fp_district ON farmer_profiles(district);
-- Geo index for location-based queries
CREATE INDEX idx_fp_geo     ON farmer_profiles(latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ---------------------------------------------------------------------------
-- user_addresses — Multiple addresses per user (farm, home, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE user_addresses (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       VARCHAR(50)  NOT NULL DEFAULT 'Home',  -- 'Home','Farm','Other'
    line1       VARCHAR(255) NOT NULL,
    line2       VARCHAR(255),
    village     VARCHAR(100),
    district    VARCHAR(100),
    state       VARCHAR(100),
    pincode     VARCHAR(10),
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    is_default  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addr_user ON user_addresses(user_id);

-- =============================================================================
-- SECTION 3: FARM MANAGEMENT
-- =============================================================================

CREATE TABLE farms (
    id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(150)  NOT NULL,
    village         VARCHAR(100),
    district        VARCHAR(100),
    state           VARCHAR(100),
    method          VARCHAR(20)   NOT NULL DEFAULT 'draw'
                        CHECK (method IN ('draw','walk','gps')),
    area_sqm        NUMERIC(14,4),
    area_acres      NUMERIC(10,6),
    area_bigha      NUMERIC(10,6),
    area_hectares   NUMERIC(10,6),
    perimeter_m     NUMERIC(12,4),
    centroid_lat    DOUBLE PRECISION,
    centroid_lon    DOUBLE PRECISION,
    land_type       VARCHAR(50),              -- OSM detected: 'farmland','orchard', etc.
    primary_crop    VARCHAR(100),
    soil_type       VARCHAR(50),
    irrigation_type VARCHAR(50),
    notes           TEXT,
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- Farm boundary: stored inline as JSONB for fast single-row reads
-- Shape: [{"latitude": 23.05, "longitude": 72.58}, ...]
ALTER TABLE farms
  ADD COLUMN IF NOT EXISTS polygon_coordinates JSONB,
  ADD COLUMN IF NOT EXISTS area_vigha          NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS area_sqft           NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS warning_detected    BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS warning_types       TEXT[],            -- e.g. ARRAY['residential','commercial']
  ADD COLUMN IF NOT EXISTS map_snapshot        TEXT;              -- S3 / CDN URL of satellite snapshot

CREATE INDEX idx_farms_user        ON farms(user_id)          WHERE deleted_at IS NULL;
CREATE INDEX idx_farms_district    ON farms(district);
CREATE INDEX idx_farms_warning     ON farms(user_id, warning_detected) WHERE warning_detected = TRUE;
CREATE INDEX idx_farms_coords_gin  ON farms USING GIN (polygon_coordinates); -- for @> JSONB queries

-- ---------------------------------------------------------------------------
-- farm_coordinates — Individual lat/lon points forming the farm polygon
-- ---------------------------------------------------------------------------
CREATE TABLE farm_coordinates (
    id          BIGINT          PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    farm_id     UUID            NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    seq         SMALLINT        NOT NULL,        -- ordering of vertices
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL
);

CREATE INDEX idx_farm_coords_farm ON farm_coordinates(farm_id);

-- =============================================================================
-- SECTION 4: CROP MANAGEMENT
-- =============================================================================

CREATE TABLE crop_categories (
    id          SMALLINT     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name        VARCHAR(100) NOT NULL UNIQUE,   -- 'Kharif','Rabi','Zaid'
    icon        VARCHAR(20),
    sort_order  SMALLINT     NOT NULL DEFAULT 0
);

INSERT INTO crop_categories (name, icon, sort_order) VALUES
  ('Kharif', '☀️', 1), ('Rabi', '❄️', 2), ('Zaid', '🌤️', 3);

CREATE TABLE crops (
    id              SMALLINT        PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    category_id     SMALLINT        REFERENCES crop_categories(id),
    key             VARCHAR(50)     NOT NULL UNIQUE,   -- 'cotton','groundnut'
    name_en         VARCHAR(100)    NOT NULL,
    name_hi         VARCHAR(100),
    name_gu         VARCHAR(100),
    name_tl         VARCHAR(100),
    icon            VARCHAR(20),
    min_temp        NUMERIC(5,2),
    max_temp        NUMERIC(5,2),
    min_rain_mm     NUMERIC(8,2),
    max_rain_mm     NUMERIC(8,2),
    min_humidity    NUMERIC(5,2),
    kc_coefficient  NUMERIC(5,3),   -- crop coefficient for irrigation calc
    season_label    VARCHAR(100),
    sow_months      SMALLINT[],     -- e.g. [5,6] = May, June
    tip             TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    sort_order      SMALLINT        NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- user_crops — Crops being actively farmed by a user (M:N pivot)
-- ---------------------------------------------------------------------------
CREATE TABLE user_crops (
    id              BIGINT       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_id         UUID         REFERENCES farms(id) ON DELETE SET NULL,
    crop_id         SMALLINT     NOT NULL REFERENCES crops(id),
    area_acres      NUMERIC(10,4),
    sow_date        DATE,
    expected_harvest DATE,
    variety         VARCHAR(100),
    notes           TEXT,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_crops_user ON user_crops(user_id);
CREATE INDEX idx_user_crops_farm ON user_crops(farm_id);

-- =============================================================================
-- SECTION 5: DISEASE DETECTION
-- =============================================================================

CREATE TABLE disease_reports (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_id         UUID         REFERENCES farms(id) ON DELETE SET NULL,
    crop_key        VARCHAR(50)  NOT NULL,       -- 'cotton', 'wheat', etc.
    scan_method     VARCHAR(20)  NOT NULL DEFAULT 'symptom'
                        CHECK (scan_method IN ('symptom','camera','gallery','ai')),
    detected_disease VARCHAR(150),
    confidence_pct  NUMERIC(5,2),               -- AI confidence 0-100
    severity        VARCHAR(20)
                        CHECK (severity IN ('low','medium','high','critical')),
    symptoms        TEXT[],                     -- selected symptom tags
    diagnosis_notes TEXT,
    treatment_plan  JSONB,                      -- structured treatment steps
    status          VARCHAR(20)  NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open','treated','resolved','monitoring')),
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disease_user   ON disease_reports(user_id);
CREATE INDEX idx_disease_crop   ON disease_reports(crop_key);
CREATE INDEX idx_disease_date   ON disease_reports(created_at DESC);

CREATE TABLE disease_report_images (
    id          BIGINT       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    report_id   UUID         NOT NULL REFERENCES disease_reports(id) ON DELETE CASCADE,
    image_url   TEXT         NOT NULL,
    is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dri_report ON disease_report_images(report_id);

-- =============================================================================
-- SECTION 6: WEATHER
-- =============================================================================

CREATE TABLE weather_logs (
    id              BIGINT          PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id         UUID            REFERENCES users(id) ON DELETE SET NULL,
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    recorded_date   DATE            NOT NULL,
    source          VARCHAR(30)     NOT NULL DEFAULT 'openmeteo'
                        CHECK (source IN ('openmeteo','nasa_power','imd','mock')),
    temp_max        NUMERIC(5,2),
    temp_min        NUMERIC(5,2),
    temp_mean       NUMERIC(5,2),
    humidity_pct    NUMERIC(5,2),
    rain_mm         NUMERIC(8,3),
    wind_speed_kph  NUMERIC(6,2),
    wind_dir_deg    SMALLINT,
    uv_index        NUMERIC(4,1),
    cloud_cover_pct NUMERIC(5,2),
    solar_rad       NUMERIC(8,3),
    raw_payload     JSONB,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uix_weather_loc_date ON weather_logs(latitude, longitude, recorded_date, source);
CREATE INDEX idx_weather_user ON weather_logs(user_id);
CREATE INDEX idx_weather_date ON weather_logs(recorded_date DESC);

CREATE TABLE weather_alerts (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         REFERENCES users(id) ON DELETE CASCADE,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    alert_type      VARCHAR(50)  NOT NULL,   -- 'heavy_rain','heat_wave','frost','cyclone'
    severity        VARCHAR(20)  NOT NULL DEFAULT 'medium'
                        CHECK (severity IN ('low','medium','high','extreme')),
    title           VARCHAR(200) NOT NULL,
    message         TEXT         NOT NULL,
    source          VARCHAR(50)  DEFAULT 'openmeteo',
    valid_from      TIMESTAMPTZ,
    valid_to        TIMESTAMPTZ,
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_walerts_user   ON weather_alerts(user_id);
CREATE INDEX idx_walerts_date   ON weather_alerts(created_at DESC);

-- ---------------------------------------------------------------------------
-- soil_data_logs — NASA POWER / sensor soil metrics
-- ---------------------------------------------------------------------------
CREATE TABLE soil_data_logs (
    id                  BIGINT          PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id             UUID            REFERENCES users(id) ON DELETE SET NULL,
    farm_id             UUID            REFERENCES farms(id) ON DELETE SET NULL,
    latitude            DOUBLE PRECISION NOT NULL,
    longitude           DOUBLE PRECISION NOT NULL,
    recorded_date       DATE            NOT NULL,
    moisture_pct        NUMERIC(5,2),
    temperature_c       NUMERIC(5,2),
    ph                  NUMERIC(4,2),
    nitrogen_kg_ha      NUMERIC(8,2),
    phosphorus_kg_ha    NUMERIC(8,2),
    potassium_kg_ha     NUMERIC(8,2),
    organic_carbon_pct  NUMERIC(5,3),
    ec_ds_m             NUMERIC(6,3),   -- electrical conductivity
    bulk_density        NUMERIC(5,3),
    source              VARCHAR(30)     NOT NULL DEFAULT 'nasa_power',
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_soil_user ON soil_data_logs(user_id);
CREATE INDEX idx_soil_date ON soil_data_logs(recorded_date DESC);

-- ---------------------------------------------------------------------------
-- irrigation_logs — Irrigation advisories generated per user/crop
-- ---------------------------------------------------------------------------
CREATE TABLE irrigation_logs (
    id              BIGINT       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_id         UUID         REFERENCES farms(id) ON DELETE SET NULL,
    crop_key        VARCHAR(50)  NOT NULL,
    log_date        DATE         NOT NULL,
    eto_mm          NUMERIC(6,3),   -- reference evapotranspiration
    etc_mm          NUMERIC(6,3),   -- crop evapotranspiration
    rain_mm         NUMERIC(6,3),
    net_need_mm     NUMERIC(6,3),
    advice          VARCHAR(100),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_irrig_user ON irrigation_logs(user_id);
CREATE INDEX idx_irrig_date ON irrigation_logs(log_date DESC);

-- =============================================================================
-- SECTION 7: MANDI / MARKET PRICES
-- =============================================================================

CREATE TABLE mandi_markets (
    id          SMALLINT     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name        VARCHAR(150) NOT NULL,
    district    VARCHAR(100) NOT NULL,
    state       VARCHAR(100) NOT NULL,
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mandi_state ON mandi_markets(state);

CREATE TABLE mandi_price_cache (
    id              BIGINT          PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    market_id       SMALLINT        REFERENCES mandi_markets(id),
    market_name     VARCHAR(150)    NOT NULL,
    district        VARCHAR(100)    NOT NULL,
    state           VARCHAR(100)    NOT NULL,
    commodity       VARCHAR(100)    NOT NULL,
    variety         VARCHAR(100)    NOT NULL DEFAULT 'Local',
    arrival_date    DATE            NOT NULL,
    min_price       NUMERIC(10,2)   NOT NULL,
    max_price       NUMERIC(10,2)   NOT NULL,
    modal_price     NUMERIC(10,2)   NOT NULL,
    trend           VARCHAR(10)     CHECK (trend IN ('up','down','stable')),
    source          VARCHAR(30)     NOT NULL DEFAULT 'data_gov_in',
    fetched_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uix_mandi_cache ON mandi_price_cache(market_name, commodity, arrival_date);
CREATE INDEX idx_mandi_cache_date   ON mandi_price_cache(arrival_date DESC);
CREATE INDEX idx_mandi_cache_commodity ON mandi_price_cache(commodity);

-- ---------------------------------------------------------------------------
-- price_alerts — User-defined price threshold alerts for commodities
-- ---------------------------------------------------------------------------
CREATE TABLE price_alerts (
    id              BIGINT       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    commodity       VARCHAR(100) NOT NULL,
    state           VARCHAR(100),
    alert_above     NUMERIC(10,2),   -- trigger if price goes above
    alert_below     NUMERIC(10,2),   -- trigger if price drops below
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_palerts_user ON price_alerts(user_id);

-- =============================================================================
-- SECTION 8: GOVERNMENT SCHEMES
-- =============================================================================

CREATE TABLE scheme_categories (
    id          SMALLINT     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    key         VARCHAR(30)  NOT NULL UNIQUE,
    name_en     VARCHAR(100) NOT NULL,
    name_hi     VARCHAR(100),
    name_gu     VARCHAR(100),
    name_tl     VARCHAR(100),
    icon        VARCHAR(20),
    sort_order  SMALLINT     NOT NULL DEFAULT 0
);

INSERT INTO scheme_categories (key, name_en, name_hi, name_gu, icon, sort_order) VALUES
  ('income',     'Income Support',   'आय सहायता',        'આવક સહાય',      '💰', 1),
  ('insurance',  'Insurance',        'बीमा',              'વીમો',           '🛡️', 2),
  ('credit',     'Credit/Loans',     'ऋण/कर्ज',           'ધિરાણ',          '💳', 3),
  ('irrigation', 'Irrigation',       'सिंचाई',            'સિંચાઈ',         '💧', 4),
  ('subsidy',    'Subsidy',          'सब्सिडी',           'સહાય',           '🧪', 5);

CREATE TABLE govt_schemes (
    id              SMALLINT     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    category_id     SMALLINT     NOT NULL REFERENCES scheme_categories(id),
    key             VARCHAR(50)  NOT NULL UNIQUE,
    name_en         VARCHAR(200) NOT NULL,
    name_hi         VARCHAR(200),
    name_gu         VARCHAR(200),
    name_tl         VARCHAR(200),
    desc_en         TEXT,
    desc_hi         TEXT,
    desc_gu         TEXT,
    desc_tl         TEXT,
    benefit_en      TEXT,
    eligibility_en  TEXT,
    documents_en    TEXT[],
    portal_url      TEXT,
    helpline        VARCHAR(20),
    is_central      BOOLEAN      NOT NULL DEFAULT TRUE,  -- central vs state scheme
    applicable_states TEXT[],                            -- NULL = all India
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order      SMALLINT     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schemes_category ON govt_schemes(category_id);

-- ---------------------------------------------------------------------------
-- scheme_bookmarks — Users bookmark schemes they're interested in
-- ---------------------------------------------------------------------------
CREATE TABLE scheme_bookmarks (
    user_id    UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheme_id  SMALLINT  NOT NULL REFERENCES govt_schemes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, scheme_id)
);

-- =============================================================================
-- SECTION 9: EXPERT CONSULTATIONS
-- =============================================================================

CREATE TABLE expert_profiles (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialization  VARCHAR(100),  -- 'Crop Disease','Soil Science','Irrigation'
    qualification   VARCHAR(200),
    experience_yrs  SMALLINT,
    languages       TEXT[],        -- ['en','hi','gu']
    rating          NUMERIC(3,2),
    total_reviews   INT          NOT NULL DEFAULT 0,
    per_call_rate   NUMERIC(8,2),
    is_available    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE expert_consultations (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expert_id       UUID         NOT NULL REFERENCES users(id),
    crop_key        VARCHAR(50),
    issue_summary   TEXT         NOT NULL,
    mode            VARCHAR(20)  NOT NULL DEFAULT 'chat'
                        CHECK (mode IN ('chat','call','video')),
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','ongoing','completed','cancelled')),
    scheduled_at    TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    duration_min    SMALLINT,
    fee_charged     NUMERIC(8,2),
    payment_status  VARCHAR(20)  DEFAULT 'pending'
                        CHECK (payment_status IN ('pending','paid','refunded','waived')),
    rating          SMALLINT     CHECK (rating BETWEEN 1 AND 5),
    review_text     TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consult_farmer ON expert_consultations(farmer_id);
CREATE INDEX idx_consult_expert ON expert_consultations(expert_id);
CREATE INDEX idx_consult_status ON expert_consultations(status);

CREATE TABLE consultation_messages (
    id              BIGINT       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    consultation_id UUID         NOT NULL REFERENCES expert_consultations(id) ON DELETE CASCADE,
    sender_id       UUID         NOT NULL REFERENCES users(id),
    message_type    VARCHAR(20)  NOT NULL DEFAULT 'text'
                        CHECK (message_type IN ('text','image','voice','system')),
    content         TEXT,
    media_url       TEXT,
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consult_msg ON consultation_messages(consultation_id, created_at);

-- =============================================================================
-- SECTION 10: NEARBY STORES
-- =============================================================================

CREATE TABLE store_listings (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    osm_id          BIGINT       UNIQUE,               -- OpenStreetMap node/way ID
    store_type      VARCHAR(50)  NOT NULL,              -- 'agro_shop','seeds','pesticides','equipment'
    address         TEXT,
    village         VARCHAR(100),
    district        VARCHAR(100),
    state           VARCHAR(100),
    pincode         VARCHAR(10),
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    phone           VARCHAR(20),
    website         TEXT,
    opening_hours   VARCHAR(200),
    is_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stores_geo  ON store_listings(latitude, longitude);
CREATE INDEX idx_stores_type ON store_listings(store_type);

-- =============================================================================
-- SECTION 11: MARKETPLACE (PRODUCTS & ORDERS)
-- =============================================================================

CREATE TABLE product_categories (
    id          SMALLINT     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    parent_id   SMALLINT     REFERENCES product_categories(id),
    name_en     VARCHAR(100) NOT NULL,
    name_hi     VARCHAR(100),
    name_gu     VARCHAR(100),
    name_tl     VARCHAR(100),
    icon        VARCHAR(20),
    slug        VARCHAR(100) NOT NULL UNIQUE,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order  SMALLINT     NOT NULL DEFAULT 0
);

CREATE TABLE products (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     SMALLINT     NOT NULL REFERENCES product_categories(id),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2) NOT NULL,
    unit            VARCHAR(20)  NOT NULL DEFAULT 'kg',   -- 'kg','litre','piece','bag'
    stock_qty       NUMERIC(10,3) NOT NULL DEFAULT 0,
    min_order_qty   NUMERIC(10,3) NOT NULL DEFAULT 1,
    brand           VARCHAR(100),
    sku             VARCHAR(100),
    is_organic      BOOLEAN      NOT NULL DEFAULT FALSE,
    is_featured     BOOLEAN      NOT NULL DEFAULT FALSE,
    moderation_status VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (moderation_status IN ('pending','approved','rejected')),
    rejection_reason TEXT,
    avg_rating      NUMERIC(3,2),
    total_reviews   INT          NOT NULL DEFAULT 0,
    total_sold      INT          NOT NULL DEFAULT 0,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_products_seller   ON products(seller_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_moderation ON products(moderation_status);

CREATE TABLE product_images (
    id          BIGINT       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    product_id  UUID         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url   TEXT         NOT NULL,
    sort_order  SMALLINT     NOT NULL DEFAULT 0,
    is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prod_images ON product_images(product_id);

CREATE TABLE marketplace_orders (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id        UUID         NOT NULL REFERENCES users(id),
    delivery_address_id UUID     REFERENCES user_addresses(id),
    status          VARCHAR(30)  NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
    subtotal        NUMERIC(12,2) NOT NULL,
    discount_amt    NUMERIC(12,2) NOT NULL DEFAULT 0,
    delivery_fee    NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount    NUMERIC(12,2) NOT NULL,
    payment_method  VARCHAR(30)   -- 'cod','upi','card','netbanking'
                        CHECK (payment_method IN ('cod','upi','card','netbanking','wallet')),
    payment_status  VARCHAR(20)  NOT NULL DEFAULT 'pending'
                        CHECK (payment_status IN ('pending','paid','failed','refunded')),
    payment_ref     VARCHAR(200),
    notes           TEXT,
    delivered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer  ON marketplace_orders(buyer_id);
CREATE INDEX idx_orders_status ON marketplace_orders(status);
CREATE INDEX idx_orders_date   ON marketplace_orders(created_at DESC);

CREATE TABLE order_items (
    id          BIGINT          PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id    UUID            NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
    product_id  UUID            NOT NULL REFERENCES products(id),
    seller_id   UUID            NOT NULL REFERENCES users(id),
    product_name VARCHAR(200)   NOT NULL,    -- snapshot at time of order
    unit_price  NUMERIC(10,2)   NOT NULL,
    quantity    NUMERIC(10,3)   NOT NULL,
    unit        VARCHAR(20)     NOT NULL,
    line_total  NUMERIC(12,2)   NOT NULL
);

CREATE INDEX idx_order_items_order   ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_seller  ON order_items(seller_id);

-- =============================================================================
-- SECTION 12: PAYMENTS
-- =============================================================================

CREATE TABLE payments (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users(id),
    order_id        UUID         REFERENCES marketplace_orders(id),
    consultation_id UUID         REFERENCES expert_consultations(id),
    amount          NUMERIC(12,2) NOT NULL,
    currency        VARCHAR(5)   NOT NULL DEFAULT 'INR',
    method          VARCHAR(30)  NOT NULL,
    gateway         VARCHAR(50),                -- 'razorpay','stripe','paytm'
    gateway_order_id VARCHAR(200),
    gateway_payment_id VARCHAR(200),
    gateway_signature VARCHAR(500),
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','processing','success','failed','refunded')),
    failure_reason  TEXT,
    metadata        JSONB,
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user   ON payments(user_id);
CREATE INDEX idx_payments_order  ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- =============================================================================
-- SECTION 13: NOTIFICATIONS
-- =============================================================================

CREATE TABLE device_tokens (
    id          BIGINT       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT         NOT NULL,
    platform    VARCHAR(10)  NOT NULL CHECK (platform IN ('android','ios','web')),
    app_version VARCHAR(20),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uix_device_token ON device_tokens(token);
CREATE INDEX idx_device_user ON device_tokens(user_id);

CREATE TABLE notifications (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         REFERENCES users(id) ON DELETE CASCADE,  -- NULL = broadcast
    type            VARCHAR(30)  NOT NULL
                        CHECK (type IN ('weather','market','disease','scheme','rain','crop','reminder','general','system')),
    title           VARCHAR(200) NOT NULL,
    body            TEXT         NOT NULL,
    image_url       TEXT,
    deep_link_screen VARCHAR(100),
    deep_link_params JSONB,
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    is_broadcast    BOOLEAN      NOT NULL DEFAULT FALSE,
    sent_via        TEXT[],      -- ['fcm','in_app']
    fcm_message_id  TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    read_at         TIMESTAMPTZ
);

CREATE INDEX idx_notif_user   ON notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_notif_type   ON notifications(type);
CREATE INDEX idx_notif_date   ON notifications(created_at DESC);
CREATE INDEX idx_notif_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

CREATE TABLE user_notification_preferences (
    user_id             UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    weather_alerts      BOOLEAN     NOT NULL DEFAULT TRUE,
    market_updates      BOOLEAN     NOT NULL DEFAULT FALSE,
    disease_alerts      BOOLEAN     NOT NULL DEFAULT TRUE,
    scheme_updates      BOOLEAN     NOT NULL DEFAULT TRUE,
    crop_reminders      BOOLEAN     NOT NULL DEFAULT TRUE,
    voice_readout       BOOLEAN     NOT NULL DEFAULT TRUE,
    quiet_hours_start   TIME,       -- e.g. 22:00
    quiet_hours_end     TIME,       -- e.g. 06:00
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SECTION 14: SUPPORT SYSTEM
-- =============================================================================

CREATE TABLE faq_categories (
    id          SMALLINT     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name_en     VARCHAR(100) NOT NULL,
    name_hi     VARCHAR(100),
    name_gu     VARCHAR(100),
    icon        VARCHAR(20),
    sort_order  SMALLINT     NOT NULL DEFAULT 0
);

CREATE TABLE faqs (
    id              SMALLINT     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    category_id     SMALLINT     REFERENCES faq_categories(id),
    question_en     TEXT         NOT NULL,
    question_hi     TEXT,
    question_gu     TEXT,
    question_tl     TEXT,
    answer_en       TEXT         NOT NULL,
    answer_hi       TEXT,
    answer_gu       TEXT,
    answer_tl       TEXT,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order      SMALLINT     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE support_tickets (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users(id),
    ticket_number   VARCHAR(20)  NOT NULL UNIQUE,
    category        VARCHAR(50)  NOT NULL
                        CHECK (category IN ('technical','payment','account','crop','weather','marketplace','other')),
    subject         VARCHAR(300) NOT NULL,
    priority        VARCHAR(10)  NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low','medium','high','urgent')),
    status          VARCHAR(20)  NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open','in_progress','resolved','closed','reopened')),
    assigned_to     UUID         REFERENCES users(id),   -- admin/agent user_id
    resolved_at     TIMESTAMPTZ,
    resolution_note TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_user     ON support_tickets(user_id);
CREATE INDEX idx_tickets_status   ON support_tickets(status);
CREATE INDEX idx_tickets_assigned ON support_tickets(assigned_to);

CREATE TABLE support_ticket_messages (
    id          BIGINT       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    ticket_id   UUID         NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id   UUID         NOT NULL REFERENCES users(id),
    sender_role VARCHAR(20)  NOT NULL CHECK (sender_role IN ('user','agent','system')),
    message     TEXT         NOT NULL,
    attachments TEXT[],
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_msgs ON support_ticket_messages(ticket_id, created_at);

-- =============================================================================
-- SECTION 15: CONTENT MANAGEMENT (CMS)
-- =============================================================================

CREATE TABLE banners (
    id              SMALLINT     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title_en        VARCHAR(200) NOT NULL,
    title_hi        VARCHAR(200),
    title_gu        VARCHAR(200),
    title_tl        VARCHAR(200),
    subtitle_en     VARCHAR(500),
    image_url       TEXT         NOT NULL,
    deep_link_screen VARCHAR(100),
    deep_link_params JSONB,
    external_url    TEXT,
    placement       VARCHAR(30)  NOT NULL DEFAULT 'home'
                        CHECK (placement IN ('home','mandi','schemes','weather','splash')),
    sort_order      SMALLINT     NOT NULL DEFAULT 0,
    starts_at       TIMESTAMPTZ,
    ends_at         TIMESTAMPTZ,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_banners_active ON banners(placement, is_active, sort_order)
    WHERE is_active = TRUE;

CREATE TABLE app_content (
    id          SMALLINT     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    type        VARCHAR(30)  NOT NULL UNIQUE
                    CHECK (type IN ('disclaimer','privacy_policy','terms_and_conditions','about_us')),
    content_en  TEXT         NOT NULL,
    content_hi  TEXT,
    content_gu  TEXT,
    content_tl  TEXT,
    version     VARCHAR(20)  NOT NULL DEFAULT '1.0',
    effective_date DATE,
    updated_by  UUID         REFERENCES users(id),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO app_content (type, content_en, version) VALUES
  ('disclaimer',          'Placeholder disclaimer text.',     '1.0'),
  ('privacy_policy',      'Placeholder privacy policy text.', '1.0'),
  ('terms_and_conditions','Placeholder T&C text.',            '1.0');

-- ---------------------------------------------------------------------------
-- user_content_acceptances — Track who accepted which version of legal docs
-- ---------------------------------------------------------------------------
CREATE TABLE user_content_acceptances (
    id              BIGINT       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type    VARCHAR(30)  NOT NULL,
    content_version VARCHAR(20)  NOT NULL,
    ip_address      INET,
    accepted_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uix_content_acceptance ON user_content_acceptances(user_id, content_type, content_version);

-- =============================================================================
-- SECTION 16: ANALYTICS
-- =============================================================================

CREATE TABLE analytics_events (
    id              BIGINT          PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id         UUID            REFERENCES users(id) ON DELETE SET NULL,
    session_id      UUID            NOT NULL,
    event_name      VARCHAR(80)     NOT NULL,   -- 'weather_checked','farm_saved', etc.
    screen_name     VARCHAR(80),
    properties      JSONB,
    platform        VARCHAR(10)     CHECK (platform IN ('android','ios','web')),
    app_version     VARCHAR(20),
    occurred_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
)
PARTITION BY RANGE (occurred_at);                -- Partition by month for scale

-- Partitions (create monthly, automate via pg_partman in production)
CREATE TABLE analytics_events_2026_05 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE analytics_events_2026_06 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE INDEX idx_analytics_user    ON analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_analytics_event   ON analytics_events(event_name);
CREATE INDEX idx_analytics_date    ON analytics_events(occurred_at DESC);

CREATE TABLE analytics_sessions (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         REFERENCES users(id) ON DELETE SET NULL,
    platform        VARCHAR(10),
    app_version     VARCHAR(20),
    device_model    VARCHAR(100),
    os_version      VARCHAR(50),
    language_code   VARCHAR(10),
    started_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    duration_sec    INT,
    screens_visited TEXT[]
);

CREATE INDEX idx_sessions_user ON analytics_sessions(user_id);
CREATE INDEX idx_sessions_date ON analytics_sessions(started_at DESC);

-- =============================================================================
-- SECTION 17: REVIEWS & RATINGS
-- =============================================================================

CREATE TABLE reviews (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id     UUID         NOT NULL REFERENCES users(id),
    target_type     VARCHAR(30)  NOT NULL
                        CHECK (target_type IN ('product','expert','app','store')),
    target_id       TEXT         NOT NULL,    -- UUID of product/expert/store
    rating          SMALLINT     NOT NULL     CHECK (rating BETWEEN 1 AND 5),
    title           VARCHAR(200),
    body            TEXT,
    images          TEXT[],
    is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    is_visible      BOOLEAN      NOT NULL DEFAULT TRUE,
    moderated_by    UUID         REFERENCES users(id),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uix_review ON reviews(reviewer_id, target_type, target_id);
CREATE INDEX idx_reviews_target ON reviews(target_type, target_id);

-- =============================================================================
-- SECTION 18: FILE UPLOADS
-- =============================================================================

CREATE TABLE file_uploads (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users(id),
    file_name       VARCHAR(255) NOT NULL,
    file_type       VARCHAR(50)  NOT NULL,   -- 'image/jpeg','image/png','application/pdf'
    file_size_bytes BIGINT       NOT NULL,
    storage_url     TEXT         NOT NULL,   -- S3 / GCS URL
    cdn_url         TEXT,                    -- CloudFront / CDN URL
    purpose         VARCHAR(50)  NOT NULL
                        CHECK (purpose IN ('avatar','farm_image','disease_scan','product_image','ticket_attachment','other')),
    reference_id    TEXT,                    -- related entity UUID
    is_public       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_uploads_user    ON file_uploads(user_id);
CREATE INDEX idx_uploads_purpose ON file_uploads(purpose);

-- =============================================================================
-- SECTION 19: ADMIN PANEL
-- =============================================================================

CREATE TABLE admin_activity_logs (
    id              BIGINT       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    admin_id        UUID         NOT NULL REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,     -- 'user.ban','product.approve','banner.create'
    target_type     VARCHAR(50),
    target_id       TEXT,
    old_value       JSONB,
    new_value       JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin  ON admin_activity_logs(admin_id);
CREATE INDEX idx_admin_logs_date   ON admin_activity_logs(created_at DESC);
CREATE INDEX idx_admin_logs_action ON admin_activity_logs(action);

CREATE TABLE app_settings (
    key         VARCHAR(100)  PRIMARY KEY,
    value       JSONB         NOT NULL,
    description TEXT,
    updated_by  UUID          REFERENCES users(id),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (key, value, description) VALUES
  ('maintenance_mode',      'false',             'Set true to show maintenance screen'),
  ('min_app_version',       '"1.0.0"',           'Minimum supported app version'),
  ('force_update_version',  '"0.0.0"',           'Force update below this version'),
  ('free_consultation_enabled', 'true',          'Toggle free expert consultation feature'),
  ('mandi_api_enabled',     'true',              'Toggle live mandi price API'),
  ('disease_ai_enabled',    'false',             'Toggle AI disease scan feature');

-- =============================================================================
-- SECTION 20: AUDIT & SOFT DELETE HELPER FUNCTION
-- =============================================================================

-- Automatically set updated_at on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'users','farmer_profiles','user_addresses','farms',
        'user_crops','disease_reports','weather_alerts',
        'govt_schemes','expert_profiles','expert_consultations',
        'store_listings','products','marketplace_orders',
        'payments','support_tickets','banners','app_content',
        'faqs','reviews','user_notification_preferences'
    ] LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at
             BEFORE UPDATE ON %s
             FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t
        );
    END LOOP;
END;
$$;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
