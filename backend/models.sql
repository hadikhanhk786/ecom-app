-- run this with psql or a migration tool
-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  specs JSONB,
  price NUMERIC(12,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  images TEXT[],
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS buyer_addresses (
  id UUID PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  name TEXT,            -- Optional, e.g., "Home" or "Office"
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Fix the orders table to reference buyer_addresses instead of addresses
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_address_id_fkey,
ADD CONSTRAINT orders_address_id_fkey 
FOREIGN KEY (address_id) REFERENCES buyer_addresses(id);

CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES buyers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_cart_buyer ON cart (buyer_id);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  buyer_id UUID REFERENCES buyers(id),
  address_id UUID REFERENCES buyer_addresses(id), -- Changed from addresses to buyer_addresses
  status VARCHAR(20) DEFAULT 'pending',
  total_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  price NUMERIC(10,2) NOT NULL, -- snapshot of product price at purchase
  created_at TIMESTAMP DEFAULT NOW()
);



ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);

ALTER TABLE buyers
        ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
