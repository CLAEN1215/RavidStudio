-- ============================================================
-- Etsy Research Platform — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Reference Prices ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reference_prices (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_name TEXT NOT NULL,
  retail_price_usd DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default prices
INSERT INTO reference_prices (config_name, retail_price_usd, description, sort_order) VALUES
  ('Tea Whisk Stand',              23.99, 'Single tea whisk stand / holder', 1),
  ('Matcha Bowl',                  29.99, 'Single ceramic matcha bowl', 2),
  ('Matcha Bowl + Tea Whisk Stand',39.99, 'Bundle: bowl + whisk stand', 3),
  ('Four-Piece Set',               49.99, 'Complete 4-piece matcha tea set', 4)
ON CONFLICT DO NOTHING;

-- ─── Title References (Knowledge Base) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS title_references (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  is_preferred BOOLEAN DEFAULT FALSE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial title examples
INSERT INTO title_references (title, is_preferred, notes) VALUES
  ('Handmade Ceramic Flower Style Matcha Tea Set', TRUE, 'Primary style reference'),
  ('Handmade Ceramic Lotus Flower Style Matcha Tea Set', TRUE, 'Primary style reference'),
  ('Handmade Matcha Bowl Set, Sakura Blue, Japanese Tea Ceremony', TRUE, 'Partial reference — third title from screenshot')
ON CONFLICT DO NOTHING;

-- ─── App Settings ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT UNIQUE NOT NULL,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Default fulfillment settings
INSERT INTO app_settings (key, value, description) VALUES
  ('fulfillment_defaults', '{
    "cny_to_usd_rate": 0.138,
    "china_domestic_shipping_usd": 1.5,
    "sourcing_agent_fee_pct": 6,
    "international_shipping_usd": 4.5,
    "packaging_cost_usd": 1.0,
    "customs_duty_pct": 0,
    "etsy_listing_fee_usd": 0.20,
    "etsy_transaction_fee_pct": 6.5,
    "etsy_payment_processing_pct": 3.0,
    "advertising_cost_usd": 0,
    "damage_refund_pct": 2,
    "target_margin_pct": 35
  }', 'Default fulfillment cost settings')
ON CONFLICT (key) DO NOTHING;

-- ─── Products ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_url          TEXT NOT NULL,
  offer_id            TEXT,
  name_cn             TEXT,
  name_en             TEXT,
  main_image_url      TEXT,
  additional_images   TEXT[] DEFAULT '{}',
  price_cny           DECIMAL(10,4),
  price_usd           DECIMAL(10,4),
  min_order_qty       INTEGER,
  materials           TEXT[],
  dimensions          TEXT,
  weight              TEXT,
  packaging           TEXT,
  variants            JSONB DEFAULT '[]',
  colors              TEXT[],
  specifications      JSONB DEFAULT '{}',
  supplier_name       TEXT,
  supplier_rating     DECIMAL(3,2),
  extraction_method   TEXT NOT NULL DEFAULT 'MANUAL',
  extraction_status   TEXT NOT NULL DEFAULT 'PARTIAL',
  extraction_error    TEXT,
  is_saved            BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Market Research Reports ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_research (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id                UUID REFERENCES products(id) ON DELETE CASCADE,
  demand_assessment         TEXT,
  demand_confidence         TEXT,
  competition_assessment    TEXT,
  competitor_price_min      DECIMAL(10,2),
  competitor_price_max      DECIMAL(10,2),
  competitor_price_avg      DECIMAL(10,2),
  competitor_listings       JSONB DEFAULT '[]',
  comparable_listing_count  INTEGER,
  keyword_opportunities     TEXT[],
  differentiation_opportunities TEXT[],
  market_risks              TEXT[],
  seasonal_opportunities    TEXT[],
  overall_confidence        TEXT,
  research_date             TIMESTAMPTZ DEFAULT NOW(),
  sources_used              TEXT[],
  niche_fit_assessment      TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Profitability Calculations ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profitability_calculations (
  id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id                      UUID REFERENCES products(id) ON DELETE CASCADE,
  supplier_cost_usd               DECIMAL(10,4),
  china_domestic_shipping         DECIMAL(10,4),
  sourcing_agent_fee              DECIMAL(10,4),
  international_shipping          DECIMAL(10,4),
  packaging_cost                  DECIMAL(10,4),
  customs_duty                    DECIMAL(10,4),
  total_landed_cost               DECIMAL(10,4),
  etsy_listing_fee                DECIMAL(10,4),
  etsy_transaction_fee            DECIMAL(10,4),
  etsy_payment_processing         DECIMAL(10,4),
  advertising_cost                DECIMAL(10,4),
  damage_refund_allowance         DECIMAL(10,4),
  total_fees_and_costs            DECIMAL(10,4),
  suggested_selling_price         DECIMAL(10,2),
  estimated_net_profit            DECIMAL(10,4),
  net_profit_margin_pct           DECIMAL(5,2),
  return_on_cost_pct              DECIMAL(5,2),
  break_even_price                DECIMAL(10,2),
  max_supplier_price_at_target_margin DECIMAL(10,4),
  meets_target_margin             BOOLEAN,
  reference_price_config          TEXT,
  settings_snapshot               JSONB,
  created_at                      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Opportunity Scores ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunity_scores (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID REFERENCES products(id) ON DELETE CASCADE,
  score_profit          DECIMAL(5,2),
  score_demand          DECIMAL(5,2),
  score_competition     DECIMAL(5,2),
  score_uniqueness      DECIMAL(5,2),
  score_supplier        DECIMAL(5,2),
  score_shipping_risk   DECIMAL(5,2),
  score_total           DECIMAL(5,2),
  recommendation        TEXT,
  confidence            TEXT,
  explanation           TEXT,
  strengths             TEXT[],
  risks                 TEXT[],
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Compliance Assessments ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_assessments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID REFERENCES products(id) ON DELETE CASCADE,
  status                TEXT NOT NULL,
  reasoning             TEXT,
  applicable_category   TEXT,
  action_required       TEXT,
  policy_links          JSONB DEFAULT '[]',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Generated Titles ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS generated_titles (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id              UUID REFERENCES products(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  character_count         INTEGER,
  keyword_breakdown       JSONB,
  rationale               TEXT,
  style_match_confidence  TEXT,
  is_selected             BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Research History ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS research_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  source_url  TEXT,
  product_name TEXT,
  score_total DECIMAL(5,2),
  recommendation TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_saved ON products(is_saved);
CREATE INDEX IF NOT EXISTS idx_products_offer_id ON products(offer_id);
CREATE INDEX IF NOT EXISTS idx_market_research_product_id ON market_research(product_id);
CREATE INDEX IF NOT EXISTS idx_profitability_product_id ON profitability_calculations(product_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_scores_product_id ON opportunity_scores(product_id);
CREATE INDEX IF NOT EXISTS idx_generated_titles_product_id ON generated_titles(product_id);
CREATE INDEX IF NOT EXISTS idx_research_history_created_at ON research_history(created_at DESC);

-- ─── Updated_at auto-update trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reference_prices_updated_at
  BEFORE UPDATE ON reference_prices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_title_references_updated_at
  BEFORE UPDATE ON title_references FOR EACH ROW EXECUTE FUNCTION update_updated_at();
