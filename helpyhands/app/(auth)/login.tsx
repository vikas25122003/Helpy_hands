import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { signIn, isLoading, error } = useAuth();

  const handleIdentifierChange = (text: string) => {
    setIdentifier(text);
    // Check if input looks like a phone number
    const phoneRegex = /^\+?[0-9]+$/;
    setIsPhone(phoneRegex.test(text));
  };

  const handleLogin = async () => {
    setLocalError(null);
    
    if (!identifier) {
      setLocalError('Please enter your email or phone number');
      return;
    }
    
    if (isPhone) {
      handlePhoneLogin();
    } else {
      if (!password) {
        setLocalError('Please enter your password');
        return;
      }
      // Call sign in function from AuthContext
      await signIn(identifier, password);
    }
  };

  const handlePhoneLogin = async () => {
    if (otpSent) {
      verifyOTP();
      return;
    }
    
    setLocalError(null);
    
    try {
      // Format phone number
      const formattedPhone = formatPhoneNumber(identifier);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        setLocalError(error.message);
        console.error('OTP send error:', error);
      } else {
        setOtpSent(true);
        Alert.alert(
          'OTP Sent',
          'A verification code has been sent to your phone. Please enter it to log in.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      setLocalError('Failed to send OTP');
      console.error('Unexpected OTP send error:', error);
    }
  };

  const verifyOTP = async () => {
    if (!otpCode) {
      setLocalError('Please enter the OTP code');
      return;
    }

    try {
      const formattedPhone = formatPhoneNumber(identifier);
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otpCode,
        type: 'sms',
      });

      if (error) {
        setLocalError(error.message);
        console.error('OTP verification error:', error);
      } else {
        // Successfully verified and logged in
        Alert.alert('Success', 'You are now logged in!');
        // Navigation will happen automatically due to auth state change
      }
    } catch (error: any) {
      setLocalError('Failed to verify OTP');
      console.error('Unexpected OTP verification error:', error);
    }
  };

  // Helper function to format phone number
  const formatPhoneNumber = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (!phone.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <StatusBar style="light" />
        
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <FontAwesome name="handshake-o" size={60} color={Colors.light.tint} />
          </View>
          <ThemedText style={styles.title}>Helpy Hands</ThemedText>
          <ThemedText style={styles.subtitle}>
            {otpSent ? 'Enter Verification Code' : 'Welcome Back'}
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <FontAwesome 
              name={isPhone ? "phone" : "envelope"} 
              size={20} 
              color={Colors.light.tint} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              placeholder="Email or Phone Number"
              placeholderTextColor="#A0A0A0"
              value={identifier}
              onChangeText={handleIdentifierChange}
              autoCapitalize="none"
              keyboardType={isPhone ? "phone-pad" : "email-address"}
              editable={!otpSent}
            />
          </View>

          {!isPhone ? (
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
          ) : otpSent ? (
            <View style={styles.inputContainer}>
              <FontAwesome name="key" size={20} color={Colors.light.tint} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter OTP code"
                placeholderTextColor="#A0A0A0"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
              />
            </View>
          ) : null}

          {(localError || error) && (
            <ThemedText style={styles.errorText}>{localError || error}</ThemedText>
          )}

          {isPhone && otpSent && (
            <ThemedText style={styles.infoText}>
              Enter the verification code sent to {formatPhoneNumber(identifier)}
            </ThemedText>
          )}

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.loginButtonText}>
                {isPhone ? (otpSent ? 'Verify OTP' : 'Send OTP') : 'Log In'}
              </ThemedText>
            )}
          </TouchableOpacity>

          {isPhone && otpSent && (
            <TouchableOpacity 
              style={styles.resendButton} 
              onPress={handlePhoneLogin}
            >
              <ThemedText style={styles.resendButtonText}>Resend Code</ThemedText>
            </TouchableOpacity>
          )}

          <View style={styles.signupContainer}>
            <ThemedText style={styles.signupText}>Don't have an account? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <ThemedText style={styles.signupLink}>Sign Up</ThemedText>
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
    marginTop: 60,
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
  loginButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoText: {
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    color: '#666',
  },
  signupLink: {
    color: Colors.light.tint,
    fontWeight: 'bold',
  },
  resendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    padding: 10,
  },
  resendButtonText: {
    color: Colors.light.tint,
    fontSize: 14,
  },
}); 