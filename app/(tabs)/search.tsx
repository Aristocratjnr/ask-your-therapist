import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

// Enhanced type definition with additional metadata
type TherapistProfile = {
  id: string;
  user_id: string;
  name: string;
  bio: string;
  specialties: string[];
  credentials: string;
  experience_years: number;
  hourly_rate: string;
  photo_url: string | null;
  location: string | null;
  rating?: number;
  review_count?: number;
  languages?: string[];
  treatment_approaches?: string[];
};

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const specialties = [
    'Stroke Recovery',
    'Autism Support', 
    'Hand Therapy',
    'Pediatric OT',
    'Geriatric Care',
    'Mental Health',
    'Physical Rehabilitation',
    'Cognitive Therapy',
  ];

  // Load therapists with enhanced error handling
  const loadTherapists = async () => {
    try {
      setRefreshing(true);
      console.log('Fetching therapists...');
      
      // Simulate API call with mock data for demonstration
      // In production, replace with actual Supabase call
      const mockTherapists: TherapistProfile[] = [
        {
          id: 'b3b1c2d3-4e5f-6789-0123-456789abcde1',
          user_id: 'a1b2c3d4-5e6f-7890-1234-56789abcdef1',
          name: 'Dr. Sarah',
          bio: 'Specialized in pediatric occupational therapy with 10 years of experience helping children with developmental challenges.',
          specialties: ['Pediatric OT', 'Autism Support'],
          credentials: 'OTD, OTR/L',
          experience_years: 10,
          hourly_rate: '120',
          photo_url: 'https://randomuser.me/api/portraits/women/44.jpg',
          location: 'Accra, Ghana',
          rating: 4.8,
          review_count: 124,
          languages: ['English', 'Twi'],
          treatment_approaches: ['Sensory Integration', 'DIR/Floortime']
        },
        {
          id: 'b3b1c2d3-4e5f-6789-0123-456789abcde2',
          user_id: 'a1b2c3d4-5e6f-7890-1234-56789abcdef2',
          name: 'Dr. Aristocrat',
          bio: 'Geriatric care specialist focusing on maintaining independence and quality of life for elderly patients.',
          specialties: ['Geriatric Care', 'Physical Rehabilitation'],
          credentials: 'MOT, OTR/L',
          experience_years: 7,
          hourly_rate: '95',
          photo_url: 'https://randomuser.me/api/portraits/men/32.jpg',
          location: 'Kumasi, Ghana',
          rating: 4.9,
          review_count: 87,
          languages: ['English', 'Twi', 'Fante'],
          treatment_approaches: ['Task-Oriented', 'Cognitive Rehabilitation']
        },
        {
          id: 'b3b1c2d3-4e5f-6789-0123-456789abcde3',
          user_id: 'a1b2c3d4-5e6f-7890-1234-56789abcdef3',
          name: 'Dr. Daniella',
          bio: 'Mental health occupational therapist with expertise in trauma-informed care and anxiety disorders.',
          specialties: ['Mental Health', 'Cognitive Therapy'],
          credentials: 'OTR/L',
          experience_years: 5,
          hourly_rate: '110',
          photo_url: 'https://randomuser.me/api/portraits/women/63.jpg',
          location: 'Takoradi, Ghana',
          rating: 4.7,
          review_count: 56,
          languages: ['English', 'Fante'],
          treatment_approaches: ['CBT', 'Mindfulness-Based']
        }
      ];

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTherapists(mockTherapists);
    } catch (error) {
      console.error('Error loading therapists:', error);
      Alert.alert('Error', 'Failed to load therapists. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTherapists();
  }, []);

  const filteredTherapists = therapists.filter(therapist => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || (
      therapist.name.toLowerCase().includes(query) ||
      therapist.bio.toLowerCase().includes(query) ||
      therapist.credentials.toLowerCase().includes(query) ||
      therapist.location?.toLowerCase().includes(query) ||
      therapist.specialties.some(s => s.toLowerCase().includes(query))
    );

    const matchesSpecialty = !selectedSpecialty || 
      therapist.specialties.includes(selectedSpecialty);

    return matchesSearch && matchesSpecialty;
  });

  const handleBookAppointment = (therapistId: string) => {
    const therapist = therapists.find(t => t.id === therapistId);
    if (therapist) {
      router.push({
        pathname: '/(tabs)/booking',
        params: { therapist: JSON.stringify(therapist) }
      });
    }
  };

  const handleViewProfile = (therapistId: string) => {
    router.push(`/(tabs)/therapist?id=${therapistId}`);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Finding qualified therapists...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with solid background */}
      <View style={styles.headerSolid}>
        <Text style={styles.headerTitle}>Find Your Therapist</Text>
        <Text style={styles.headerSubtitle}>Connect with certified professionals</Text>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, specialty or location"
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearButton}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <MaterialIcons name="filter-list" size={20} color="#14b8a6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Specialty Filter Chips */}
      <View style={styles.specialtyContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialtyScrollContent}
        >
          <TouchableOpacity
            style={[styles.specialtyChip, !selectedSpecialty && styles.selectedSpecialtyChip]}
            onPress={() => setSelectedSpecialty('')}
          >
            <Text style={[styles.specialtyText, !selectedSpecialty && styles.selectedSpecialtyText]}>
              All Specialties
            </Text>
          </TouchableOpacity>
          
          {specialties.map(specialty => (
            <TouchableOpacity
              key={specialty}
              style={[styles.specialtyChip, selectedSpecialty === specialty && styles.selectedSpecialtyChip]}
              onPress={() => setSelectedSpecialty(specialty === selectedSpecialty ? '' : specialty)}
            >
              <Text style={[styles.specialtyText, selectedSpecialty === specialty && styles.selectedSpecialtyText]}>
                {specialty}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredTherapists.length} {filteredTherapists.length === 1 ? 'therapist' : 'therapists'} found
        </Text>
      </View>

      {/* Therapist List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadTherapists}
            colors={['#14b8a6']}
            tintColor="#14b8a6"
          />
        }
      >
        {filteredTherapists.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="favorite" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No therapists found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || selectedSpecialty 
                ? 'Try adjusting your search or filters'
                : 'No therapists available at this time'
              }
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedSpecialty('');
              }}
            >
              <Text style={styles.retryButtonText}>Reset Search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTherapists.map(therapist => (
            <View key={therapist.id} style={styles.therapistCard}>
              {/* Therapist Header */}
              <View style={styles.therapistHeader}>
                {therapist.photo_url ? (
                  <Image source={{ uri: therapist.photo_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {therapist.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                )}
                
                <View style={styles.therapistInfo}>
                  <View style={styles.nameRatingContainer}>
                    <Text style={styles.therapistName}>{therapist.name}</Text>
                    <View style={styles.ratingContainer}>
                      <MaterialIcons name="star" size={14} color="#f59e0b" />
                      <Text style={styles.ratingText}>
                        {therapist.rating} ({therapist.review_count})
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.metaContainer}>
                    <View style={styles.metaItem}>
                      <MaterialIcons name="location-on" size={14} color="#64748b" />
                      <Text style={styles.metaText}>{therapist.location || 'Remote'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MaterialIcons name="calendar-today" size={14} color="#64748b" />
                      <Text style={styles.metaText}>{therapist.experience_years} years exp</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>₵{therapist.hourly_rate}</Text>
                  <Text style={styles.priceLabel}>/hour</Text>
                </View>
              </View>
              
              {/* Bio and Specialties */}
              <Text style={styles.bio} numberOfLines={2}>
                {therapist.bio}
              </Text>
              
              <View style={styles.specialtiesContainer}>
                {therapist.specialties.slice(0, 3).map((specialty, index) => (
                  <View key={index} style={styles.specialtyTag}>
                    <Text style={styles.specialtyTagText}>{specialty}</Text>
                  </View>
                ))}
                {therapist.specialties.length > 3 && (
                  <View style={styles.moreSpecialties}>
                    <Text style={styles.moreSpecialtiesText}>+{therapist.specialties.length - 3}</Text>
                  </View>
                )}
              </View>
              
              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.profileButton}
                  onPress={() => handleViewProfile(therapist.id)}
                >
                  <Text style={styles.profileButtonText}>View Profile</Text>
                  <MaterialIcons name="chevron-right" size={16} color="#14b8a6" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.bookButton, styles.bookButtonSolid]}
                  onPress={() => handleBookAppointment(therapist.id)}
                >
                  <MaterialIcons name="schedule" size={16} color="#14b8a6" />
                  <Text style={styles.bookButtonText}>Book Session</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1e293b',
    marginLeft: 8,
  },
  clearButton: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  specialtyContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  specialtyScrollContent: {
    paddingHorizontal: 24,
    paddingRight: 48,
  },
  specialtyChip: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  selectedSpecialtyChip: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  specialtyText: {
    fontSize: 14,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
  },
  selectedSpecialtyText: {
    color: '#ffffff',
    fontWeight: '400',
  },
  resultsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#ffffff',
  },
  therapistCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  therapistHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  therapistInfo: {
    flex: 1,
  },
  nameRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  therapistName: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1e293b',
    marginLeft: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#14b8a6',
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
  },
  bio: {
    fontSize: 15,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 16,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  specialtyTag: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  specialtyTagText: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#14b8a6',
  },
  moreSpecialties: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  moreSpecialtiesText: {
    fontSize: 12,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  profileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#14b8a6',
    marginRight: 4,
  },
  bookButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#14b8a6',
    marginLeft: 8,
  },
  bookButtonSolid: {
    backgroundColor: 'rgba(20,184,166,0.12)',
    borderWidth: 1,
    borderColor: '#14b8a6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  headerSolid: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: '#f8fafc',
  },
});

export default SearchScreen;