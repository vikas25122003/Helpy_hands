import { useEffect, useState } from 'react';
import { StyleSheet, View, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Colors } from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

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

type Seller = {
  id: string;
  username: string;
  avatar_url?: string;
  rating: number;
};

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [isSendingOffer, setIsSendingOffer] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch the actual product from Supabase
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching product details:', error);
        
        // Fallback to sample product on error
        const sampleProduct: Product = {
          id: id as string,
          title: 'Vintage Bicycle',
          description: 'Well-maintained vintage bicycle in excellent condition. Great for city rides. Comes with a basket and bell. Tires are in good condition and were replaced 6 months ago. Frame has some minor scratches but overall in great shape. Pick up only, no delivery available.',
          price: 85,
          image_url: 'https://via.placeholder.com/400',
          category: 'Transportation',
          created_at: new Date().toISOString(),
          user_id: '123',
        };
        
        setProduct(sampleProduct);
        
        // Sample seller
        setSeller({
          id: '123',
          username: 'vintageCollector',
          rating: 4.8,
        });
      } else if (data) {
        // Set the product from database
        setProduct(data);
        
        // Fetch the seller information
        if (data.user_id) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', data.user_id)
            .single();
          
          if (!userError && userData) {
            setSeller({
              id: userData.id,
              username: userData.username || 'user',
              avatar_url: userData.avatar_url,
              rating: 4.5, // Default rating
            });
          } else {
            // Fallback seller data
            setSeller({
              id: data.user_id,
              username: 'seller',
              rating: 4.0,
            });
          }
        }
      } else {
        // No product found - use sample
        const sampleProduct: Product = {
          id: id as string,
          title: 'Vintage Bicycle',
          description: 'Well-maintained vintage bicycle in excellent condition. Great for city rides. Comes with a basket and bell. Tires are in good condition and were replaced 6 months ago. Frame has some minor scratches but overall in great shape. Pick up only, no delivery available.',
          price: 85,
          image_url: 'https://via.placeholder.com/400',
          category: 'Transportation',
          created_at: new Date().toISOString(),
          user_id: '123',
        };
        
        setProduct(sampleProduct);
        
        // Sample seller
        setSeller({
          id: '123',
          username: 'vintageCollector',
          rating: 4.8,
        });
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      
      // Fallback to sample product on error
      const sampleProduct: Product = {
        id: id as string,
        title: 'Vintage Bicycle',
        description: 'Well-maintained vintage bicycle in excellent condition. Great for city rides. Comes with a basket and bell. Tires are in good condition and were replaced 6 months ago. Frame has some minor scratches but overall in great shape. Pick up only, no delivery available.',
        price: 85,
        image_url: 'https://via.placeholder.com/400',
        category: 'Transportation',
        created_at: new Date().toISOString(),
        user_id: '123',
      };
      
      setProduct(sampleProduct);
      
      // Sample seller
      setSeller({
        id: '123',
        username: 'vintageCollector',
        rating: 4.8,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactSeller = () => {
    Alert.alert(
      "Contact Seller",
      "In a real app, this would open a chat with the seller. This feature is not implemented in this demo.",
      [{ text: "OK" }]
    );
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleMakeOffer = () => {
    if (!session) {
      Alert.alert(
        "Login Required",
        "You need to login to make an offer.",
        [
          { text: "Cancel" },
          { text: "Login", onPress: () => router.push('/login') }
        ]
      );
      return;
    }
    
    // Show the offer modal
    setOfferAmount(product ? product.price.toString() : '');
    setShowOfferModal(true);
  };

  const submitOffer = async () => {
    if (!offerAmount || isNaN(Number(offerAmount))) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }

    if (!product || !seller) return;

    if (!session?.user?.id) {
      Alert.alert(
        "Login Required", 
        "You need to be logged in to make an offer. Please log in and try again.",
        [{ text: "OK" }]
      );
      setShowOfferModal(false);
      return;
    }

    setIsSendingOffer(true);

    try {
      console.log(`Sending offer for product ${product.id} to seller ${seller.id}`);
      
      // Send the offer to the database
      const { data, error } = await supabase.from('messages').insert({
        sender_id: session.user.id,
        receiver_id: seller.id,
        product_id: product.id,
        content: `Offer: ₹${offerAmount}${offerNote ? ` - Note: ${offerNote}` : ''}`,
      }).select();

      if (error) {
        console.error('Error sending offer:', error);
        Alert.alert(
          "Error", 
          "There was a problem sending your offer. Please try again later.",
          [{ text: "OK" }]
        );
      } else {
        console.log('Offer sent successfully:', data);
        Alert.alert(
          "Offer Sent",
          "Your offer has been sent to the seller. They will contact you if they're interested.",
          [{ text: "OK" }]
        );
        setShowOfferModal(false);
      }
    } catch (error) {
      console.error('Error sending offer:', error);
      Alert.alert(
        "Error", 
        "There was a problem sending your offer. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSendingOffer(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ThemedText>Product not found</ThemedText>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ThemedText style={{ color: Colors.light.tint }}>Go Back</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.image_url }} 
            style={styles.productImage}
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={styles.backIconButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={toggleFavorite}
          >
            <FontAwesome 
              name={isFavorite ? "heart" : "heart-o"} 
              size={20} 
              color={isFavorite ? "red" : "#fff"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Product Info */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.title}>{product.title}</ThemedText>
            <ThemedText style={styles.price}>₹{product.price}</ThemedText>
          </View>
          
          <ThemedText style={styles.category}>{product.category}</ThemedText>
          
          <View style={styles.divider} />
          
          {/* Seller Info */}
          <View style={styles.sellerContainer}>
            <View style={styles.sellerInfo}>
              <FontAwesome name="user-circle" size={40} color={Colors.light.tint} />
              <View style={styles.sellerDetails}>
                <ThemedText style={styles.sellerName}>@{seller?.username}</ThemedText>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FontAwesome 
                      key={star} 
                      name={star <= Math.floor(seller?.rating || 0) ? "star" : "star-o"} 
                      size={14} 
                      color="#FFD700" 
                      style={{ marginRight: 2 }}
                    />
                  ))}
                  <ThemedText style={styles.ratingText}>{seller?.rating}</ThemedText>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleContactSeller}
            >
              <ThemedText style={styles.contactButtonText}>Contact</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.divider} />
          
          {/* Description */}
          <View style={styles.descriptionContainer}>
            <ThemedText style={styles.descriptionTitle}>Description</ThemedText>
            <ThemedText style={styles.description}>{product.description}</ThemedText>
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.offerButton]}
          onPress={handleMakeOffer}
        >
          <ThemedText style={styles.offerButtonText}>Make Offer</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.buyButton]}
          onPress={() => Alert.alert("Buy Now", "This feature is not implemented in this demo")}
        >
          <ThemedText style={styles.buyButtonText}>Buy Now</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Offer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showOfferModal}
        onRequestClose={() => setShowOfferModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Make an Offer</ThemedText>
            
            <View style={styles.modalInputContainer}>
              <ThemedText style={styles.modalLabel}>Your Offer (₹)</ThemedText>
              <TextInput
                style={styles.modalInput}
                value={offerAmount}
                onChangeText={setOfferAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.modalInputContainer}>
              <ThemedText style={styles.modalLabel}>Note (optional)</ThemedText>
              <TextInput
                style={[styles.modalInput, styles.noteInput]}
                value={offerNote}
                onChangeText={setOfferNote}
                placeholder="Add a note to the seller"
                placeholderTextColor="#999"
                multiline={true}
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowOfferModal(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={submitOffer}
                disabled={isSendingOffer}
              >
                {isSendingOffer ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.submitButtonText}>Send Offer</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  backIconButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  category: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  sellerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerDetails: {
    marginLeft: 10,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  contactButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  contactButtonText: {
    color: Colors.light.tint,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  actionContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 15,
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  offerButton: {
    backgroundColor: '#f0f0f0',
  },
  offerButtonText: {
    color: Colors.light.tint,
    fontWeight: 'bold',
    fontSize: 16,
  },
  buyButton: {
    backgroundColor: Colors.light.tint,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    marginTop: 20,
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInputContainer: {
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  noteInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 