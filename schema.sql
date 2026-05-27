PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'House',
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  area_sqft REAL NOT NULL DEFAULT 0,
  owner_name TEXT,
  owner_phone TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('Buy', 'Sell')),
  price REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Reserved', 'Sold', 'Inactive')),
  listing_date TEXT NOT NULL DEFAULT CURRENT_DATE,
  buyer_or_seller_name TEXT,
  contact_phone TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rental_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  monthly_rent REAL NOT NULL,
  deposit REAL NOT NULL DEFAULT 0,
  lease_start TEXT,
  lease_end TEXT,
  tenant_name TEXT,
  tenant_phone TEXT,
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Maintenance', 'Inactive')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS loan_calculations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER,
  property_value REAL NOT NULL,
  down_payment_percent REAL NOT NULL,
  down_payment_amount REAL NOT NULL,
  credit_limit REAL NOT NULL,
  annual_interest_rate REAL NOT NULL,
  loan_years INTEGER NOT NULL,
  monthly_payment REAL NOT NULL,
  total_interest REAL NOT NULL,
  calculated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS profit_loss_calculations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER,
  purchase_price REAL NOT NULL,
  current_value REAL NOT NULL,
  monthly_rent REAL NOT NULL,
  monthly_expenses REAL NOT NULL,
  other_monthly_income REAL NOT NULL DEFAULT 0,
  daily_profit REAL NOT NULL,
  monthly_profit REAL NOT NULL,
  yearly_profit REAL NOT NULL,
  capital_gain_loss REAL NOT NULL,
  roi_percent REAL NOT NULL,
  calculated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_properties_search ON properties(title, address, city, owner_name);
CREATE INDEX IF NOT EXISTS idx_sale_listings_property ON sale_listings(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_listings_property ON rental_listings(property_id);
CREATE INDEX IF NOT EXISTS idx_loan_calculations_property ON loan_calculations(property_id);
CREATE INDEX IF NOT EXISTS idx_profit_loss_property ON profit_loss_calculations(property_id);
