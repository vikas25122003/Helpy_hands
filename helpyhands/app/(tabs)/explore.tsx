import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Image, Text, Dimensions, ActivityIndicator, FlatList } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  created_at: string;
  user_id: string;
};

type Category = {
  id: string;
  name: string;
  icon: string;
};

export default function ExploreScreen() {
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [nearbyProducts, setNearbyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch trending products - build query safely
      let trendingQuery = supabase
        .from('products')
        .select('*')
        .eq('status', 'active'); // Only show active products
      
      // Only filter by user_id if the user is logged in
      if (session?.user?.id) {
        trendingQuery = trendingQuery.not('user_id', 'eq', session.user.id); // Filter out current user's products
      }
      
      // Complete and execute the trending query
      const { data: trendingData, error: trendingError } = await trendingQuery
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (trendingError) {
        console.error('Error fetching trending products:', trendingError);
        // Use sample data on error
        setTrendingProducts(sampleTrendingProducts);
      } else {
        // Combine real and sample data
        let combinedTrending = [...sampleTrendingProducts];
        
        if (trendingData && trendingData.length > 0) {
          // Filter out duplicates
          const existingIds = new Set(combinedTrending.map(p => p.id));
          const uniqueRealProducts = trendingData.filter(p => !existingIds.has(p.id));
          combinedTrending = [...uniqueRealProducts, ...combinedTrending];
        }
        
        setTrendingProducts(combinedTrending);
      }
      
      // Fetch nearby products - build query safely
      let nearbyQuery = supabase
        .from('products')
        .select('*')
        .eq('status', 'active'); // Only show active products
      
      // Only filter by user_id if the user is logged in
      if (session?.user?.id) {
        nearbyQuery = nearbyQuery.not('user_id', 'eq', session.user.id); // Filter out current user's products
      }
      
      // Complete and execute the nearby query
      const { data: nearbyData, error: nearbyError } = await nearbyQuery
        .order('created_at', { ascending: true })
        .limit(10);
        
      if (nearbyError) {
        console.error('Error fetching nearby products:', nearbyError);
        // Use sample data on error
        setNearbyProducts(sampleNearbyProducts);
      } else {
        // Combine real and sample data
        let combinedNearby = [...sampleNearbyProducts];
        
        if (nearbyData && nearbyData.length > 0) {
          // Filter out duplicates
          const existingIds = new Set(combinedNearby.map(p => p.id));
          const uniqueRealProducts = nearbyData.filter(p => !existingIds.has(p.id));
          
          // Also filter out products that are already in trending
          const trendingIds = new Set(trendingProducts.map(p => p.id));
          const uniqueProducts = uniqueRealProducts.filter(p => !trendingIds.has(p.id));
          
          combinedNearby = [...uniqueProducts, ...combinedNearby];
        }
        
        setNearbyProducts(combinedNearby);
      }
      
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to sample data
      setTrendingProducts(sampleTrendingProducts);
      setNearbyProducts(sampleNearbyProducts);
    } finally {
      setLoading(false);
    }
  };

  // For demo purposes, if the server doesn't have any products
  const sampleTrendingProducts: Product[] = [
    {
      id: '1',
      title: 'Vintage Bicycle',
      description: 'Well-maintained vintage bicycle in excellent condition.',
      price: 85,
      image_url: 'https://via.placeholder.com/300',
      category: 'Transportation',
      created_at: new Date().toISOString(),
      user_id: '123',
    },
    {
      id: '2',
      title: 'Wooden Bookshelf',
      description: 'Handcrafted wooden bookshelf with 4 shelves.',
      price: 45,
      image_url: 'https://via.placeholder.com/300',
      category: 'Furniture',
      created_at: new Date().toISOString(),
      user_id: '456',
    },
    {
      id: '3',
      title: 'Professional Camera',
      description: 'DSLR camera with 2 lenses.',
      price: 350,
      image_url: 'https://via.placeholder.com/300',
      category: 'Electronics',
      created_at: new Date().toISOString(),
      user_id: '789',
    },
  ];

  const sampleNearbyProducts: Product[] = [
    {
      id: '4',
      title: 'Antique Lamp',
      description: 'Beautiful antique lamp in working condition.',
      price: 120,
      image_url: 'https://via.placeholder.com/300',
      category: 'Home Decor',
      created_at: new Date().toISOString(),
      user_id: '101',
    },
    {
      id: '5',
      title: 'Mountain Bike',
      description: 'Slightly used mountain bike, perfect condition.',
      price: 275,
      image_url: 'https://via.placeholder.com/300',
      category: 'Sports',
      created_at: new Date().toISOString(),
      user_id: '102',
    },
    {
      id: '6',
      title: 'Gaming Console',
      description: 'Latest gaming console with two controllers.',
      price: 430,
      image_url: 'https://via.placeholder.com/300',
      category: 'Electronics',
      created_at: new Date().toISOString(),
      user_id: '103',
    },
  ];

  const categories: Category[] = [
    { id: '1', name: 'Electronics', icon: 'laptop' },
    { id: '2', name: 'Furniture', icon: 'bed' },
    { id: '3', name: 'Clothing', icon: 'tshirt' },
    { id: '4', name: 'Books', icon: 'book' },
    { id: '5', name: 'Sports', icon: 'futbol-o' },
    { id: '6', name: 'Toys', icon: 'gamepad' },
    { id: '7', name: 'Home Decor', icon: 'home' },
    { id: '8', name: 'Vehicles', icon: 'car' },
  ];

  const renderProductCard = (product: Product) => (
    <TouchableOpacity 
      key={product.id}
      style={styles.productCard}
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <Image 
        source={{ uri: product.image_url }} 
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <ThemedText style={styles.productTitle} numberOfLines={1}>{product.title}</ThemedText>
        <ThemedText style={styles.productPrice}>₹{product.price}</ThemedText>
        <ThemedText style={styles.productCategory}>{product.category}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Explore</ThemedText>
        <TouchableOpacity>
          <FontAwesome name="filter" size={24} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Search Bar */}
          <TouchableOpacity 
            style={styles.searchContainer}
            onPress={() => {
              // Will need to create this route or use existing routes
              router.push('/(tabs)' as any); 
            }}
          >
            <FontAwesome name="search" size={18} color="#999" style={styles.searchIcon} />
            <ThemedText style={styles.searchText}>Search for items...</ThemedText>
          </TouchableOpacity>

          {/* Categories */}
          <ThemedText style={styles.sectionTitle}>Categories</ThemedText>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity 
                key={category.id}
                style={styles.categoryBox}
                onPress={() => {
                  // Will need to create this route or use existing routes
                  router.push('/(tabs)' as any);
                }}
              >
                <View style={styles.categoryIconBox}>
                  <FontAwesome 
                    name={category.icon as any} 
                    size={24} 
                    color={Colors.light.tint} 
                  />
                </View>
                <ThemedText style={styles.categoryText}>{category.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Trending Products */}
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Trending Now</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsRow}
          >
            {trendingProducts.map(product => renderProductCard(product))}
          </ScrollView>

          {/* Nearby Products */}
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Nearby Items</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsRow}
          >
            {nearbyProducts.map(product => renderProductCard(product))}
          </ScrollView>
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchText: {
    color: '#999',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  seeAllText: {
    color: Colors.light.tint,
    fontSize: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 8,
  },
  categoryBox: {
    width: width / 4 - 16,
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 20,
  },
  categoryIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    textAlign: 'center',
  },
  productsRow: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  productCard: {
    width: 160,
    marginHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  productInfo: {
    padding: 8,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: 'bold',
  },
  productCategory: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  bottomPadding: {
    height: 100,
  },
});
