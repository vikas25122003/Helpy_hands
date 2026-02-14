-- Check and create Products table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
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
  END IF;
END
$$;

-- Check and create Profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
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
  END IF;
END
$$;

-- Check and create Favorites table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'favorites') THEN
    CREATE TABLE favorites (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, product_id)
    );
  END IF;
END
$$;

-- Check and create Messages table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END
$$;

-- Check and create Transactions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
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
  END IF;
END
$$;

-- Check and create Reviews table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    CREATE TABLE reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        reviewed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END
$$;

-- Create RLS (Row Level Security) Policies for Products
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    BEGIN
      ALTER TABLE products ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Anyone can view products" ON products;
      DROP POLICY IF EXISTS "Users can insert their own products" ON products;
      DROP POLICY IF EXISTS "Users can update their own products" ON products;
      DROP POLICY IF EXISTS "Users can delete their own products" ON products;
      
      -- Create policies
      CREATE POLICY "Anyone can view products" 
      ON products FOR SELECT USING (true);
      
      CREATE POLICY "Users can insert their own products" 
      ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update their own products" 
      ON products FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete their own products" 
      ON products FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION
      WHEN others THEN NULL;
    END;
  END IF;
END
$$;

-- Create RLS (Row Level Security) Policies for Profiles
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    BEGIN
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
      
      -- Create policies
      CREATE POLICY "Anyone can view profiles" 
      ON profiles FOR SELECT USING (true);
      
      CREATE POLICY "Users can insert their own profile" 
      ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
      
      CREATE POLICY "Users can update their own profile" 
      ON profiles FOR UPDATE USING (auth.uid() = id);
    EXCEPTION
      WHEN others THEN NULL;
    END;
  END IF;
END
$$;

-- Create RLS (Row Level Security) Policies for Favorites
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'favorites') THEN
    BEGIN
      ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
      DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
      DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;
      
      -- Create policies
      CREATE POLICY "Users can view their own favorites" 
      ON favorites FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert their own favorites" 
      ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete their own favorites" 
      ON favorites FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION
      WHEN others THEN NULL;
    END;
  END IF;
END
$$;

-- Fix trigger for user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id, 
    'user_' || SUBSTRING(NEW.id::text, 1, 8), 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 