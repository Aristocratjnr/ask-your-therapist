import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Mail, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function VerifyEmailScreen() {
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  
  // Get params passed from sign-up
  const params = useLocalSearchParams();
  const { email, name, role, phone, userId } = params;

  // Show email in UI for confirmation
  useEffect(() => {
    console.log('Verify email params:', { email, name, role, phone, userId });
  }, []);

  const handleResendEmail = async () => {
    try {
      setResending(true);
      
      if (!email) {
        Alert.alert('Error', 'No email found. Please try signing up again.');
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email as string,
      });

      if (error) throw error;

      Alert.alert('Email Sent', `A new verification email has been sent to ${email}.`);
    } catch (error: any) {
      console.error('Resend email error:', error);
      Alert.alert('Error', 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setChecking(true);
      
      if (!email) {
        Alert.alert('Error', 'No email found. Please try signing up again.');
        return;
      }

      // Use the database function to check verification status
      const { data: verificationData, error: verifyError } = await supabase
        .rpc('check_email_verification', { user_email: email as string });

      if (verifyError) {
        console.error('Verification check error:', verifyError);
        Alert.alert('Error', 'Failed to check verification status. Please try again.');
        return;
      }

      const userVerification = verificationData?.[0];

      if (userVerification && userVerification.is_verified) {
        console.log('✅ Email verified successfully!', userVerification.verified_at);
        
        // Check if user record exists in our users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', userVerification.user_id)
          .single();

        if (!existingUser) {
          // Create user record with ALL the passed signup data
          console.log('Creating user record with signup data:', {
            id: userVerification.user_id,
            email: email as string,
            name: name as string,
            role: role as 'client' | 'therapist',
            phone: phone as string,
          });
          
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: userVerification.user_id,
              email: email as string,
              name: name as string || '',
              role: role as 'client' | 'therapist' || 'client',
              phone: phone as string || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (userError) {
            console.error('Error creating user record:', userError);
            Alert.alert('Error', 'Failed to create user profile. Please try again.');
            return;
          }
          
          console.log('✅ User record created successfully with signup data');
        }

        // 🚀 NEW: Navigate directly to setup-profile with all data (NO SESSION CREATION)
        console.log('🎯 Navigating to setup-profile with signup data...');
        router.replace({
          pathname: '/(auth)/setup-profile',
          params: {
            email: email as string,
            name: name as string,
            role: role as string,
            phone: phone as string,
            userId: userVerification.user_id,
            fromVerification: 'true' // Flag to indicate this came from verification
          }
        });
        
        return;
      } else {
        // Email not verified yet
        console.log('❌ Email not verified yet');
        Alert.alert(
          'Email Not Verified Yet',
          `Your email (${email}) has not been verified yet. Please check your email and click the verification link, then try again.`,
          [
            { text: 'Resend Email', onPress: handleResendEmail },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }

    } catch (error: any) {
      console.error('Verification check error:', error);
      Alert.alert('Error', 'Failed to check verification status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#ffffff" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Mail size={64} color="#10B981" />
        </View>

        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification link to <Text style={styles.emailText}>{email}</Text>. 
          Please click the link to verify your account and complete your registration.
        </Text>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Next steps:</Text>
          <Text style={styles.instructionText}>1. Check your email inbox</Text>
          <Text style={styles.instructionText}>2. Click the verification link</Text>
          <Text style={styles.instructionText}>3. Come back and click "Continue" below</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.continueButton, checking && styles.disabledButton]}
            onPress={handleCheckVerification}
            disabled={checking}
          >
            <CheckCircle size={20} color="#ffffff" />
            <Text style={styles.continueButtonText}>
              {checking ? 'Checking...' : 'Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resendButton, resending && styles.disabledButton]}
            onPress={handleResendEmail}
            disabled={resending}
          >
            <RefreshCw size={20} color="#10B981" />
            <Text style={styles.resendButtonText}>
              {resending ? 'Sending...' : 'Resend email'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Didn't receive the email? Check your spam folder or try resending.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backButton: {
    position: 'absolute',
    backgroundColor: '#10B981',
    borderRadius: 50,
    top: 50,
    left: 24,
    zIndex: 1,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 120,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#f0fdfa',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  instructions: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    width: '100%',
  },
  instructionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 4,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  resendButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  disabledButton: {
    opacity: 0.6,
  },
  footer: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
  },
  emailText: {
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
});
