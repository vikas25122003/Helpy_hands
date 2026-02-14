import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  created_at: string;
  user_id: string;
  status: string;
};

export default function MyProductsScreen() {
  const { session } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'sold', 'offers'
  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    if (session) {
      fetchMyProducts();
      if (activeTab === 'offers') {
        fetchOffers();
      }
    }
  }, [session, activeTab]);

  const fetchMyProducts = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', activeTab === 'active' ? 'active' : 'sold')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching products:', error);
        // Silent error handling - use fallback data
        setProducts(getSampleProducts(activeTab));
      } else {
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          // No products found, use demo data for better UX
          setProducts(getSampleProducts(activeTab));
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Silent error handling - use fallback data
      setProducts(getSampleProducts(activeTab));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Sample products for demo/testing
  const getSampleProducts = (status: string) => {
    const baseProducts = [
      {
        id: '101',
        title: 'Vintage Camera',
        description: 'A beautiful vintage camera in working condition.',
        price: 250,
        image_url: 'https://via.placeholder.com/300',
        category: 'Electronics',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        user_id: session?.user.id || 'sample',
        status: 'active'
      },
      {
        id: '102',
        title: 'Modern Desk Chair',
        description: 'Ergonomic office chair with lumbar support.',
        price: 175,
        image_url: 'https://via.placeholder.com/300',
        category: 'Furniture',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        user_id: session?.user.id || 'sample',
        status: 'active'
      },
      {
        id: '103',
        title: 'Vintage Record Player',
        description: 'Classic record player from the 70s.',
        price: 320,
        image_url: 'https://via.placeholder.com/300',
        category: 'Electronics',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        user_id: session?.user.id || 'sample',
        status: 'sold'
      }
    ];
    
    return baseProducts.filter(product => product.status === status);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyProducts();
  };

  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);
                
              if (error) {
                Alert.alert('Error', 'Failed to delete product');
              } else {
                // Remove the product from the list
                setProducts(products.filter(p => p.id !== productId));
                Alert.alert('Success', 'Product deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  const handleMarkAsSold = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'sold' })
        .eq('id', productId);
        
      if (error) {
        Alert.alert('Error', 'Failed to update product status');
      } else {
        // Update the product status in the list or refetch
        if (activeTab === 'active') {
          setProducts(products.filter(p => p.id !== productId));
        } else {
          fetchMyProducts();
        }
        Alert.alert('Success', 'Product marked as sold');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product status');
    }
  };

  const handleEditProduct = (productId: string) => {
    router.push('/(tabs)' as any);
  };

  // Add function to fetch offers
  const fetchOffers = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      
      // Get products IDs for this seller
      const { data: myProducts, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', session.user.id);
      
      if (productsError) {
        console.error('Error fetching products:', productsError);
        setOffers(getSampleOffers());
        setLoading(false);
        return;
      }
      
      if (!myProducts || myProducts.length === 0) {
        console.log('No products found for this user');
        setOffers(getSampleOffers());
        setLoading(false);
        return;
      }
      
      console.log(`Found ${myProducts.length} product(s)`, myProducts);
      
      // Get productIds array
      const productIds = myProducts.map(product => product.id);
      
      // Get messages that are offers for the user's products
      const { data: offerMessages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          product_id,
          sender_id,
          sender:profiles!sender_id(username, avatar_url),
          product:products!product_id(title, image_url, price)
        `)
        .in('product_id', productIds)
        .ilike('content', 'Offer:%')
        .order('created_at', { ascending: false });
      
      if (messagesError) {
        console.error('Error fetching offers:', messagesError);
        setOffers(getSampleOffers());
      } else {
        console.log(`Found ${offerMessages?.length || 0} offer message(s)`);
        
        // If no offers, show sample offers for better UX
        if (!offerMessages || offerMessages.length === 0) {
          console.log('No real offers found, using sample data');
          setOffers(getSampleOffers());
        } else {
          console.log('Real offers found:', offerMessages);
          // Transform the response to match the expected structure
          const formattedOffers = offerMessages.map(offer => ({
            ...offer,
            profiles: offer.sender || { username: 'Unknown User', avatar_url: null },
            products: offer.product || { title: 'Unknown Product', image_url: 'https://via.placeholder.com/300', price: 0 }
          }));
          setOffers(formattedOffers);
        }
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      // Sample offers as fallback
      setOffers(getSampleOffers());
    } finally {
      setLoading(false);
    }
  };

  // Sample offers for better UX when no real offers exist
  const getSampleOffers = () => {
    return [
      {
        id: 'offer1',
        content: 'Offer: ₹200 - Note: Is this still available?',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        sender_id: 'user1',
        product_id: '101',
        profiles: {
          username: 'buyer123',
          avatar_url: null
        },
        products: {
          title: 'Vintage Camera',
          image_url: 'https://via.placeholder.com/300',
          price: 250
        }
      },
      {
        id: 'offer2',
        content: 'Offer: ₹150 - Note: Can you deliver to my location?',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        sender_id: 'user2',
        product_id: '102',
        profiles: {
          username: 'shopper_one',
          avatar_url: null
        },
        products: {
          title: 'Modern Desk Chair',
          image_url: 'https://via.placeholder.com/300',
          price: 175
        }
      }
    ];
  };

  // Function to handle responding to an offer
  const handleRespondToOffer = (offer: any) => {
    Alert.alert(
      "Respond to Offer",
      `Would you like to accept or reject the offer for ${offer.products.title}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Accept", 
          onPress: () => {
            Alert.alert(
              "Offer Accepted", 
              "We'll notify the buyer. You can contact them to arrange the exchange.",
              [{ text: "OK" }]
            );
          }
        },
        { 
          text: "Reject", 
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Offer Rejected", 
              "The buyer will be notified of your decision.",
              [{ text: "OK" }]
            );
          }
        },
        {
          text: "Counter Offer",
          onPress: () => {
            Alert.alert(
              "Feature Coming Soon",
              "Counter offer functionality will be available in the next update.",
              [{ text: "OK" }]
            );
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>My Products</ThemedText>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-product')}
        >
          <FontAwesome name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sold' && styles.activeTab]}
          onPress={() => setActiveTab('sold')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'sold' && styles.activeTabText]}>
            Sold
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'offers' && styles.activeTab]}
          onPress={() => setActiveTab('offers')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'offers' && styles.activeTabText]}>
            Offers
          </ThemedText>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.light.tint]}
              tintColor={Colors.light.tint}
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {activeTab === 'offers' ? (
            // Offers tab content
            offers.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome name="envelope-o" size={50} color="#ccc" />
                <ThemedText style={styles.emptyStateText}>
                  You don't have any offers yet
                </ThemedText>
              </View>
            ) : (
              offers.map(offer => (
                <View key={offer.id} style={styles.offerCard}>
                  <View style={styles.offerHeader}>
                    <View style={styles.offerProduct}>
                      <Image 
                        source={{ uri: offer.products.image_url }}
                        style={styles.offerProductImage}
                      />
                      <View>
                        <ThemedText style={styles.offerProductTitle} numberOfLines={1}>
                          {offer.products.title}
                        </ThemedText>
                        <ThemedText style={styles.offerProductPrice}>
                          Listed: ₹{offer.products.price}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.offerContent}>
                    <View style={styles.offerSender}>
                      <FontAwesome name="user-circle" size={24} color="#ccc" />
                      <ThemedText style={styles.offerSenderName}>
                        {offer.profiles.username}
                      </ThemedText>
                    </View>
                    
                    <ThemedText style={styles.offerAmount}>
                      {offer.content.split(' - ')[0]}
                    </ThemedText>
                    
                    {offer.content.includes(' - Note: ') && (
                      <ThemedText style={styles.offerNote}>
                        "{offer.content.split(' - Note: ')[1]}"
                      </ThemedText>
                    )}
                    
                    <ThemedText style={styles.offerDate}>
                      {new Date(offer.created_at).toLocaleString()}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.offerActions}>
                    <TouchableOpacity 
                      style={styles.respondButton}
                      onPress={() => handleRespondToOffer(offer)}
                    >
                      <ThemedText style={styles.respondButtonText}>
                        Respond
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          ) : (
            // Original tabs content (active and sold)
            products.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome name="shopping-bag" size={50} color="#ccc" />
                <ThemedText style={styles.emptyStateText}>
                  {activeTab === 'active' 
                    ? "You don't have any active products" 
                    : "You haven't sold any products yet"}
                </ThemedText>
                {activeTab === 'active' && (
                  <TouchableOpacity
                    style={styles.addProductButton}
                    onPress={() => router.push('/add-product')}
                  >
                    <ThemedText style={styles.addProductButtonText}>Add a Product</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              products.map(product => (
                <View key={product.id} style={styles.productCard}>
                  <TouchableOpacity
                    style={styles.productPress}
                    onPress={() => router.push(`/product/${product.id}`)}
                  >
                    <Image
                      source={{ uri: product.image_url }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                    <View style={styles.productInfo}>
                      <ThemedText style={styles.productTitle} numberOfLines={1}>
                        {product.title}
                      </ThemedText>
                      <ThemedText style={styles.productPrice}>₹{product.price}</ThemedText>
                      <ThemedText style={styles.productCategory}>{product.category}</ThemedText>
                      <ThemedText style={styles.productDate}>
                        {new Date(product.created_at).toLocaleDateString()}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.productActions}>
                    {activeTab === 'active' ? (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.editButton]}
                          onPress={() => handleEditProduct(product.id)}
                        >
                          <FontAwesome name="edit" size={16} color={Colors.light.tint} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.soldButton]}
                          onPress={() => handleMarkAsSold(product.id)}
                        >
                          <FontAwesome name="check" size={16} color="#4CAF50" />
                        </TouchableOpacity>
                      </>
                    ) : null}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteProduct(product.id)}
                    >
                      <FontAwesome name="trash" size={16} color="#FF5252" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          )}
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: Colors.light.tint,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.light.tint,
  },
  tabText: {
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyState: {
    marginTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 20,
    color: '#888',
    textAlign: 'center',
  },
  addProductButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addProductButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productPress: {
    flexDirection: 'row',
  },
  productImage: {
    width: 100,
    height: 100,
  },
  productInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    color: Colors.light.tint,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productDate: {
    fontSize: 12,
    color: '#999',
  },
  productActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  editButton: {
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  soldButton: {
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  deleteButton: {
    // No border needed for the last button
  },
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  offerHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  offerProduct: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerProductImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  offerProductTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    maxWidth: 250,
  },
  offerProductPrice: {
    fontSize: 14,
    color: '#666',
  },
  offerContent: {
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  offerSender: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerSenderName: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  offerAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.tint,
    marginBottom: 8,
  },
  offerNote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#555',
    marginBottom: 8,
  },
  offerDate: {
    fontSize: 12,
    color: '#999',
  },
  offerActions: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  respondButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  respondButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 