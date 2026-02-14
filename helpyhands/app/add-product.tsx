import { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { Colors } from '../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const categories = [
  'Furniture', 
  'Electronics', 
  'Clothing', 
  'Books', 
  'Transportation', 
  'Home & Garden',
  'Toys & Games',
  'Sports & Outdoors',
  'Other'
];

export default function AddProductScreen() {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!title || !description || !price || !category || !image) {
      Alert.alert("Missing information", "Please fill all fields and add an image");
      return;
    }

    if (!session) {
      Alert.alert("Authentication Required", "Please log in to list a product");
      return;
    }

    try {
      setUploading(true);
      
      // Use a placeholder image URL for now
      const imageUrl = image || 'https://via.placeholder.com/300';
      
      // Insert product into the database
      const { data, error } = await supabase
        .from('products')
        .insert({
          title,
          description,
          price: parseFloat(price),
          category,
          image_url: imageUrl,
          user_id: session.user.id,
          status: 'active' // Set default status as active
        })
        .select();
      
      if (error) {
        console.error('Error creating product:', error);
        Alert.alert("Error", "Failed to create product listing");
      } else {
        Alert.alert(
          "Success",
          "Your product has been listed!",
          [{ text: "OK", onPress: () => router.push('/(tabs)/my-products' as any) }]
        );
      }
      
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert("Error", "Failed to create product listing");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="arrow-left" size={20} color={Colors.light.tint} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Add Product</ThemedText>
          <View style={{ width: 20 }} />
        </View>
        
        {/* Image Picker */}
        <TouchableOpacity 
          style={styles.imagePickerContainer}
          onPress={pickImage}
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.selectedImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <FontAwesome name="camera" size={40} color="#ccc" />
              <ThemedText style={styles.imagePickerText}>Add Product Image</ThemedText>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Form */}
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Title</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Product title"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
          </View>
          
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Price (₹)</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>
          
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Category</ThemedText>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => setShowCategories(!showCategories)}
            >
              <ThemedText style={category ? styles.inputText : styles.placeholderText}>
                {category || "Select a category"}
              </ThemedText>
              <FontAwesome name="chevron-down" size={16} color="#999" />
            </TouchableOpacity>
            
            {showCategories && (
              <View style={styles.categoriesDropdown}>
                <ScrollView style={styles.categoriesList}>
                  {categories.map((cat) => (
                    <TouchableOpacity 
                      key={cat}
                      style={styles.categoryItem}
                      onPress={() => {
                        setCategory(cat);
                        setShowCategories(false);
                      }}
                    >
                      <ThemedText style={styles.categoryItemText}>{cat}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Description</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your product"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>
      
      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.submitButtonText}>List Product</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  imagePickerContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  imagePickerText: {
    marginTop: 10,
    color: '#999',
  },
  form: {
    paddingHorizontal: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  inputText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  categoriesDropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  categoriesList: {
    maxHeight: 200,
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 