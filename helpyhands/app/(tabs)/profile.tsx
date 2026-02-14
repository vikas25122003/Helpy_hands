import { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ActivityIndicator, ScrollView, RefreshControl, Image } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

type UserProfile = {
  id: string;
  email: string;
  username: string;
  full_name: string;
  phone: string;
  created_at: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
};

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeListings, setActiveListings] = useState(0);
  const [soldItems, setSoldItems] = useState(0);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      if (!session?.user) return;

      // Fetch profile from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'Failed to load profile');
        return;
      }
      
      if (data) {
        const userMetadata = session.user.user_metadata;
        setProfile({
          id: session.user.id,
          email: session.user.email || '',
          username: data.username || userMetadata?.username || 'user',
          full_name: data.full_name || userMetadata?.full_name || 'User',
          phone: data.phone || userMetadata?.phone || '',
          created_at: data.created_at || session.user.created_at || new Date().toISOString(),
          avatar_url: data.avatar_url,
          bio: data.bio,
          location: data.location,
        });
      }
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserStats = async () => {
    if (!session?.user) return;
    
    try {
      // Get active listings count
      const { data: activeData, error: activeError } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('user_id', session.user.id)
        .eq('status', 'active');
      
      if (!activeError) {
        setActiveListings(activeData?.length || 0);
      }
      
      // Get sold items count
      const { data: soldData, error: soldError } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('user_id', session.user.id)
        .eq('status', 'sold');
      
      if (!soldError) {
        setSoldItems(soldData?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
      fetchUserStats();
    }
  }, [session]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
    fetchUserStats();
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace('/login');
          }
        }
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.light.tint]}
            tintColor={Colors.light.tint}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="arrow-left" size={20} color={Colors.light.tint} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Profile</ThemedText>
          <View style={{ width: 20 }} />
        </View>
        
        {/* Profile Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <FontAwesome name="user-circle" size={80} color={Colors.light.tint} />
            )}
          </View>
          
          <ThemedText style={styles.name}>{profile?.full_name || 'User'}</ThemedText>
          <ThemedText style={styles.username}>@{profile?.username || 'username'}</ThemedText>
          {profile?.location && (
            <ThemedText style={styles.location}>
              <FontAwesome name="map-marker" size={14} color="#aaa" /> {profile.location}
            </ThemedText>
          )}
          {profile?.bio && (
            <ThemedText style={styles.bio}>{profile.bio}</ThemedText>
          )}
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{activeListings}</ThemedText>
              <ThemedText style={styles.statLabel}>Active Listings</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{soldItems}</ThemedText>
              <ThemedText style={styles.statLabel}>Sold Items</ThemedText>
            </View>
          </View>
        </View>
        
        {/* Settings Options */}
        <View style={styles.settingsContainer}>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/edit-profile')}>
            <FontAwesome name="user" size={22} color={Colors.light.tint} style={styles.settingIcon} />
            <ThemedText style={styles.settingText}>Edit Profile</ThemedText>
            <FontAwesome name="chevron-right" size={16} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/my-listings')}>
            <FontAwesome name="list" size={22} color={Colors.light.tint} style={styles.settingIcon} />
            <ThemedText style={styles.settingText}>My Listings</ThemedText>
            <FontAwesome name="chevron-right" size={16} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/favorites')}>
            <FontAwesome name="heart" size={22} color={Colors.light.tint} style={styles.settingIcon} />
            <ThemedText style={styles.settingText}>Favorites</ThemedText>
            <FontAwesome name="chevron-right" size={16} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/notifications')}>
            <FontAwesome name="bell" size={22} color={Colors.light.tint} style={styles.settingIcon} />
            <ThemedText style={styles.settingText}>Notifications</ThemedText>
            <FontAwesome name="chevron-right" size={16} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/privacy-security')}>
            <FontAwesome name="lock" size={22} color={Colors.light.tint} style={styles.settingIcon} />
            <ThemedText style={styles.settingText}>Privacy & Security</ThemedText>
            <FontAwesome name="chevron-right" size={16} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
            <FontAwesome name="sign-out" size={22} color="red" style={styles.settingIcon} />
            <ThemedText style={[styles.settingText, { color: 'red' }]}>Sign Out</ThemedText>
            <FontAwesome name="chevron-right" size={16} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  profileCard: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  location: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 5,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '80%',
    justifyContent: 'space-around',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.tint,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#ddd',
  },
  settingsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingIcon: {
    marginRight: 15,
    width: 22,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
  },
}); 