import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { signUp, isLoading, error } = useAuth();

  const handleSignup = async () => {
    // Reset local error
    setLocalError(null);
    
    // Basic validation
    if (!email || !password || !confirmPassword || !username) {
      setLocalError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    if (username.length < 3) {
      setLocalError('Username must be at least 3 characters');
      return;
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }
    
    // Call signup function from AuthContext with username
    try {
      await signUp(email, password, username);
      if (!error) {
        // If no error occurred during signup, show confirmation message
        Alert.alert(
          'Verification Required',
          'Please check your email for a verification link to complete your registration.',
          [{ 
            text: 'OK',
            onPress: () => router.push('/login')
          }]
        );
      }
    } catch (err) {
      console.error('Signup error:', err);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <StatusBar style="light" />
        
        {/* Logo and Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <FontAwesome name="handshake-o" size={60} color={Colors.light.tint} />
          </View>
          <ThemedText style={styles.title}>Helpy Hands</ThemedText>
          <ThemedText style={styles.subtitle}>Join our community today</ThemedText>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <FontAwesome name="envelope" size={20} color={Colors.light.tint} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome name="user" size={20} color={Colors.light.tint} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#A0A0A0"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome name="lock" size={20} color={Colors.light.tint} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A0A0A0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome name="lock" size={20} color={Colors.light.tint} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#A0A0A0"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          {(localError || error) && (
            <ThemedText style={styles.errorText}>{localError || error}</ThemedText>
          )}

          <TouchableOpacity 
            style={styles.signupButton} 
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.signupButtonText}>Sign Up</ThemedText>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <ThemedText style={styles.loginText}>Already have an account? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <ThemedText style={styles.loginLink}>Log In</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.phoneContainer}>
            <TouchableOpacity onPress={() => router.push('/phone-signup')}>
              <ThemedText style={styles.phoneLink}>Sign up with phone number</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.tint,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    paddingHorizontal: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#333',
  },
  signupButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
    color: Colors.light.tint,
    fontWeight: 'bold',
  },
  phoneContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  phoneLink: {
    color: Colors.light.tint,
    fontWeight: 'bold',
  },
}); 