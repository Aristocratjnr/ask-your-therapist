import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/contexts/MessagingContext';

type TherapistProfile = {
  id: string;
  user_id: string;
  bio: string;
  specialties: string[] | null;
  credentials: string;
  experience_years: number;
  availability: any[];
  hourly_rate: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  name: string;
  user_photo_url: string | null;
  user_location: string | null;
  user_email: string | null;
  user_phone: string | null;
};

export default function TherapistProfileScreen() {
  const { id } = useLocalSearchParams();
  const { userProfile } = useAuth();
  const { createConversation } = useMessaging();
  const [therapist, setTherapist] = useState<TherapistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadTherapistProfile();
  }, [id]);

  const loadTherapistProfile = async () => {
    try {
      // Fetch therapist profile
      const { data: therapistData, error: therapistError } = await supabase
        .from('therapist_profiles')
        .select('*')
        .eq('id', id)
        .eq('is_approved', true)
        .single();

      if (therapistError || !therapistData) {
        Alert.alert('Error', 'Therapist not found');
        router.back();
        return;
      }

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, photo_url, location, email, phone')
        .eq('id', therapistData.user_id)
        .single();

      if (userError || !userData) {
        Alert.alert('Error', 'User data not found');
        router.back();
        return;
      }

      // Merge data
      const mergedProfile = {
        ...therapistData,
        name: userData.name,
        user_photo_url: userData.photo_url,
        user_location: userData.location,
        user_email: userData.email,
        user_phone: userData.phone,
      };

      setTherapist(mergedProfile);
    } catch (error) {
      console.error('Error loading therapist profile:', error);
      Alert.alert('Error', 'Failed to load therapist profile');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = () => {
    router.push(`../(tabs)/appointments${therapist?.id}`);
  };

  const handleSendMessage = async () => {
    try {
      if (!userProfile || !therapist) {
        Alert.alert('Error', 'Please sign in to send messages');
        return;
      }

      // Create conversation using the messaging context
      const conversationId = await createConversation(therapist.user_id);
      
      router.push(`../chat/${conversationId}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    }
  };

  const handleCallTherapist = () => {
    if (therapist?.user_phone) {
      Linking.openURL(`tel:${therapist.user_phone}`);
    } else {
      Alert.alert('No Phone', 'Phone number not available');
    }
  };

  const handleVideoCall = () => {
    Alert.alert('Video Call', 'Video calling feature will be implemented soon!');
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Implement favorite functionality with backend
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#14b8a6', '#059669']}
          style={styles.loadingGradient}
        >
          <MaterialIcons name="favorite" size={32} color="#ffffff" />
        </LinearGradient>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!therapist) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Therapist not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Therapist Profile</Text>
        <TouchableOpacity style={styles.headerButton} onPress={toggleFavorite}>
          <MaterialIcons name="favorite" size={24} color={isFavorite ? "#ef4444" : "#64748b"} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            {therapist.user_photo_url ? (
              <Image source={{ uri: therapist.user_photo_url }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={['#14b8a6', '#059669']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {therapist.name?.charAt(0).toUpperCase() || 'T'}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={14} color="#ffffff" />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.therapistName}>{therapist.name}</Text>
            <Text style={styles.credentials}>{therapist.credentials}</Text>
            
            <View style={styles.ratingSection}>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={16} color="#f59e0b" />
                <Text style={styles.ratingText}>4.8</Text>
                <Text style={styles.reviewCount}>(124 reviews)</Text>
              </View>
            </View>

            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <MaterialIcons name="location-on" size={14} color="#64748b" />
                <Text style={styles.metaText}>{therapist.user_location || 'Remote'}</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="calendar-today" size={14} color="#64748b" />
                <Text style={styles.metaText}>{therapist.experience_years} years experience</Text>
              </View>
            </View>

            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>Session Fee</Text>
              <Text style={styles.priceText}>₵{therapist.hourly_rate}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCallTherapist}>
            <MaterialIcons name="phone" size={20} color="#14b8a6" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleSendMessage}>
            <MaterialIcons name="chat" size={20} color="#14b8a6" />
            <Text style={styles.actionButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleVideoCall}>
            <MaterialIcons name="videocam" size={20} color="#14b8a6" />
            <Text style={styles.actionButtonText}>Video</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{therapist.bio}</Text>
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.specialtyGrid}>
            {therapist.specialties && therapist.specialties.length > 0 ? (
              therapist.specialties.map((specialty, index) => (
                <View key={index} style={styles.specialtyChip}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))
            ) : (
              <View style={styles.specialtyChip}>
                <Text style={styles.specialtyText}>General OT</Text>
              </View>
            )}
          </View>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.availabilityContainer}>
            <View style={styles.availabilityItem}>
              <View style={styles.availableDot} />
              <Text style={styles.availabilityText}>Available today</Text>
            </View>
            <Text style={styles.availabilitySubtext}>
              Typically responds within 1 hour
            </Text>
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {/* Sample Review */}
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerAvatar}>
                <Text style={styles.reviewerInitial}>A</Text>
              </View>
              <View style={styles.reviewerInfo}>
                <Text style={styles.reviewerName}>Anonymous</Text>
                <View style={styles.reviewRating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialIcons key={star} name="star" size={12} color="#f59e0b" />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewDate}>2 days ago</Text>
            </View>
            <Text style={styles.reviewText}>
              "Excellent therapist! Very professional and helped me recover from my hand injury quickly. Highly recommended!"
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookSession}>
          <LinearGradient
            colors={['#14b8a6', '#059669']}
            style={styles.bookButtonGradient}
          >
            <MaterialIcons name="schedule" size={20} color="#ffffff" />
            <Text style={styles.bookButtonText}>Book Session</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#ffffff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: '35%',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  therapistName: {
    fontSize: 24,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
    marginBottom: 4,
  },
  credentials: {
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    marginBottom: 12,
  },
  ratingSection: {
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
  },
  reviewCount: {
    fontSize: 14,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
  },
  metaInfo: {
    gap: 8,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  metaText: {
    fontSize: 14,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
  },
  priceSection: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 28,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#14b8a6',
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    gap: 20,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#14b8a6',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    lineHeight: 22,
  },
  specialtyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyChip: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#3b82f6',
  },
  availabilityContainer: {
    gap: 8,
  },
  availabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availableDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#14b8a6',
  },
  availabilitySubtext: {
    fontSize: 12,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    marginLeft: 18,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#14b8a6',
  },
  reviewCard: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewerInitial: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#ffffff',
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
    marginBottom: 2,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
  },
  reviewText: {
    fontSize: 14,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    lineHeight: 20,
  },
  bottomActions: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  bookButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#ffffff',
  },
});
