import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Animated } from 'react-native';
import { router } from 'expo-router';
import { Heart, Activity, Brain, Sparkles, HandHeart, ArrowRight, Users, Shield, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const buttonSlideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    // Sequence of animations
    const animationSequence = Animated.sequence([
      // Logo entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Logo rotation
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Content and buttons entrance
      Animated.timing(buttonSlideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    // Floating animation loop
    const floatingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    animationSequence.start();
    floatingLoop.start();

    return () => {
      floatingLoop.stop();
    };
  }, []);

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const floatingTranslateY = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <LinearGradient
      colors={['#ffffff', '#f8fafc', '#ffffff']}
      style={styles.container}
    >
      {/* Background Hero Image Section */}
      <Animated.View 
        style={[
          styles.backgroundImageSection,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.backgroundImageContainer}>
          <Image
            source={require('../../assets/images/ot.png')}
            style={styles.backgroundHeroImage}
            resizeMode="cover"
          />
        </View>
        
        {/* Background Tool Indicators */}
        <Animated.View 
          style={[
            styles.backgroundToolIndicators,
            {
              transform: [{ translateY: floatingTranslateY }],
            },
          ]}
        >
          <View style={styles.clipboardIndicator} />
          <View style={styles.ballIndicator} />
        </Animated.View>
      </Animated.View>

      {/* Animated floating elements */}
      <Animated.View 
        style={[
          styles.floatingElements,
          {
            transform: [{ translateY: floatingTranslateY }],
          },
        ]}
      >
        <LinearGradient
          colors={['#60a5fa', '#3b82f6']}
          style={[styles.floatingPill, styles.pill1]}
        />
        <LinearGradient
          colors={['#f87171', '#ef4444']}
          style={[styles.floatingPill, styles.pill2]}
        />
        
        <View style={[styles.floatingIcon, styles.sparkleIcon]}>
          <Sparkles size={16} color="#f59e0b" />
        </View>
        <View style={[styles.floatingIcon, styles.brainIcon]}>
          <Brain size={16} color="#8b5cf6" />
        </View>
        <View style={[styles.floatingIcon, styles.activityIcon]}>
          <Activity size={16} color="#ef4444" />
        </View>
        <View style={[styles.floatingIcon, styles.usersIcon]}>
          <Users size={16} color="#10B981" />
        </View>
      </Animated.View>

      <View style={styles.content}>
        {/* Animated Hero Section */}
        <View style={styles.heroSection}>
          {/* <Animated.View 
            style={[
              styles.titleContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <Animated.View 
                style={[
                  styles.logoIcon,
                  {
                    transform: [{ rotate: logoRotate }],
                  },
                ]}
              >
                <Heart size={24} color="#10B981" />
              </Animated.View>
              <View style={styles.appNameContainer}>
                <Text style={styles.heroTitle}>OT</Text>
                <Text style={styles.heroTitleAccent}>Conekt</Text>
              </View>
            </View>
            <Text style={styles.tagline}>Connect • Care • Heal</Text>
            <View style={styles.titleUnderline} />
          </Animated.View> */}
          
          {/* Content now appears over the background image */}
          <View style={styles.contentSpacing} />
          
          <Animated.Text 
            style={[
              styles.subtitle,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            Connect with certified occupational therapists for personalized, accessible care from anywhere
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
              <View style={styles.featureIcon}>
                <Shield size={30} color="#10B981" />
              </View>
                <Text style={styles.featureText}>Certified {'\n'}Therapists</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Clock size={30} color="#10B981" />
              </View>
              <Text style={styles.featureText}>Flexible {'\n'}Scheduling</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Heart size={30} color="#10B981" />
              </View>
              <Text style={styles.featureText}>Personalized {'\n'}Care</Text>
            </View>
          </Animated.View>
        </View>

        {/* Animated button section */}
        <Animated.View 
          style={[
            styles.buttonSection,
            {
              transform: [{ translateY: buttonSlideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/sign-up')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#10B981', '#0d9488', '#0f766e']}
              style={styles.primaryButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <ArrowRight size={18} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.8}
          >
            <View style={styles.secondaryButtonContent}>
              <Text style={styles.secondaryButtonText}>Already have an account? </Text>
              <Text style={styles.secondaryButtonAccent}>Sign In</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  // Background image section - positioned behind everything
  backgroundImageSection: {
    position: 'absolute',
    top: 80,
    left: 32,
    right: 32,
    alignItems: 'center',
    zIndex: 0,
  },
  backgroundImageContainer: {
    width: 300,
    height: 280,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
  },
  backgroundHeroImage: {
    width: '100%',
    height: '100%',
  },
  backgroundToolIndicators: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 20,
  },
  // Floating elements - above background, below content
  floatingElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  floatingPill: {
    position: 'absolute',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  pill1: {
    width: 50,
    height: 25,
    top: height * 0.10,
    right: 40,
    transform: [{ rotate: '15deg' }],
  },
  pill2: {
    width: 50,
    height: 25,
    top: height * 0.20,
    right: 60,
    transform: [{ rotate: '-15deg' }],
  },
  floatingIcon: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  sparkleIcon: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    top: height * 0.35,
    right: 30,
  },
  brainIcon: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    top: height * 0.15,
    left: 30,
  },
  activityIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    top: height * 0.25,
    left: 50,
  },
  usersIcon: {
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
    top: height * 0.40,
    left: 20,
  },
  // Content - positioned on top
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    zIndex: 2,
  },
  heroSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  contentSpacing: {
    height: 320, // Space to account for background image + tool indicators
  },
  titleContainer: {
    alignSelf: 'flex-start',
    marginBottom: 60,
  },
  heroTitle: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    lineHeight: 52,
    letterSpacing: -1,
  },
  heroTitleAccent: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    lineHeight: 52,
    letterSpacing: -1,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#10B981',
    borderRadius: 2,
    marginTop: 12,
  },
  clipboardIndicator: {
    width: 40,
    height: 50,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ballIndicator: {
    width: 44,
    height: 44,
    backgroundColor: '#8b5cf6',
    borderRadius: 22,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  buttonSection: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  primaryButton: {
    width: '110%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
    marginBottom: 16,
  },
  primaryButtonGradient: {
    paddingVertical: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    textAlign: 'center',
  },
  secondaryButtonAccent: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
    textAlign: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(3, 156, 138, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
});
