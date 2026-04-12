-- =======================
-- TABLE DEFINITIONS
-- =======================

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT ''::text,
  image_url text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now(),
  parent_id uuid,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Safely add the ON DELETE CASCADE constraint for subcategories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_parent_id_fkey'
  ) THEN
    ALTER TABLE public.categories
    ADD CONSTRAINT categories_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- Jewellery items table
CREATE TABLE IF NOT EXISTS public.jewellery_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT ''::text,
  category text NOT NULL,
  image_url text[] DEFAULT '{}'::text[],
  gold_weight numeric DEFAULT 0,
  gold_quality text DEFAULT '14K'::text,
  base_price numeric DEFAULT 0,
  making_charges_per_gram numeric DEFAULT 500,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  diamonds jsonb DEFAULT '[]'::jsonb,
  override_diamond_costs boolean DEFAULT true,
  other_stones jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT jewellery_items_pkey PRIMARY KEY (id)
);

ALTER TABLE public.jewellery_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_jewellery_items_diamonds ON public.jewellery_items USING GIN (diamonds);
CREATE INDEX IF NOT EXISTS idx_jewellery_items_other_stones ON public.jewellery_items USING GIN (other_stones);

-- Admin settings table
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  description text DEFAULT ''::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_settings_pkey PRIMARY KEY (id)
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Diamond pricing tiers table
CREATE TABLE IF NOT EXISTS public.diamond_pricing_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  min_carat numeric NOT NULL,
  max_carat numeric NOT NULL,
  lab_grown_offset numeric NOT NULL DEFAULT 0,
  gh_vs_si_offset numeric NOT NULL DEFAULT 0,
  fg_vvs_si_offset numeric NOT NULL DEFAULT 0,
  ef_vvs_offset numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT diamond_pricing_tiers_pkey PRIMARY KEY (id)
);

ALTER TABLE public.diamond_pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Drive folder cache table
CREATE TABLE IF NOT EXISTS public.drive_folder_cache (
  path text NOT NULL,
  folder_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT drive_folder_cache_pkey PRIMARY KEY (path)
);

ALTER TABLE public.drive_folder_cache ENABLE ROW LEVEL SECURITY;

-- =======================
-- ROW LEVEL SECURITY POLICIES
-- =======================

-- Categories Policies
CREATE POLICY "Categories are publicly readable"
  ON public.categories FOR SELECT TO public USING (true);

CREATE POLICY "Only authenticated users can insert categories"
  ON public.categories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Only authenticated users can update categories"
  ON public.categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Only authenticated users can delete categories"
  ON public.categories FOR DELETE TO authenticated USING (true);


-- Jewellery Items Policies
CREATE POLICY "Jewellery items are publicly readable"
  ON public.jewellery_items FOR SELECT TO public USING (true);

CREATE POLICY "Only authenticated users can insert jewellery items"
  ON public.jewellery_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Only authenticated users can update jewellery items"
  ON public.jewellery_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Only authenticated users can delete jewellery items"
  ON public.jewellery_items FOR DELETE TO authenticated USING (true);


-- Admin Settings Policies
CREATE POLICY "Authenticated users can read admin settings"
  ON public.admin_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update admin settings"
  ON public.admin_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can insert admin settings"
  ON public.admin_settings FOR INSERT TO authenticated WITH CHECK (true);


-- Diamond Pricing Tiers Policies
CREATE POLICY "Diamond pricing tiers are publicly readable"
  ON public.diamond_pricing_tiers FOR SELECT TO public USING (true);

CREATE POLICY "Only authenticated users can insert diamond tiers"
  ON public.diamond_pricing_tiers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Only authenticated users can update diamond tiers"
  ON public.diamond_pricing_tiers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Only authenticated users can delete diamond tiers"
  ON public.diamond_pricing_tiers FOR DELETE TO authenticated USING (true);


-- Drive Folder Cache Policies
CREATE POLICY "Enable access for authenticated admins only" 
  ON public.drive_folder_cache 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() IS NOT NULL);

-- =======================
-- TRIGGERS & FUNCTIONS
-- =======================

-- Reusable function to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp trigger to admin_settings
DROP TRIGGER IF EXISTS update_admin_settings_timestamp ON public.admin_settings;
CREATE TRIGGER update_admin_settings_timestamp
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp_column();

-- Apply timestamp trigger to jewellery_items
DROP TRIGGER IF EXISTS update_jewellery_items_timestamp ON public.jewellery_items;
CREATE TRIGGER update_jewellery_items_timestamp
  BEFORE UPDATE ON public.jewellery_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp_column();

-- =======================
-- DEFAULT CORE DATA
-- =======================

INSERT INTO public.admin_settings (setting_key, setting_value, description) VALUES
  ('fallback_gold_price', '5450', 'Fallback gold price per gram in INR when API fails'),
  ('gst_rate', '0.18', 'GST rate for jewelry (18% = 0.18)')
ON CONFLICT (setting_key) DO NOTHING;