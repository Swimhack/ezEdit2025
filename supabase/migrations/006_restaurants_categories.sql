-- Restaurants and Categories Tables for eKaty
-- Created: 2025-01-XX

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Emoji or icon identifier
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  email TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant-Category junction table (many-to-many)
CREATE TABLE IF NOT EXISTS restaurant_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false, -- Primary category for the restaurant
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, category_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_restaurant_categories_restaurant_id ON restaurant_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_categories_category_id ON restaurant_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default categories
INSERT INTO categories (name, slug, description, icon, display_order) VALUES
  ('Mexican', 'mexican', 'Tacos, burritos, and authentic Mexican cuisine', '🌮', 1),
  ('BBQ', 'bbq', 'Smoked meats and Texas-style barbecue', '🍖', 2),
  ('Asian', 'asian', 'Chinese, Japanese, Thai, and more', '🥢', 3),
  ('American', 'american', 'Burgers, steaks, and comfort food', '🍔', 4),
  ('Seafood', 'seafood', 'Fresh catches and coastal favorites', '🦐', 5),
  ('Indian', 'indian', 'Curries, tandoori, and spiced delights', '🍛', 6),
  ('Greek', 'greek', 'Mediterranean flavors and fresh ingredients', '🥙', 7),
  ('Breakfast', 'breakfast', 'All-day breakfast and brunch spots', '🥞', 8),
  ('Italian', 'italian', 'Pizza, pasta, and Italian classics', '🍝', 9),
  ('Chinese', 'chinese', 'Authentic Chinese and fusion dishes', '🥟', 10),
  ('Japanese', 'japanese', 'Sushi, ramen, and Japanese cuisine', '🍱', 11),
  ('Thai', 'thai', 'Spicy and flavorful Thai dishes', '🌶️', 12),
  ('Vietnamese', 'vietnamese', 'Pho, banh mi, and Vietnamese specialties', '🍜', 13),
  ('Bar', 'bar', 'Pubs, sports bars, and nightlife', '🍺', 14),
  ('Healthy', 'healthy', 'Salads, smoothies, and healthy options', '🥗', 15),
  ('Desserts', 'desserts', 'Sweet treats and dessert spots', '🍰', 16)
ON CONFLICT (slug) DO NOTHING;


