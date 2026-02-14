-- Create Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active' -- 'active', 'sold', 'reserved'
);

-- Create User Profiles table (extends the default auth users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50),
    full_name VARCHAR(100),
    avatar_url TEXT,
    phone VARCHAR(20),
    bio TEXT,
    location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Favorites table (for users to save products they like)
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Create Messages table (for user communication)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Transactions table (for tracking exchanges and sales)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'sale', 'exchange', 'donation'
    status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'cancelled'
    amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create Reviews table (for user ratings)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS (Row Level Security) Policies

-- Products policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" 
ON products FOR SELECT USING (true);

CREATE POLICY "Users can insert their own products" 
ON products FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" 
ON products FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" 
ON products FOR DELETE USING (auth.uid() = user_id);

-- Profiles policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Favorites policies
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" 
ON favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" 
ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages they're involved in" 
ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Transactions policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions they're involved in" 
ON transactions FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "Users can insert transactions when they're the buyer" 
ON transactions FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update transactions they're involved in" 
ON transactions FOR UPDATE USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Reviews policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" 
ON reviews FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" 
ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews" 
ON reviews FOR UPDATE USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews" 
ON reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- Create a trigger to update product status when a transaction is completed
CREATE OR REPLACE FUNCTION update_product_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE products 
    SET status = 'sold' 
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_status_trigger
AFTER UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_product_status();

-- Create a function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id, 
    'user_' || SUBSTRING(NEW.id::text, 1, 8), 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 