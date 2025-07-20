import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Animated } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  // Animation refs (only for fade/slide/scale for main content)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleButtonPressIn = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 0.96,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  return (
    <LinearGradient
      colors={['#f8fafc', '#e2e8f0', '#f8fafc']}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Hero Image */}
        <Animated.View
          style={[
            styles.backgroundImageSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.circularImageContainer}>
            <Image
              source={require('../../assets/images/ot.png')}
              style={styles.circularHeroImage}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        {/* Brand Badge */}
        <Animated.View
          style={[
            styles.brandBadge,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(20, 184, 166, 0.08)', 'rgba(20, 184, 166, 0.02)']}
            style={styles.brandBadgeGradient}
          >
            <MaterialIcons name="verified" size={20} color="#14b8a6" style={{ marginRight: 6 }} />
            <Text style={styles.brandBadgeText}>Trusted by 50k+ patients</Text>
          </LinearGradient>
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          Connect with certified occupational therapists for{' '}
          <Text style={styles.highlightText}>personalized, accessible care</Text>{' '}
          from anywhere
        </Animated.Text>

        {/* Feature highlights */}
        <Animated.View
          style={[
            styles.featuresContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.featureItem}>
            <View style={styles.featureIconWrap}>
              <MaterialIcons name="verified-user" size={30} color="#14b8a6" />
            </View>
            <Text style={styles.featureText}>Certified{"\n"}Therapists</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIconWrap}>
              <MaterialIcons name="schedule" size={30} color="#a855f7" />
            </View>
            <Text style={styles.featureText}>Flexible{"\n"}Scheduling</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIconWrap}>
              <MaterialIcons name="favorite" size={30} color="#ef4444" />
            </View>
            <Text style={styles.featureText}>Personalized{"\n"}Care</Text>
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          style={[
            styles.buttonSection,
            {
              transform: [{ scale: buttonScaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/sign-up')}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#14b8a6', '#0d9488', '#0f766e']}
              style={styles.primaryButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/sign-in')}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(248, 250, 252, 0.8)']}
              style={styles.secondaryButtonGradient}
            >
              <Text style={styles.secondaryButtonText}>Already have an account? </Text>
              <Text style={styles.secondaryButtonAccent}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundImageSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  circularImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#14b8a6',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    alignSelf: 'center',
    marginBottom: 12,
  },
  circularHeroImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  brandBadge: {
    marginBottom: 18,
    borderRadius: 20,
    overflow: 'hidden',
  },
  brandBadgeGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.15)',
  },
  brandBadgeText: {
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#14b8a6',
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 26,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#22223b',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.3,
    marginHorizontal: 12,
    marginBottom: 28,
  },
  highlightText: {
    color: '#14b8a6',
    fontWeight: '300',
    fontFamily: 'System',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 36,
    width: '100%',
    paddingHorizontal: 8,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.08)',
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  buttonSection: {
    paddingBottom: 32,
    alignItems: 'center',
    width: '100%',
  },
  primaryButton: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 14,
  },
  primaryButtonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  secondaryButton: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  secondaryButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
  },
  secondaryButtonAccent: {
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#14b8a6',
  },
});