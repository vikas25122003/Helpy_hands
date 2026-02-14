import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Image, Text, Dimensions } from 'react-native';
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

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { session } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Query for all active products
      let query = supabase
        .from('products')
        .select('*')
        .eq('status', 'active'); // Only show active products
      
      // Only filter by user_id if the user is logged in
      if (session?.user?.id) {
        query = query.not('user_id', 'eq', session.user.id); // Filter out current user's products
      }
      
      // Execute the query with ordering
      const { data, error } = await query.order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching products:', error);
        return;
      }
      
      // Always include sample products to ensure a good user experience
      let combinedProducts = [...sampleProducts];
      
      // Add real products if available
      if (data && data.length > 0) {
        // Filter out duplicates by ID
        const existingIds = new Set(combinedProducts.map(p => p.id));
        const uniqueRealProducts = data.filter(p => !existingIds.has(p.id));
        
        // Add the unique real products to our combined list
        combinedProducts = [...uniqueRealProducts, ...combinedProducts];
      }
      
      setProducts(combinedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts(sampleProducts); // Fallback to sample products on error
    } finally {
      setLoading(false);
    }
  };

  // For demo purposes, if the server doesn't have any products
  const sampleProducts: Product[] = [
    {
      id: '1',
      title: 'Vintage Bicycle',
      description: 'Well-maintained vintage bicycle in excellent condition. Great for city rides.',
      price: 85,
      image_url: 'https://via.placeholder.com/300',
      category: 'Transportation',
      created_at: new Date().toISOString(),
      user_id: '123',
    },
    {
      id: '2',
      title: 'Wooden Bookshelf',
      description: 'Handcrafted wooden bookshelf with 4 shelves. Slightly used but in good condition.',
      price: 45,
      image_url: 'https://via.placeholder.com/300',
      category: 'Furniture',
      created_at: new Date().toISOString(),
      user_id: '456',
    },
    {
      id: '3',
      title: 'Professional Camera',
      description: 'DSLR camera with 2 lenses. Perfect for photography enthusiasts.',
      price: 350,
      image_url: 'https://via.placeholder.com/300',
      category: 'Electronics',
      created_at: new Date().toISOString(),
      user_id: '789',
    },
  ];

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const categories = ['All', 'Furniture', 'Electronics', 'Books', 'Clothing'];

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Helpy Hands</ThemedText>
        
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/profile')}
        >
          <FontAwesome name="user-circle" size={30} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={18} color="#999" style={styles.searchIcon} />
        <ThemedText style={styles.searchText}>Search for items...</ThemedText>
      </View>
      
      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity 
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category ? styles.selectedCategory : null
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <ThemedText 
              style={[
                styles.categoryText,
                selectedCategory === category ? styles.selectedCategoryText : null
              ]}
            >
              {category}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Products */}
      <ScrollView
        style={styles.productsContainer}
        contentContainerStyle={styles.productsContent}
      >
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
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
                <ThemedText style={styles.productTitle}>{product.title}</ThemedText>
                <ThemedText style={styles.productPrice}>₹{product.price}</ThemedText>
                <ThemedText style={styles.productCategory}>{product.category}</ThemedText>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome name="shopping-basket" size={50} color="#ccc" />
            <ThemedText style={styles.emptyStateText}>
              No products found in this category
            </ThemedText>
          </View>
        )}
      </ScrollView>
      
      {/* Add Product Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push('/add-product')}
      >
        <FontAwesome name="plus" size={20} color="#fff" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#121212', // Dark background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a7ea4', // Teal color for the title
  },
  profileButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a', // Darker search box for dark theme
    borderRadius: 8,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchText: {
    color: '#999',
  },
  categoriesContainer: {
    maxHeight: 50, // Fix the height of the categories scrollview
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 15,
  },
  categoryChip: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    height: 36, // Fixed height for categories
  },
  selectedCategory: {
    backgroundColor: '#fff', // White background for selected category
  },
  categoryText: {
    color: '#fff',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#0a7ea4', // Teal text for selected category
  },
  productsContainer: {
    flex: 1,
  },
  productsContent: {
    padding: 15,
    paddingBottom: 80, // Add padding to avoid content being hidden by the add button
  },
  productCard: {
    backgroundColor: '#2a2a2a', // Darker card for dark theme
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#3a3a3a', // Background color while image loads
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#fff', // White text for dark theme
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4', // Teal color for price
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#aaa', // Light gray for secondary text
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    marginTop: 10,
    color: '#aaa', // Light gray for empty state text
    fontSize: 16,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#0a7ea4', // Teal add button
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
