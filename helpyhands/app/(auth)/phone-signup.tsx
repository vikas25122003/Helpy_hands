import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function PhoneSignupScreen() {
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOTP = async () => {
    if (!phone) {
      setError('Please enter a phone number');
      return;
    }

    if (phone.length < 10) {
      setError('Please enter a valid phone number with country code');
      return;
    }

    if (!username && !otpSent) {
      setError('Please enter a username');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Format phone number correctly (must include country code)
      const formattedPhone = formatPhoneNumber(phone);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          data: {
            username: username,
            phone: formattedPhone
          }
        }
      });

      if (error) {
        if (error.message.includes('already') || error.message.includes('exist')) {
          setError('This phone number is already registered. Please login instead.');
        } else {
          setError(error.message);
        }
        console.error('OTP send error:', error);
      } else {
        setOtpSent(true);
        Alert.alert(
          'OTP Sent',
          'A verification code has been sent to your phone. Please enter it to verify your account.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      setError('Failed to send OTP');
      console.error('Unexpected OTP send error:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpCode) {
      setError('Please enter the OTP code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Format phone number correctly
      const formattedPhone = formatPhoneNumber(phone);
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otpCode,
        type: 'sms',
      });

      if (error) {
        setError(error.message);
        console.error('OTP verification error:', error);
        Alert.alert('Error', error.message);
      } else {
        // Successfully verified
        Alert.alert(
          'Verification Successful',
          'Your phone number has been verified successfully. You are now logged in!',
          [{ text: 'OK' }]
        );
        
        // If we need to update user profile with phone
        if (data?.user) {
          try {
            const updateData: any = { 
              phone: formattedPhone,
              username: username || `user_${data.user.id.substring(0, 8)}`
            };
            
            if (email) updateData.email = email;
            
            await supabase
              .from('profiles')
              .update(updateData)
              .eq('id', data.user.id);
          } catch (profileError) {
            console.error('Error updating profile:', profileError);
          }
        }
        
        // Navigate to home screen
        router.replace('/');
      }
    } catch (error: any) {
      setError('Failed to verify OTP');
      console.error('Unexpected OTP verification error:', error);
      Alert.alert('Error', error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format phone number (adding + if needed)
  const formatPhoneNumber = (phone: string) => {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add + if it's not already at the beginning
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
            {otpSent ? 'Verify Your Phone' : 'Sign Up with Phone'}
          </ThemedText>
        </View>

        <View style={styles.form}>
          {!otpSent ? (
            <>
              <View style={styles.inputContainer}>
                <FontAwesome name="phone" size={20} color={Colors.light.tint} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone number (with country code)"
                  placeholderTextColor="#A0A0A0"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <FontAwesome name="user" size={20} color={Colors.light.tint} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username (required)"
                  placeholderTextColor="#A0A0A0"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <FontAwesome name="envelope" size={20} color={Colors.light.tint} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email (optional)"
                  placeholderTextColor="#A0A0A0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <FontAwesome name="lock" size={20} color={Colors.light.tint} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password (optional)"
                  placeholderTextColor="#A0A0A0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <ThemedText style={styles.infoText}>
                We'll send a verification code to your phone number.
              </ThemedText>
            </>
          ) : (
            <>
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
              <ThemedText style={styles.infoText}>
                Enter the verification code we sent to {formatPhoneNumber(phone)}
              </ThemedText>
            </>
          )}

          {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={otpSent ? verifyOTP : sendOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.actionButtonText}>
                {otpSent ? 'Verify OTP' : 'Send OTP'}
              </ThemedText>
            )}
          </TouchableOpacity>

          {otpSent && (
            <TouchableOpacity 
              style={styles.resendButton} 
              onPress={sendOTP}
              disabled={isLoading}
            >
              <ThemedText style={styles.resendButtonText}>Resend Code</ThemedText>
            </TouchableOpacity>
          )}

          <View style={styles.loginContainer}>
            <ThemedText style={styles.loginText}>Already have an account? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <ThemedText style={styles.loginLink}>Log In</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.loginContainer}>
            <ThemedText style={styles.loginText}>Want to use email instead? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <ThemedText style={styles.loginLink}>Email Signup</ThemedText>
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
  actionButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
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
}); 